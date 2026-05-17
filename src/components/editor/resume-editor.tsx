"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Copy,
  Download,
  FileText,
  GripVertical,
  Loader2,
  Play,
  Save,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  compileLatexToPdfBlob,
  downloadPdfBlob,
  sanitizeResumeFilename,
} from "@/lib/compile-latex";
import { createClient } from "@/lib/supabase/client";
import { createEmptyResumeContent } from "@/lib/resume-content";
import {
  getTemplateLatex,
  TEMPLATES,
} from "@/lib/templates";
import type { Resume } from "@/types/database";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
      Loading editor…
    </div>
  ),
});

const DEFAULT_TEMPLATE_ID = "classic";
const MIN_PANEL_PERCENT = 25;
const MAX_PANEL_PERCENT = 75;

function createDefaultLatex() {
  return getTemplateLatex(DEFAULT_TEMPLATE_ID) ?? "";
}

export function ResumeEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeIdParam = searchParams.get("id");

  const [latexContent, setLatexContent] = useState(createDefaultLatex);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE_ID);
  const [resumeName, setResumeName] = useState("My Resume");
  const [resumeId, setResumeId] = useState<string | null>(resumeIdParam);

  const [savedLatex, setSavedLatex] = useState(createDefaultLatex);
  const [savedName, setSavedName] = useState("My Resume");
  const [savedTemplate, setSavedTemplate] = useState(DEFAULT_TEMPLATE_ID);

  const [leftPanelPercent, setLeftPanelPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const [compiling, setCompiling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copying, setCopying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingResume, setLoadingResume] = useState(Boolean(resumeIdParam));

  const isBusy = compiling || exporting || copying || saving;

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [lastCompiled, setLastCompiled] = useState<Date | null>(null);

  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfUrlRef = useRef<string | null>(null);

  const isDirty =
    latexContent !== savedLatex ||
    resumeName !== savedName ||
    selectedTemplate !== savedTemplate;

  const applyTemplate = useCallback((templateId: string) => {
    const latex = getTemplateLatex(templateId);
    if (!latex) return;
    setLatexContent(latex);
    setSelectedTemplate(templateId);
  }, []);

  const loadResume = useCallback(async () => {
    if (!resumeIdParam) {
      setLoadingResume(false);
      return;
    }

    setLoadingResume(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeIdParam)
      .single();

    setLoadingResume(false);

    if (error || !data) {
      toast.error(error?.message ?? "Resume not found");
      return;
    }

    const resume = data as Resume;
    const latex =
      resume.content?.latexSource ??
      getTemplateLatex(resume.template) ??
      createDefaultLatex();

    setResumeId(resume.id);
    setResumeName(resume.title);
    setSelectedTemplate(resume.template);
    setLatexContent(latex);
    setSavedLatex(latex);
    setSavedName(resume.title);
    setSavedTemplate(resume.template);
  }, [resumeIdParam]);

  useEffect(() => {
    loadResume();
  }, [loadResume]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  const handleTemplateChange = (templateId: string) => {
    if (templateId === selectedTemplate) return;

    if (isDirty) {
      setPendingTemplate(templateId);
      setTemplateDialogOpen(true);
      return;
    }

    applyTemplate(templateId);
  };

  const confirmTemplateChange = () => {
    if (pendingTemplate) {
      applyTemplate(pendingTemplate);
    }
    setPendingTemplate(null);
    setTemplateDialogOpen(false);
  };

  const handleDividerMouseDown = () => setIsDragging(true);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const percent = ((event.clientX - rect.left) / rect.width) * 100;
      setLeftPanelPercent(
        Math.min(MAX_PANEL_PERCENT, Math.max(MIN_PANEL_PERCENT, percent)),
      );
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const setPreviewFromBlob = useCallback((blob: Blob) => {
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
    }

    const url = URL.createObjectURL(blob);
    pdfUrlRef.current = url;
    setPdfUrl(url);
    setLastCompiled(new Date());
  }, []);

  const handleCompile = async () => {
    setCompiling(true);

    try {
      const blob = await compileLatexToPdfBlob(latexContent);
      setPreviewFromBlob(blob);
      toast.success("Resume compiled successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Compilation failed";
      toast.error(message);
    } finally {
      setCompiling(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);

    try {
      const blob = await compileLatexToPdfBlob(latexContent);
      downloadPdfBlob(blob, sanitizeResumeFilename(resumeName));
      setPreviewFromBlob(blob);
      toast.success("PDF downloaded");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PDF export failed";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLatex = async () => {
    setCopying(true);

    try {
      await navigator.clipboard.writeText(latexContent);
      toast.success("LaTeX copied to clipboard");
    } catch {
      toast.error("Failed to copy LaTeX to clipboard");
    } finally {
      setCopying(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setSaving(false);
      toast.error("You must be signed in to save");
      router.push("/auth/login");
      return;
    }

    const resumeFields = {
      title: resumeName.trim() || "My Resume",
      template: selectedTemplate,
      slug: null,
      content: createEmptyResumeContent(latexContent),
      ats_score: null,
      is_public: false,
    };

    let errorMessage: string | null = null;

    if (resumeId) {
      const { error } = await supabase
        .from("resumes")
        .update(resumeFields)
        .eq("id", resumeId)
        .eq("user_id", user.id);

      if (error) errorMessage = error.message;
    } else {
      const { data, error } = await supabase
        .from("resumes")
        .insert({ ...resumeFields, user_id: user.id })
        .select("id")
        .single();

      if (error) {
        errorMessage = error.message;
      } else if (data) {
        setResumeId(data.id);
        router.replace(`/app/editor?id=${data.id}`, { scroll: false });
      }
    }

    setSaving(false);

    if (errorMessage) {
      toast.error(errorMessage);
      return;
    }

    setSavedLatex(latexContent);
    setSavedName(resumeName);
    setSavedTemplate(selectedTemplate);
    toast.success("Resume saved");
  };

  const handleLoadMyInfo = () => {
    toast("Load My Info coming soon", { icon: "ℹ️" });
  };

  if (loadingResume) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          "flex h-[calc(100vh-4rem)] overflow-hidden bg-white",
          isDragging && "cursor-col-resize select-none",
        )}
      >
        {/* Left panel — editor */}
        <div
          className="flex min-w-0 flex-col border-r border-slate-200"
          style={{ width: `${leftPanelPercent}%` }}
        >
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <Select
              value={selectedTemplate}
              onValueChange={handleTemplateChange}
              disabled={isBusy}
            >
              <SelectTrigger className="w-[140px] bg-white" size="sm">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMyInfo}
              disabled={isBusy}
            >
              <User className="size-3.5" />
              Load My Info
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLatex}
              disabled={isBusy}
            >
              {copying ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Copy className="size-3.5" />
              )}
              Copy LaTeX
            </Button>

            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleSave}
              disabled={isBusy}
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              Save
            </Button>

            <Input
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              className="ml-auto h-8 max-w-[180px] bg-white text-sm"
              placeholder="Resume name"
            />
          </div>

          <div className="min-h-0 flex-1">
            <MonacoEditor
              height="100%"
              language="latex"
              theme="vs-dark"
              value={latexContent}
              onChange={(value) => setLatexContent(value ?? "")}
              options={{
                wordWrap: "on",
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>
        </div>

        {/* Draggable divider */}
        <button
          type="button"
          aria-label="Resize panels"
          onMouseDown={handleDividerMouseDown}
          className={cn(
            "flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-200 transition-colors hover:bg-violet-300",
            isDragging && "bg-violet-400",
          )}
        >
          <GripVertical className="size-3 text-slate-500" />
        </button>

        {/* Right panel — preview */}
        <div
          className="flex min-w-0 flex-1 flex-col"
          style={{ width: `${100 - leftPanelPercent}%` }}
        >
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleCompile}
              disabled={isBusy}
            >
              {compiling ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Compile & Preview
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isBusy}
            >
              {exporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Export PDF
            </Button>

            <span className="ml-auto text-xs text-slate-500">
              {lastCompiled
                ? `Last compiled ${format(lastCompiled, "h:mm a")}`
                : "Not compiled yet"}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
            {!pdfUrl ? (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-center">
                <FileText className="mb-3 size-10 text-slate-400" />
                <p className="max-w-xs text-sm text-slate-500">
                  Click &apos;Compile &amp; Preview&apos; to see your resume
                </p>
              </div>
            ) : (
              <iframe
                title="Resume preview"
                src={pdfUrl}
                className="h-full min-h-[600px] w-full rounded-lg border border-slate-200 bg-white shadow-sm"
              />
            )}
          </div>
        </div>
      </div>

      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch template?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Switching templates will replace your
              current LaTeX with the selected template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setPendingTemplate(null);
                setTemplateDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={confirmTemplateChange}
            >
              Switch template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
