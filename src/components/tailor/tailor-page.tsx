"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Download,
  FileText,
  Loader2,
  Save,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import { LatexDiffView } from "@/components/tailor/latex-diff-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  compileLatexToPdfBlob,
  downloadPdfBlob,
  sanitizeResumeFilename,
} from "@/lib/compile-latex";
import { createEmptyResumeContent } from "@/lib/resume-content";
import { sanitizeGeneratedLatex } from "@/lib/sanitize-latex";
import { createClient } from "@/lib/supabase/client";
import { streamSsePost } from "@/lib/stream-sse";
import type { Resume, UserProfile } from "@/types/database";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center bg-[#1e1e1e] text-sm text-slate-400">
      Loading…
    </div>
  ),
});

type SavedResumeOption = {
  id: string;
  title: string;
  template: string;
  latex: string;
};

type JobLevel = "Junior" | "Mid" | "Senior";

type JdAnalysis = {
  keySkills: string[];
  requiredExperience: string;
  jobLevel: JobLevel;
};

const TAILORED_RESUME_TITLE = "Tailored Resume";

function jobLevelBadgeClass(level: JobLevel) {
  switch (level) {
    case "Junior":
      return "bg-blue-100 text-blue-700";
    case "Senior":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-violet-100 text-violet-700";
  }
}

