"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  ChevronDown,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { AtsScoreLoading } from "@/components/ats-score/ats-score-loading";
import { AtsScoreResults } from "@/components/ats-score/ats-score-results";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { extractTextFromResumeFile } from "@/lib/extract-resume-text";
import type { AtsScoreResult } from "@/types/ats-score";
import { cn } from "@/lib/utils";

export function AtsScorePage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<AtsScoreResult | null>(null);
  const [inputTab, setInputTab] = useState("upload");
  const [jdOpen, setJdOpen] = useState(false);

  const hasJobDescription = jobDescription.trim().length > 0;

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const text = await extractTextFromResumeFile(file);
      setResumeText(text);
      setUploadedFileName(file.name);
      setScoreResult(null);
      toast.success(`Loaded ${file.name}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to read file";
      toast.error(message);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    multiple: false,
    disabled: isLoading,
  });

  const clearUpload = () => {
    setUploadedFileName(null);
    setResumeText("");
    setScoreResult(null);
  };

  const handleCheckScore = async () => {
    if (!resumeText.trim()) {
      toast.error("Add your resume via upload or paste text first");
      return;
    }

    setIsLoading(true);
    setScoreResult(null);

    try {
      const response = await fetch("/api/ats-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: resumeText.trim(),
          jobDescription: jobDescription.trim() || undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | AtsScoreResult
        | { error?: string; details?: string }
        | null;

      if (!response.ok) {
        const message =
          payload && "error" in payload
            ? `${payload.error}${payload.details ? `: ${payload.details}` : ""}`
            : "ATS scoring failed";
        throw new Error(message);
      }

      if (!payload || !("overall_score" in payload)) {
        throw new Error("Invalid ATS score response from server");
      }

      setScoreResult(payload);
      toast.success("ATS score calculated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ATS scoring failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <header>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            ATS Score Analyzer
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Audit your resume compliance against corporate filtering systems
            instantly.
          </p>
        </header>

        {isLoading ? (
          <AtsScoreLoading />
        ) : (
          <>
            {!scoreResult && (
              <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <Tabs
                  value={inputTab}
                  onValueChange={setInputTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload Resume</TabsTrigger>
                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="mt-4">
                    <div
                      {...getRootProps()}
                      className={cn(
                        "flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                        isDragActive
                          ? "border-violet-500 bg-violet-50"
                          : "border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50",
                      )}
                    >
                      <input {...getInputProps()} />
                      <Upload className="mb-3 size-10 text-slate-400" />
                      <p className="text-sm font-medium text-slate-700">
                        Drag & drop your resume here
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Supports .pdf and .txt files
                      </p>
                    </div>

                    {uploadedFileName && (
                      <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <FileText className="size-4 text-violet-600" />
                          <span className="font-medium">{uploadedFileName}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={clearUpload}
                          aria-label="Remove file"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="paste" className="mt-4">
                    <Label htmlFor="resume-paste" className="sr-only">
                      Paste resume text
                    </Label>
                    <Textarea
                      id="resume-paste"
                      rows={12}
                      placeholder="Paste your resume content here (plain text or LaTeX)…"
                      value={resumeText}
                      onChange={(e) => {
                        setResumeText(e.target.value);
                        setUploadedFileName(null);
                        setScoreResult(null);
                      }}
                      className="min-h-[280px] resize-y font-mono text-sm"
                    />
                  </TabsContent>
                </Tabs>

                <Collapsible open={jdOpen} onOpenChange={setJdOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-4 flex w-full items-center justify-between px-0 hover:bg-transparent"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        Target Job Description (Optional)
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          jdOpen && "rotate-180",
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <Textarea
                      rows={6}
                      placeholder="Paste the job description to enable keyword match scoring…"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      className="resize-y"
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Button
                  type="button"
                  size="lg"
                  className="mt-6 w-full bg-violet-600 hover:bg-violet-700"
                  onClick={handleCheckScore}
                  disabled={!resumeText.trim()}
                >
                  Check ATS Score
                </Button>
              </div>
            )}

            {scoreResult && (
              <>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setScoreResult(null);
                    }}
                  >
                    Run Another Check
                  </Button>
                </div>
                <AtsScoreResults
                  result={scoreResult}
                  hasJobDescription={hasJobDescription}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
