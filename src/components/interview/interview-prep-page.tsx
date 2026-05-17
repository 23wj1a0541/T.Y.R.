"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ClipboardCopy,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

import { FeedbackMarkdown } from "@/components/interview/feedback-markdown";
import { StarHighlightedAnswer } from "@/components/interview/star-highlighted-answer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  difficultyBadgeClass,
  extractSuggestedStarAnswer,
  parseRatingStars,
  QUESTION_COUNT_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  resumeContentToPlainText,
  typeBadgeClass,
} from "@/lib/interview-utils";
import { createClient } from "@/lib/supabase/client";
import { streamSsePost } from "@/lib/stream-sse";
import type { Resume, ResumeContent } from "@/types/database";
import type { InterviewQuestion, InterviewQuestionType } from "@/types/interview";

type SavedResumeOption = {
  id: string;
  title: string;
  content: ResumeContent;
  latex: string;
};

type ChatMessage = {
  id: string;
  sender: "interviewer" | "user" | "feedback";
  text: string;
};

type MockSummary = {
  averageRating: number;
  questionsAnswered: number;
  ratings: number[];
};

const MOCK_QUESTION_COUNT = 10;

function typeLabel(type: InterviewQuestionType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function InterviewPrepPage() {
  const [activeTab, setActiveTab] = useState("question-bank");

  const [savedResumes, setSavedResumes] = useState<SavedResumeOption[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [countSliderIndex, setCountSliderIndex] = useState(0);
  const questionCount = QUESTION_COUNT_OPTIONS[countSliderIndex];

  const [typeFilters, setTypeFilters] = useState<Set<InterviewQuestionType>>(
    () => new Set(QUESTION_TYPE_OPTIONS.map((t) => t.value)),
  );

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceQuestion, setPracticeQuestion] = useState("");
  const [practiceAnswer, setPracticeAnswer] = useState("");

  const [mockActive, setMockActive] = useState(false);
  const [mockSummary, setMockSummary] = useState<MockSummary | null>(null);
  const [mockQuestions, setMockQuestions] = useState<InterviewQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mockAnswer, setMockAnswer] = useState("");
  const [isMockSubmitting, setIsMockSubmitting] = useState(false);
  const [isStartingMock, setIsStartingMock] = useState(false);
  const [sessionRatings, setSessionRatings] = useState<number[]>([]);

  const [starQuestion, setStarQuestion] = useState("");
  const [starDraft, setStarDraft] = useState("");
  const [starResult, setStarResult] = useState("");
  const [isStarImproving, setIsStarImproving] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const selectedResume = savedResumes.find((r) => r.id === selectedResumeId);

  const resumeText = useMemo(() => {
    if (!selectedResume) return "";
    return resumeContentToPlainText(
      selectedResume.content,
      selectedResume.latex,
    );
  }, [selectedResume]);

  const filteredQuestions = useMemo(
    () => questions.filter((q) => typeFilters.has(q.type)),
    [questions, typeFilters],
  );

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
      .select("id, title, content")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setLoadingResumes(false);

    if (error) {
      toast.error(`Could not load resumes: ${error.message}`);
      return;
    }

    const options = (data ?? []).map((row) => {
      const resume = row as Pick<Resume, "id" | "title" | "content">;
      return {
        id: resume.id,
        title: resume.title,
        content: resume.content ?? {
          summary: null,
          workExperience: [],
          education: [],
          projects: [],
          skills: [],
        },
        latex: resume.content?.latexSource ?? "",
      };
    });

    setSavedResumes(options);

    if (options.length > 0) {
      setSelectedResumeId((current) => {
        if (options.some((o) => o.id === current)) return current;
        return options[0].id;
      });
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  const scrollChatToBottom = useCallback(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (mockActive) {
      scrollChatToBottom();
    }
  }, [chatMessages, mockActive, scrollChatToBottom]);

  const validateSetup = (): boolean => {
    if (!selectedResumeId || !resumeText.trim()) {
      toast.error("Select a resume with content first");
      return false;
    }
    if (!jobDescription.trim()) {
      toast.error("Paste a target job description");
      return false;
    }
    return true;
  };

  const fetchQuestions = async (count: number): Promise<InterviewQuestion[]> => {
    const response = await fetch("/api/interview/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText: resumeText.trim(),
        jobDescription: jobDescription.trim(),
        count,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { questions?: InterviewQuestion[]; error?: string }
      | null;

    if (!response.ok) {
      throw new Error(payload?.error ?? "Failed to generate questions");
    }

    if (!payload?.questions?.length) {
      throw new Error("No interview questions were returned");
    }

    return payload.questions;
  };

  const handleGenerateQuestions = async () => {
    if (!validateSetup()) return;

    setIsGeneratingQuestions(true);
    setQuestions([]);

    try {
      const generated = await fetchQuestions(questionCount);
      setQuestions(generated);
      toast.success(`Generated ${generated.length} questions`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Question generation failed";
      toast.error(message);
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const toggleTypeFilter = (type: InterviewQuestionType, checked: boolean) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(type);
      } else {
        next.delete(type);
      }
      return next;
    });
  };

  const openPractice = (question: InterviewQuestion) => {
    setPracticeQuestion(question.question);
    setPracticeAnswer("");
    setPracticeOpen(true);
  };

  const routeToStarCoach = () => {
    setActiveTab("star-coach");
    setStarQuestion(practiceQuestion);
    setStarDraft(practiceAnswer);
    setPracticeOpen(false);
    toast.success("Loaded into STAR Coach — click Improve with STAR when ready");
  };

  const streamFeedback = async (
    question: string,
    answer: string,
    onChunk: (text: string) => void,
  ): Promise<string> => {
    let accumulated = "";

    await streamSsePost(
      "/api/interview/feedback",
      {
        question,
        answer,
        jobContext: jobDescription.trim() || "General professional role",
      },
      (chunk) => {
        accumulated += chunk;
        onChunk(chunk);
      },
    );

    return accumulated;
  };

  const handleStartMockInterview = async () => {
    if (!validateSetup()) return;

    setIsStartingMock(true);
    setMockSummary(null);
    setSessionRatings([]);
    setChatMessages([]);
    setQuestionIndex(0);
    setMockAnswer("");

    try {
      const generated = await fetchQuestions(MOCK_QUESTION_COUNT);
      setMockQuestions(generated);
      setChatMessages([
        {
          id: crypto.randomUUID(),
          sender: "interviewer",
          text: generated[0].question,
        },
      ]);
      setMockActive(true);
      toast.success("Mock interview started");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start mock interview";
      toast.error(message);
    } finally {
      setIsStartingMock(false);
    }
  };

  const handleSendMockAnswer = async () => {
    const trimmed = mockAnswer.trim();
    if (!trimmed || isMockSubmitting) return;

    const currentQuestion = mockQuestions[questionIndex];
    if (!currentQuestion) return;

    setIsMockSubmitting(true);

    const userMessageId = crypto.randomUUID();
    const feedbackMessageId = crypto.randomUUID();

    setChatMessages((prev) => [
      ...prev,
      { id: userMessageId, sender: "user", text: trimmed },
      { id: feedbackMessageId, sender: "feedback", text: "" },
    ]);
    setMockAnswer("");

    try {
      const fullFeedback = await streamFeedback(
        currentQuestion.question,
        trimmed,
        (chunk) => {
          setChatMessages((prev) =>
            prev.map((m) =>
              m.id === feedbackMessageId
                ? { ...m, text: m.text + chunk }
                : m,
            ),
          );
        },
      );

      const rating = parseRatingStars(fullFeedback);
      if (rating > 0) {
        setSessionRatings((prev) => [...prev, rating]);
      }

      const nextIndex = questionIndex + 1;

      if (nextIndex < mockQuestions.length) {
        setQuestionIndex(nextIndex);
        setChatMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "interviewer",
            text: mockQuestions[nextIndex].question,
          },
        ]);
      } else {
        toast.success("You completed all mock interview questions");
      }
    } catch (error) {
      setChatMessages((prev) =>
        prev.filter((m) => m.id !== feedbackMessageId),
      );
      const message =
        error instanceof Error ? error.message : "Feedback stream failed";
      toast.error(message);
    } finally {
      setIsMockSubmitting(false);
    }
  };

  const handleEndMockInterview = () => {
    const ratings =
      sessionRatings.length > 0
        ? sessionRatings
        : chatMessages
            .filter((m) => m.sender === "feedback")
            .map((m) => parseRatingStars(m.text))
            .filter((r) => r > 0);

    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10,
          ) / 10
        : 0;

    setMockSummary({
      averageRating,
      questionsAnswered: ratings.length,
      ratings,
    });
    setMockActive(false);
    setChatMessages([]);
    setMockQuestions([]);
    setQuestionIndex(0);
    setMockAnswer("");
  };

  const handleImproveWithStar = async () => {
    if (!starQuestion.trim()) {
      toast.error("Enter the interview question");
      return;
    }
    if (!starDraft.trim()) {
      toast.error("Paste your draft answer first");
      return;
    }

    setIsStarImproving(true);
    setStarResult("");

    try {
      let full = "";
      await streamFeedback(starQuestion.trim(), starDraft.trim(), (chunk) => {
        full += chunk;
        const suggested = extractSuggestedStarAnswer(full);
        setStarResult(suggested || full);
      });

      const suggested = extractSuggestedStarAnswer(full);
      setStarResult(suggested || full);
      toast.success("STAR response ready");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "STAR improvement failed";
      toast.error(message);
    } finally {
      setIsStarImproving(false);
    }
  };

  const copyStarResult = async () => {
    if (!starResult.trim()) return;
    try {
      await navigator.clipboard.writeText(starResult);
      toast.success("Copied improved answer");
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const mockProgressPercent =
    mockQuestions.length > 0
      ? Math.round(((questionIndex + 1) / mockQuestions.length) * 100)
      : 0;

  const resumeSelect = (
    <div className="space-y-2">
      <Label htmlFor="resume-select">Resume</Label>
      <Select
        value={selectedResumeId}
        onValueChange={setSelectedResumeId}
        disabled={loadingResumes || savedResumes.length === 0}
      >
        <SelectTrigger id="resume-select" className="w-full">
          <SelectValue
            placeholder={
              loadingResumes ? "Loading resumes…" : "Select a saved resume"
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
    </div>
  );

  const jobDescriptionField = (
    <div className="space-y-2">
      <Label htmlFor="job-description">Target job description</Label>
      <Textarea
        id="job-description"
        placeholder="Paste the job description for role-specific questions and coaching…"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
        className="min-h-[140px] resize-y"
      />
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Interview Prep Suite
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Train with role-specific AI mock interviews and fine-tune your
            messaging using the STAR framework.
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="question-bank">Question Bank</TabsTrigger>
            <TabsTrigger value="mock-interview">Mock Interview</TabsTrigger>
            <TabsTrigger value="star-coach">STAR Coach</TabsTrigger>
          </TabsList>

          <TabsContent value="question-bank" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup</CardTitle>
                <CardDescription>
                  Choose a resume and job context to generate tailored questions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  {resumeSelect}
                  {jobDescriptionField}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label>Number of questions: {questionCount}</Label>
                  </div>
                  <Slider
                    min={0}
                    max={QUESTION_COUNT_OPTIONS.length - 1}
                    step={1}
                    value={[countSliderIndex]}
                    onValueChange={(value) =>
                      setCountSliderIndex(value[0] ?? 0)
                    }
                    className="max-w-md"
                  />
                  <div className="flex max-w-md justify-between text-xs text-muted-foreground">
                    {QUESTION_COUNT_OPTIONS.map((n) => (
                      <span key={n}>{n}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Question types</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {QUESTION_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors hover:bg-slate-50"
                      >
                        <Checkbox
                          checked={typeFilters.has(option.value)}
                          onCheckedChange={(checked) =>
                            toggleTypeFilter(option.value, checked === true)
                          }
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerateQuestions}
                  disabled={isGeneratingQuestions}
                  className="gap-2"
                >
                  {isGeneratingQuestions ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Generate Questions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {questions.length > 0 && filteredQuestions.length === 0 && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  No questions match your type filters. Enable at least one type.
                </p>
              )}

              {filteredQuestions.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="space-y-3 pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-semibold leading-snug text-slate-900">
                        {item.question}
                      </h3>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={typeBadgeClass(item.type)}
                        >
                          {typeLabel(item.type)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={difficultyBadgeClass(item.difficulty)}
                        >
                          {item.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details" className="border-0">
                        <AccordionTrigger className="py-2 text-sm font-medium text-slate-700">
                          View coaching details
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pb-2">
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Why this is asked
                            </p>
                            <p className="text-sm text-slate-700">
                              {item.why_asked}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              STAR tactics
                            </p>
                            <p className="text-sm text-slate-700">
                              {item.star_tips}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Sample answer outline
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                              {item.sample_answer_outline
                                .split(/\n|(?<=[.!?])\s+/)
                                .map((line) => line.trim())
                                .filter(Boolean)
                                .map((line) => (
                                  <li key={line}>{line}</li>
                                ))}
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPractice(item)}
                    >
                      Practice This Question
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && !isGeneratingQuestions && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Generate questions to populate your question bank.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="mock-interview" className="space-y-6">
            {!mockActive && !mockSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mock interview setup</CardTitle>
                  <CardDescription>
                    Same resume and job context as the question bank. You will
                    answer {MOCK_QUESTION_COUNT} questions in a chat-style flow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    {resumeSelect}
                    {jobDescriptionField}
                  </div>
                  <Button
                    size="lg"
                    className="w-full gap-2 sm:w-auto"
                    onClick={handleStartMockInterview}
                    disabled={isStartingMock}
                  >
                    {isStartingMock ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Preparing interview…
                      </>
                    ) : (
                      <>
                        <MessageSquare className="size-4" />
                        Start Mock Interview
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {mockActive && (
              <div className="space-y-4">
                <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>
                      Question {Math.min(questionIndex + 1, mockQuestions.length)}{" "}
                      of {mockQuestions.length}
                    </span>
                    <span>{mockProgressPercent}%</span>
                  </div>
                  <Progress value={mockProgressPercent} className="h-2" />
                </div>

                <div
                  ref={chatScrollRef}
                  className="h-[500px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner"
                >
                  <div className="flex flex-col gap-4">
                    {chatMessages.map((message) => {
                      if (message.sender === "interviewer") {
                        return (
                          <div
                            key={message.id}
                            className="flex max-w-[85%] items-end gap-2"
                          >
                            <Avatar className="size-8 shrink-0 border border-slate-200 bg-slate-200">
                              <AvatarFallback className="bg-slate-200 text-slate-700">
                                <Bot className="size-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="rounded-2xl rounded-bl-md bg-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm">
                              {message.text}
                            </div>
                          </div>
                        );
                      }

                      if (message.sender === "user") {
                        return (
                          <div
                            key={message.id}
                            className="ml-auto flex max-w-[85%] flex-row-reverse items-end gap-2"
                          >
                            <Avatar className="size-8 shrink-0 border border-violet-300 bg-violet-600">
                              <AvatarFallback className="bg-violet-600 text-white">
                                <User className="size-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="rounded-2xl rounded-br-md bg-violet-600 px-4 py-3 text-sm text-white shadow-sm">
                              {message.text}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={message.id}
                          className="mx-auto w-full max-w-[95%] rounded-xl border-2 border-dashed border-amber-300/80 bg-amber-50/90 px-4 py-3 shadow-sm"
                        >
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900">
                            Coach feedback
                          </p>
                          {message.text ? (
                            <FeedbackMarkdown content={message.text} />
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-amber-800">
                              <Loader2 className="size-4 animate-spin" />
                              Evaluating your answer…
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <Textarea
                    placeholder="Type your answer…"
                    value={mockAnswer}
                    onChange={(e) => setMockAnswer(e.target.value)}
                    disabled={isMockSubmitting}
                    className="min-h-[100px] resize-y"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        void handleSendMockAnswer();
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="gap-2"
                      onClick={() => void handleSendMockAnswer()}
                      disabled={
                        isMockSubmitting ||
                        !mockAnswer.trim() ||
                        questionIndex >= mockQuestions.length
                      }
                    >
                      {isMockSubmitting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      Send Answer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleEndMockInterview}
                      disabled={isMockSubmitting}
                    >
                      End Interview
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {mockSummary && !mockActive && (
              <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
                <CardHeader>
                  <CardTitle>Performance summary</CardTitle>
                  <CardDescription>
                    Session complete — review your cumulative mock interview
                    score.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-6">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Overall score
                      </p>
                      <p className="text-3xl font-semibold text-violet-700">
                        {mockSummary.averageRating > 0
                          ? `${mockSummary.averageRating} / 5`
                          : "—"}
                      </p>
                      {mockSummary.averageRating > 0 && (
                        <p className="mt-1 text-lg">
                          {"⭐".repeat(Math.round(mockSummary.averageRating))}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">
                        Questions answered
                      </p>
                      <p className="text-3xl font-semibold text-slate-900">
                        {mockSummary.questionsAnswered}
                      </p>
                    </div>
                  </div>
                  {mockSummary.ratings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">
                        Per-question ratings
                      </p>
                      <ul className="space-y-1 text-sm text-slate-600">
                        {mockSummary.ratings.map((rating, index) => (
                          <li key={`${index}-${rating}`}>
                            Question {index + 1}: {"⭐".repeat(rating)} ({rating}/5)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMockSummary(null);
                    }}
                  >
                    Start another mock interview
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="star-coach">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your draft</CardTitle>
                  <CardDescription>
                    Paste a rough answer — we will reshape it into STAR format.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="star-question">Interview question</Label>
                    <Textarea
                      id="star-question"
                      placeholder="e.g. Tell me about a time you led a cross-functional project…"
                      value={starQuestion}
                      onChange={(e) => setStarQuestion(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="star-draft">Draft answer</Label>
                    <Textarea
                      id="star-draft"
                      placeholder="Paste your unorganized thoughts here…"
                      value={starDraft}
                      onChange={(e) => setStarDraft(e.target.value)}
                      className="min-h-[220px]"
                    />
                  </div>
                  <Button
                    className="mx-auto flex w-full max-w-sm gap-2"
                    size="lg"
                    onClick={() => void handleImproveWithStar()}
                    disabled={isStarImproving}
                  >
                    {isStarImproving ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Transforming…
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Improve with STAR ✨
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card className="min-h-[420px]">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">STAR response</CardTitle>
                    <CardDescription>
                      {starResult
                        ? "Color-coded Situation, Task, Action, and Result blocks."
                        : "Your transformed STAR framework response will generate here…"}
                    </CardDescription>
                  </div>
                  {starResult && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => void copyStarResult()}
                      title="Copy improved answer"
                    >
                      <ClipboardCopy className="size-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isStarImproving && !starResult && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Generating your STAR-structured answer…
                    </div>
                  )}
                  {!isStarImproving && !starResult && (
                    <p className="text-sm text-muted-foreground">
                      Your transformed STAR framework response will generate
                      here…
                    </p>
                  )}
                  {starResult && (
                    <StarHighlightedAnswer text={starResult} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={practiceOpen} onOpenChange={setPracticeOpen}>
          <DialogContent className="max-w-lg sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Practice answer</DialogTitle>
              <DialogDescription>
                Draft your response, then coach it with STAR or continue in the
                STAR Coach tab.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900">
                {practiceQuestion}
              </p>
              <Textarea
                placeholder="Write your practice answer…"
                value={practiceAnswer}
                onChange={(e) => setPracticeAnswer(e.target.value)}
                className="min-h-[160px]"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPracticeOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={routeToStarCoach}
                disabled={!practiceAnswer.trim()}
                className="gap-2"
              >
                <Sparkles className="size-4" />
                Coach with STAR
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