export function TailorPage() {
  const router = useRouter();

  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [currentResumeLatex, setCurrentResumeLatex] = useState("");
  const [tailoredResumeLatex, setTailoredResumeLatex] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diffModeActive, setDiffModeActive] = useState(false);
  const [atsBeforeScore, setAtsBeforeScore] = useState<number | null>(null);
  const [atsAfterScore, setAtsAfterScore] = useState<number | null>(null);

  const [savedResumes, setSavedResumes] = useState<SavedResumeOption[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [usePasteMode, setUsePasteMode] = useState(false);
  const [jdAnalysis, setJdAnalysis] = useState<JdAnalysis | null>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpeningEditor, setIsOpeningEditor] = useState(false);

  const selectedResume = savedResumes.find((r) => r.id === selectedResumeId);
  const isComplete = tailoredResumeLatex.length > 0 && !isProcessing;
  const showJdInsights = Boolean(jdAnalysis);
  const isBusy =
    isProcessing || isAnalyzing || isExporting || isSaving || isOpeningEditor;

  const loadResumes = useCallback(async () => {
    setLoadingResumes(true);
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setLoadingResumes(false);
      return;
    }

    const { data, error } = await supabase
      .from("resumes")
      .select("id, title, template, content")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setLoadingResumes(false);

    if (error) {
      toast.error(`Could not load resumes: ${error.message}`);
      return;
    }

    const options = (data ?? []).map((row) => {
      const resume = row as Pick<Resume, "id" | "title" | "template" | "content">;
      return {
        id: resume.id,
        title: resume.title,
        template: resume.template,
        latex: resume.content?.latexSource ?? "",
      };
    });

    setSavedResumes(options);

    if (options.length > 0) {
      setSelectedResumeId((current) => {
        const match = options.find((o) => o.id === current);
        if (match) return current;
        setCurrentResumeLatex(options[0].latex);
        return options[0].id;
      });
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    if (usePasteMode || !selectedResumeId) return;
    const resume = savedResumes.find((r) => r.id === selectedResumeId);
    if (resume) {
      setCurrentResumeLatex(resume.latex);
    }
  }, [selectedResumeId, savedResumes, usePasteMode]);

  const fetchUserProfile = async (): Promise<Record<string, unknown>> => {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("You must be signed in");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      return { id: user.id, email: user.email ?? "" };
    }

    return data as UserProfile;
  };

  const fetchJdAnalysis = async (showToast = true) => {
    const response = await fetch("/api/analyze-jd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobDescription: jobDescription.trim() }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "Failed to analyze job description");
    }

    const result = (await response.json()) as JdAnalysis;
    setJdAnalysis(result);
    if (showToast) {
      toast.success("Job description analyzed");
    }
  };

  const runJdAnalysis = async () => {
    if (!jobDescription.trim()) {
      toast.error("Paste a job description first");
      return;
    }

    setIsAnalyzing(true);

    try {
      await fetchJdAnalysis(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Analysis failed";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchAtsScores = async (before: string, after: string) => {
    const response = await fetch("/api/ats-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription: jobDescription.trim(),
        beforeResume: before,
        afterResume: after,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(payload?.error ?? "Failed to calculate ATS scores");
    }

    const result = (await response.json()) as {
      beforeScore: number;
      afterScore: number;
    };

    setAtsBeforeScore(result.beforeScore);
    setAtsAfterScore(result.afterScore);
  };

  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description");
      return;
    }

    if (!currentResumeLatex.trim()) {
      toast.error("Select or paste your current resume LaTeX");
      return;
    }

    setIsProcessing(true);
    setTailoredResumeLatex("");
    setAtsBeforeScore(null);
    setAtsAfterScore(null);
    const beforeLatex = sanitizeGeneratedLatex(currentResumeLatex);

    try {
      const userProfile = await fetchUserProfile();
      let accumulated = "";

      await streamSsePost(
        "/api/tailor-resume",
        {
          jobDescription: jobDescription.trim(),
          currentResume: beforeLatex,
          userProfile,
        },
        (chunk) => {
          accumulated += chunk;
          setTailoredResumeLatex(sanitizeGeneratedLatex(accumulated));
        },
      );

      const finalLatex = sanitizeGeneratedLatex(accumulated);

      if (!finalLatex.trim()) {
        throw new Error("Tailoring returned empty content. Please try again.");
      }

      setTailoredResumeLatex(finalLatex);

      if (!jdAnalysis) {
        try {
          await fetchJdAnalysis(false);
        } catch {
          // JD insights are optional after tailoring
        }
      }

      await fetchAtsScores(beforeLatex, finalLatex);
      toast.success("Resume tailored for this job");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Tailoring failed";
      toast.error(message);
      setTailoredResumeLatex("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenInEditor = async () => {
    if (!tailoredResumeLatex.trim()) {
      toast.error("Tailor a resume first");
      return;
    }

    setIsOpeningEditor(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be signed in");
      }

      const latex = sanitizeGeneratedLatex(tailoredResumeLatex);
      const template = selectedResume?.template ?? "classic";

      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          title: TAILORED_RESUME_TITLE,
          template,
          slug: null,
          content: createEmptyResumeContent(latex),
          ats_score: atsAfterScore,
          is_public: false,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      if (!data) throw new Error("Failed to save resume");

      router.push(`/app/editor?id=${data.id}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not open editor";
      toast.error(message);
    } finally {
      setIsOpeningEditor(false);
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!tailoredResumeLatex.trim()) {
      toast.error("Tailor a resume first");
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
        throw new Error("You must be signed in");
      }

      const latex = sanitizeGeneratedLatex(tailoredResumeLatex);
      const template = selectedResume?.template ?? "classic";
      const title = selectedResume
        ? `${selectedResume.title} (Tailored)`
        : TAILORED_RESUME_TITLE;

      const { error } = await supabase.from("resumes").insert({
        user_id: user.id,
        title,
        template,
        slug: null,
        content: createEmptyResumeContent(latex),
        ats_score: atsAfterScore,
        is_public: false,
      });

      if (error) throw new Error(error.message);

      toast.success("Saved as new resume version");
      await loadResumes();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save resume";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!tailoredResumeLatex.trim()) {
      toast.error("Tailor a resume first");
      return;
    }

    setIsExporting(true);

    try {
      const blob = await compileLatexToPdfBlob(
        sanitizeGeneratedLatex(tailoredResumeLatex),
      );
      downloadPdfBlob(
        blob,
        sanitizeResumeFilename(
          selectedResume?.title ?? TAILORED_RESUME_TITLE,
        ),
      );
      toast.success("PDF downloaded");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PDF export failed";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-slate-50">
      {/* Top bar */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          Tailor Your Resume for a Job
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Paste the job description and AI will rewrite your resume to maximize
          ATS score.
        </p>
      </div>

      {/* Main grid */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24">
        <div className="grid grid-cols-12 gap-4">
          {/* Panel 1 — Job description */}
          <div className="col-span-12 flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white lg:col-span-4">
            <div className="border-b border-slate-100 px-4 py-3">
              <Label className="text-sm font-semibold">Paste Job Description</Label>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
              <Textarea
                rows={12}
                placeholder="Paste the full job posting here…"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isBusy}
                className="min-h-[200px] flex-1 resize-none"
              />

              <Button
                variant="outline"
                size="sm"
                onClick={runJdAnalysis}
                disabled={isBusy || !jobDescription.trim()}
                className="w-fit"
              >
                {isAnalyzing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Analyze JD
              </Button>

              {showJdInsights && jdAnalysis && (
                <div className="space-y-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Key Skills Required
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {jdAnalysis.keySkills.map((skill) => (
                        <Badge
                          key={skill}
                          className="border-0 bg-violet-100 text-violet-700"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Required Experience
                    </p>
                    <p className="text-sm text-slate-700">
                      {jdAnalysis.requiredExperience}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Job Level
                    </p>
                    <Badge
                      className={cn(
                        "border-0",
                        jobLevelBadgeClass(jdAnalysis.jobLevel),
                      )}
                    >
                      {jdAnalysis.jobLevel}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel 2 — Current resume */}
          <div className="col-span-12 flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white lg:col-span-3">
            <div className="border-b border-slate-100 px-4 py-3">
              <Label className="text-sm font-semibold">Your Current Resume</Label>
              {selectedResume && !usePasteMode && (
                <p className="mt-0.5 truncate text-xs text-violet-600">
                  {selectedResume.title}
                </p>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="paste-mode" className="text-xs text-slate-600">
                  Paste custom LaTeX
                </Label>
                <Switch
                  id="paste-mode"
                  checked={usePasteMode}
                  onCheckedChange={setUsePasteMode}
                  disabled={isBusy}
                />
              </div>

              {!usePasteMode ? (
                savedResumes.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No saved resumes. Enable paste mode or create one in the
                    editor.
                  </p>
                ) : (
                  <Select
                    value={selectedResumeId}
                    onValueChange={setSelectedResumeId}
                    disabled={isBusy || loadingResumes}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue
                        placeholder={
                          loadingResumes ? "Loading…" : "Select a resume"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {savedResumes.map((resume) => (
                        <SelectItem key={resume.id} value={resume.id}>
                          {resume.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )
              ) : (
                <Textarea
                  rows={6}
                  placeholder="Paste your LaTeX resume here…"
                  value={currentResumeLatex}
                  onChange={(e) => setCurrentResumeLatex(e.target.value)}
                  disabled={isBusy}
                  className="font-mono text-xs"
                />
              )}

              <div className="min-h-[220px] flex-1 overflow-hidden rounded-lg border border-slate-200">
                {!usePasteMode && (
                  <MonacoEditor
                    height="100%"
                    language="latex"
                    theme="vs-dark"
                    value={currentResumeLatex}
                    options={{
                      readOnly: true,
                      wordWrap: "on",
                      fontSize: 12,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                )}
                {usePasteMode && (
                  <MonacoEditor
                    height="100%"
                    language="latex"
                    theme="vs-dark"
                    value={currentResumeLatex}
                    onChange={(v) => setCurrentResumeLatex(v ?? "")}
                    options={{
                      readOnly: false,
                      wordWrap: "on",
                      fontSize: 12,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Panel 3 — Tailored result */}
          <div className="col-span-12 flex min-h-[420px] flex-col rounded-xl border border-slate-200 bg-white lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
              <Label className="text-sm font-semibold">Tailored Resume</Label>
              {isComplete && (
                <Tabs
                  value={diffModeActive ? "diff" : "code"}
                  onValueChange={(v) => setDiffModeActive(v === "diff")}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="code" className="text-xs">
                      Code
                    </TabsTrigger>
                    <TabsTrigger value="diff" className="text-xs">
                      Before/After Diff
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {atsBeforeScore !== null && atsAfterScore !== null && isComplete && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-emerald-800">
                    ATS Match Score
                  </p>
                  <p className="mt-1 flex items-center justify-center gap-2 text-lg font-bold text-emerald-700">
                    Before: {atsBeforeScore}%
                    <ArrowRight className="size-4" />
                    After: {atsAfterScore}%
                  </p>
                </div>
              )}

              {!tailoredResumeLatex && !isProcessing ? (
                <Card className="flex flex-1 flex-col items-center justify-center border-dashed shadow-none">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <Sparkles className="mb-3 size-10 text-slate-300" />
                    <p className="text-sm text-slate-500">
                      Your tailored resume will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : isProcessing ? (
                <div className="min-h-[280px] flex-1 rounded-lg border-2 border-violet-400 bg-slate-900 p-4 animate-pulse">
                  <pre className="h-full overflow-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-100">
                    {tailoredResumeLatex || " "}
                  </pre>
                </div>
              ) : diffModeActive ? (
                <LatexDiffView
                  before={sanitizeGeneratedLatex(currentResumeLatex)}
                  after={tailoredResumeLatex}
                  className="min-h-[280px] flex-1"
                />
              ) : (
                <div className="min-h-[280px] flex-1 overflow-hidden rounded-lg border border-slate-200">
                  <MonacoEditor
                    height="100%"
                    language="latex"
                    theme="vs-dark"
                    value={tailoredResumeLatex}
                    options={{
                      readOnly: true,
                      wordWrap: "on",
                      fontSize: 12,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              )}

              {isComplete && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="bg-violet-600 hover:bg-violet-700"
                    size="sm"
                    onClick={handleOpenInEditor}
                    disabled={isBusy}
                  >
                    {isOpeningEditor ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <FileText className="size-3.5" />
                    )}
                    Open in Editor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPdf}
                    disabled={isBusy}
                  >
                    {isExporting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    Export PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveAsNewVersion}
                    disabled={isBusy}
                  >
                    {isSaving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Save as New Version
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
        <Button
          type="button"
          size="lg"
          disabled={isBusy}
          onClick={handleTailor}
          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 py-6 text-base font-semibold text-white hover:from-violet-700 hover:to-purple-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Tailoring your resume…
            </>
          ) : (
            <>
              <Sparkles className="size-5" />
              Tailor Resume
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
