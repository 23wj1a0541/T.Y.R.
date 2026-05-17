"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Lightbulb,
  ListChecks,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { compileLatexToPdfBlob } from "@/lib/compile-latex";
import { createEmptyResumeContent } from "@/lib/resume-content";
import { sanitizeGeneratedLatex } from "@/lib/sanitize-latex";
import { createClient } from "@/lib/supabase/client";
import { streamGenerateResume } from "@/lib/stream-generate-resume";
import { getTemplateById, TEMPLATES } from "@/lib/templates";
import type { UserProfile } from "@/types/database";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
      Loading editor…
    </div>
  ),
});

const DEFAULT_TEMPLATE = "classic";
const AI_RESUME_TITLE = "AI Generated Resume";

const TIPS = [
  {
    icon: Target,
    text: "Mention metrics and scale where possible",
  },
  {
    icon: ListChecks,
    text: "List your primary stack clearly",
  },
  {
    icon: Lightbulb,
    text: "Specify your target job role",
  },
] as const;

export function GeneratePage() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_TEMPLATE);
  const [loadProfileToggle, setLoadProfileToggle] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLatex, setGeneratedLatex] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const [isCompiling, setIsCompiling] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pdfUrlRef = useRef<string | null>(null);
  const selectedTemplateMeta = getTemplateById(selectedTemplate);

  const isComplete = generatedLatex.length > 0 && !isGenerating;
  const isBusy = isGenerating || isCompiling || isSaving;

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }
    };
  }, []);

  const fetchUserProfile = async (): Promise<Record<string, unknown>> => {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("You must be signed in to generate a resume");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      toast.error(`Could not load profile: ${error.message}`);
      return { id: user.id, email: user.email ?? "" };
    }

    if (!data) {
      return { id: user.id, email: user.email ?? "" };
    }

    return data as UserProfile;
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your background first");
      return;
    }

    setIsGenerating(true);
    setGeneratedLatex("");
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current);
      pdfUrlRef.current = null;
    }
    setPdfBlobUrl(null);

    try {
      let userProfile: Record<string, unknown> = {};

      if (loadProfileToggle) {
        userProfile = await fetchUserProfile();
      } else {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("You must be signed in to generate a resume");
        }

        userProfile = { id: user.id, email: user.email ?? "" };
      }

      let accumulated = "";

      await streamGenerateResume(
        {
          description: description.trim(),
          template: selectedTemplate,
          userProfile,
        },
        (chunk) => {
          accumulated += chunk;
          setGeneratedLatex(sanitizeGeneratedLatex(accumulated));
        },
      );

      setGeneratedLatex(sanitizeGeneratedLatex(accumulated));

      if (!accumulated.trim()) {
        throw new Error("Groq returned an empty response. Please try again.");
      }

      toast.success("Resume generated with Groq AI");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Generation failed";
      toast.error(message);
      setGeneratedLatex("");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenInEditor = async () => {
    if (!generatedLatex.trim()) {
      toast.error("Generate a resume first");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be signed in to save");
      }

      const latex = sanitizeGeneratedLatex(generatedLatex);

      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: AI_RESUME_TITLE,
          template: selectedTemplate,
          slug: null,
          content: createEmptyResumeContent(latex),
          ats_score: null,
          is_public: false,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to save resume");

      toast.success("Opening in editor…");
      router.push(`/app/editor?id=${data.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save resume";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompilePreview = async () => {
    if (!generatedLatex.trim()) {
      toast.error("Generate a resume first");
      return;
    }

    setIsCompiling(true);

    try {
      const blob = await compileLatexToPdfBlob(
        sanitizeGeneratedLatex(generatedLatex),
      );

      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
      }

      const url = URL.createObjectURL(blob);
      pdfUrlRef.current = url;
      setPdfBlobUrl(url);
      toast.success("PDF preview ready");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Compilation failed";
      toast.error(message);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[2fr_3fr]">
        {/* Left column — inputs */}
        <div className="flex min-h-0 flex-col overflow-y-auto border-r border-slate-200 bg-white p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Generate Resume with AI
            </h2>
            <p className="text-sm text-slate-500">
              Describe your experience and let Groq AI engineer your complete
              resume.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="description">Tell us about yourself...</Label>
              <Textarea
                id="description"
                rows={8}
                placeholder="E.g. I'm a 2024 Computer Science graduate from VIT. I did an internship at a startup where I built a REST API. I'm good at Python, React, and SQL. Looking for backend developer roles."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isBusy}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Resume template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
                disabled={isBusy}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplateMeta && (
                <p className="text-xs text-slate-500">
                  {selectedTemplateMeta.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="load-profile" className="text-sm font-medium">
                  Load from My Profile
                </Label>
                <p className="text-xs text-slate-500">
                  Include Supabase profile data in the Groq prompt
                </p>
              </div>
              <Switch
                id="load-profile"
                checked={loadProfileToggle}
                onCheckedChange={setLoadProfileToggle}
                disabled={isBusy}
              />
            </div>

            <Button
              type="button"
              size="lg"
              disabled={isBusy || !description.trim()}
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate Resume
                </>
              )}
            </Button>

            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Pro-Tips for Better Generation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {TIPS.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <div
                      key={tip.text}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-violet-600" />
                      <span>{tip.text}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right column — output */}
        <div className="flex min-h-0 flex-col overflow-y-auto bg-slate-50 p-6">
          {!generatedLatex && !isGenerating ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-violet-100">
                <Sparkles className="size-8 text-violet-600" />
              </div>
              <p className="mt-4 max-w-sm text-sm text-slate-500">
                Your generated resume will appear here
              </p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              {isGenerating ? (
                <div
                  className={cn(
                    "min-h-[320px] flex-1 rounded-lg border-2 border-violet-400 bg-slate-900 p-4 animate-pulse",
                  )}
                >
                  <pre className="h-full overflow-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-100">
                    {generatedLatex || " "}
                  </pre>
                </div>
              ) : (
                <div className="min-h-[320px] flex-1 overflow-hidden rounded-lg border border-slate-200 shadow-sm">
                  <MonacoEditor
                    height="100%"
                    language="latex"
                    theme="vs-dark"
                    value={generatedLatex}
                    options={{
                      readOnly: true,
                      wordWrap: "on",
                      fontSize: 13,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 12 },
                    }}
                  />
                </div>
              )}

              {isComplete && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="bg-violet-600 hover:bg-violet-700"
                    onClick={handleOpenInEditor}
                    disabled={isBusy}
                  >
                    {isSaving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                    Open in Editor
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCompilePreview}
                    disabled={isBusy}
                  >
                    {isCompiling ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null}
                    Compile Preview
                  </Button>
                </div>
              )}

              {pdfBlobUrl && (
                <iframe
                  title="Compiled resume preview"
                  src={pdfBlobUrl}
                  className="h-[min(600px,50vh)] w-full rounded-lg border border-slate-200 bg-white shadow-sm"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
