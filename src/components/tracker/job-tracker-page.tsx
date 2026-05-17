"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Building2,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { TrackerKanbanSkeleton } from "@/components/tracker/tracker-kanban-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  atsScoreBadgeClass,
  formatTrackerDate,
  KANBAN_COLUMNS,
  packJobNotes,
  splitJobRecordNotes,
  TRACKER_STATUS_OPTIONS,
} from "@/lib/tracker-utils";
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  JobApplication,
  JobApplicationStatus,
} from "@/types/database";

type JobApplicationInsert =
  Database["public"]["Tables"]["job_applications"]["Insert"];
type JobApplicationUpdate =
  Database["public"]["Tables"]["job_applications"]["Update"];
import { cn } from "@/lib/utils";

type ResumeOption = {
  id: string;
  title: string;
  ats_score: number | null;
};

export type TrackerJob = JobApplication & {
  resumeTitle: string | null;
  atsScore: number | null;
  displayNotes: string;
  displayJobDescription: string;
};

type JobFormState = {
  company: string;
  role: string;
  status: JobApplicationStatus;
  appliedAt: string;
  resumeId: string;
  jobDescription: string;
  notes: string;
};

const EMPTY_FORM: JobFormState = {
  company: "",
  role: "",
  status: "saved",
  appliedAt: "",
  resumeId: "",
  jobDescription: "",
  notes: "",
};

const KANBAN_STATUSES = new Set<JobApplicationStatus>(
  KANBAN_COLUMNS.map((column) => column.status),
);

function mapJobRow(
  row: JobApplication,
  resumeMap: Map<string, ResumeOption>,
): TrackerJob {
  const resume = row.resume_id ? resumeMap.get(row.resume_id) : undefined;
  const { notes, jobDescription } = splitJobRecordNotes(
    row.notes,
    row.job_description,
  );

  return {
    ...row,
    resumeTitle: resume?.title ?? null,
    atsScore: resume?.ats_score ?? null,
    displayNotes: notes,
    displayJobDescription: jobDescription,
  };
}

function isMissingJobDescriptionColumn(message: string): boolean {
  return /job_description/i.test(message);
}

export function JobTrackerPage() {
  const [jobsList, setJobsList] = useState<TrackerJob[]>([]);
  const [resumesList, setResumesList] = useState<ResumeOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [detailsJob, setDetailsJob] = useState<TrackerJob | null>(null);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [statusPreset, setStatusPreset] = useState<JobApplicationStatus>("saved");

  const loadData = useCallback(async () => {
    setIsInitialLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        toast.error("Sign in to view your job tracker");
        setJobsList([]);
        setResumesList([]);
        return;
      }

      const [jobsResult, resumesResult] = await Promise.all([
        supabase
          .from("job_applications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("resumes")
          .select("id, title, ats_score")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false }),
      ]);

      if (jobsResult.error) {
        throw new Error(jobsResult.error.message);
      }

      if (resumesResult.error) {
        throw new Error(resumesResult.error.message);
      }

      const resumeMap = new Map<string, ResumeOption>();
      for (const resume of resumesResult.data ?? []) {
        resumeMap.set(resume.id, resume as ResumeOption);
      }

      setResumesList(Array.from(resumeMap.values()));
      setJobsList(
        (jobsResult.data ?? []).map((row) =>
          mapJobRow(row as JobApplication, resumeMap),
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load applications";
      toast.error(message);
      setJobsList([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return jobsList;

    return jobsList.filter((job) => {
      return (
        job.company.toLowerCase().includes(query) ||
        job.role.toLowerCase().includes(query)
      );
    });
  }, [jobsList, searchQuery]);

  const visibleJobs = useMemo(
    () => filteredJobs.filter((job) => KANBAN_STATUSES.has(job.status)),
    [filteredJobs],
  );

  const metrics = useMemo(() => {
    const appliedJobs = jobsList.filter((job) => job.status !== "saved");
    const inProgress = jobsList.filter(
      (job) => job.status === "screening" || job.status === "interview",
    );
    const offers = jobsList.filter((job) => job.status === "offer");
    const totalApplied = appliedJobs.length;
    const successRate =
      totalApplied > 0
        ? Math.round((offers.length / totalApplied) * 1000) / 10
        : 0;

    return {
      totalApplied,
      inProgress: inProgress.length,
      successRate,
    };
  }, [jobsList]);

  const jobsByStatus = useMemo(() => {
    const grouped = new Map<JobApplicationStatus, TrackerJob[]>();
    for (const column of KANBAN_COLUMNS) {
      grouped.set(column.status, []);
    }

    for (const job of visibleJobs) {
      const bucket = grouped.get(job.status);
      if (bucket) {
        bucket.push(job);
      }
    }

    return grouped;
  }, [visibleJobs]);

  const openAddModal = (preset: JobApplicationStatus = "saved") => {
    setEditingJobId(null);
    setStatusPreset(preset);
    setForm({
      ...EMPTY_FORM,
      status: preset,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (job: TrackerJob) => {
    setEditingJobId(job.id);
    setForm({
      company: job.company,
      role: job.role,
      status: job.status,
      appliedAt: job.applied_at
        ? format(new Date(job.applied_at), "yyyy-MM-dd")
        : "",
      resumeId: job.resume_id ?? "",
      jobDescription: job.displayJobDescription,
      notes: job.displayNotes,
    });
    setIsModalOpen(true);
  };

  const openDetailsModal = (job: TrackerJob) => {
    setDetailsJob(job);
    setIsDetailsOpen(true);
  };

  const buildInsertPayload = (
    userId: string,
    usePackedNotes: boolean,
  ): JobApplicationInsert => {
    const base: JobApplicationInsert = {
      user_id: userId,
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      applied_at: form.appliedAt ? new Date(form.appliedAt).toISOString() : null,
      resume_id: form.resumeId || null,
      job_url: null,
      location: null,
      salary_range: null,
      notes: null,
    };

    if (usePackedNotes) {
      return {
        ...base,
        notes: packJobNotes(form.notes, form.jobDescription),
      };
    }

    return {
      ...base,
      notes: form.notes.trim() || null,
      job_description: form.jobDescription.trim() || null,
    };
  };

  const buildUpdatePayload = (
    usePackedNotes: boolean,
  ): JobApplicationUpdate => {
    const base = {
      company: form.company.trim(),
      role: form.role.trim(),
      status: form.status,
      applied_at: form.appliedAt ? new Date(form.appliedAt).toISOString() : null,
      resume_id: form.resumeId || null,
    };

    if (usePackedNotes) {
      return {
        ...base,
        notes: packJobNotes(form.notes, form.jobDescription),
      };
    }

    return {
      ...base,
      notes: form.notes.trim() || null,
      job_description: form.jobDescription.trim() || null,
    };
  };

  const handleSaveJob = async () => {
    if (!form.company.trim()) {
      toast.error("Company name is required");
      return;
    }
    if (!form.role.trim()) {
      toast.error("Job title is required");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be signed in");
      }

      if (editingJobId) {
        let updatePayload = buildUpdatePayload(false);
        let { error } = await supabase
          .from("job_applications")
          .update(updatePayload)
          .eq("id", editingJobId)
          .eq("user_id", user.id);

        if (error && isMissingJobDescriptionColumn(error.message)) {
          updatePayload = buildUpdatePayload(true);
          const retry = await supabase
            .from("job_applications")
            .update(updatePayload)
            .eq("id", editingJobId)
            .eq("user_id", user.id);
          error = retry.error;
        }

        if (error) throw new Error(error.message);
        toast.success("Application updated");
      } else {
        let insertPayload = buildInsertPayload(user.id, false);
        let { error } = await supabase
          .from("job_applications")
          .insert(insertPayload);

        if (error && isMissingJobDescriptionColumn(error.message)) {
          insertPayload = buildInsertPayload(user.id, true);
          const retry = await supabase
            .from("job_applications")
            .insert(insertPayload);
          error = retry.error;
        }

        if (error) throw new Error(error.message);
        toast.success("Application added");
      }

      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      setEditingJobId(null);
      await loadData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save application";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (
    jobId: string,
    newStatus: JobApplicationStatus,
  ) => {
    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be signed in");
      }

      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", jobId)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      setJobsList((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: newStatus } : job,
        ),
      );
      toast.success("Status updated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Status update failed";
      toast.error(message);
    }
  };

  const handleDeleteJob = async (job: TrackerJob) => {
    const confirmed = window.confirm(
      `Delete the application for ${job.role} at ${job.company}?`,
    );
    if (!confirmed) return;

    const supabase = createClient();

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("You must be signed in");
      }

      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", job.id)
        .eq("user_id", user.id);

      if (error) throw new Error(error.message);

      setJobsList((prev) => prev.filter((item) => item.id !== job.id));
      toast.success("Application deleted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Delete failed";
      toast.error(message);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
        <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col space-y-6">
          <header className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Job Application Tracker
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Manage your pipeline, track application statuses, and link tailored
              resume variations to active targets.
            </p>
          </header>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by company or job title…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button className="gap-2" onClick={() => openAddModal("saved")}>
              <Plus className="size-4" />
              Add New Application
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">
                  {metrics.totalApplied}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-amber-700">
                  {metrics.inProgress}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-emerald-700">
                  {metrics.successRate}%
                </p>
              </CardContent>
            </Card>
          </div>

          {isInitialLoading ? (
            <TrackerKanbanSkeleton />
          ) : (
            <div className="min-h-0 flex-1 overflow-x-auto">
              <div
                className={cn(
                  "grid h-[calc(100vh-220px)] min-w-[1080px] grid-cols-6 gap-4",
                )}
              >
                {KANBAN_COLUMNS.map((column) => {
                  const columnJobs = jobsByStatus.get(column.status) ?? [];

                  return (
                    <div
                      key={column.status}
                      className={cn(
                        "flex min-h-0 flex-col rounded-xl border-2",
                        column.borderClass,
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between border-b px-3 py-3",
                          column.borderClass,
                        )}
                      >
                        <h2
                          className={cn(
                            "text-sm font-semibold",
                            column.headerClass,
                          )}
                        >
                          {column.title}
                        </h2>
                        <Badge
                          variant="outline"
                          className={column.badgeClass}
                        >
                          {columnJobs.length}
                        </Badge>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 pb-12">
                          {columnJobs.length === 0 && (
                            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                              No applications
                            </p>
                          )}

                          {columnJobs.map((job) => (
                            <Card
                              key={job.id}
                              className="cursor-pointer border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                              onClick={() => openDetailsModal(job)}
                            >
                              <CardHeader className="space-y-3 p-3 pb-2">
                                <div className="flex items-start gap-2">
                                  <div
                                    className={cn(
                                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                                      column.avatarClass,
                                    )}
                                  >
                                    {job.company.charAt(0).toUpperCase() || "?"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">
                                      {job.role}
                                    </p>
                                    <p className="truncate text-xs text-slate-600">
                                      {job.company}
                                    </p>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="shrink-0"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditModal(job);
                                        }}
                                      >
                                        <Pencil className="size-4" />
                                        Edit Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void handleDeleteJob(job);
                                        }}
                                      >
                                        <Trash2 className="size-4" />
                                        Delete Record
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>

                              <CardContent
                                className="space-y-3 p-3 pt-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="space-y-1.5 text-xs text-muted-foreground">
                                  <p>
                                    Added{" "}
                                    <span className="text-slate-700">
                                      {formatTrackerDate(job.created_at)}
                                    </span>
                                  </p>
                                  <p className="flex flex-wrap items-center gap-1">
                                    Resume:{" "}
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] font-normal"
                                    >
                                      {job.resumeTitle ?? "None linked"}
                                    </Badge>
                                  </p>
                                  {job.atsScore != null && (
                                    <p className="flex items-center gap-1">
                                      ATS Match:{" "}
                                      <Badge
                                        className={atsScoreBadgeClass(
                                          job.atsScore,
                                        )}
                                      >
                                        {job.atsScore}
                                      </Badge>
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Move to →
                                  </Label>
                                  <Select
                                    value={job.status}
                                    onValueChange={(value) =>
                                      void handleStatusChange(
                                        job.id,
                                        value as JobApplicationStatus,
                                      )
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-full text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TRACKER_STATUS_OPTIONS.map((option) => (
                                        <SelectItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <div className="border-t border-inherit p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-1 text-xs"
                            onClick={() => openAddModal(column.status)}
                          >
                            <Plus className="size-3.5" />
                            Add Job
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingJobId ? "Edit application" : "Add new application"}
            </DialogTitle>
            <DialogDescription>
              {editingJobId
                ? "Update pipeline details and linked resume."
                : statusPreset !== "saved"
                  ? `New application in ${statusPreset} column.`
                  : "Capture a new role in your pipeline."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company name</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, company: e.target.value }))
                  }
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Job title</Label>
                <Input
                  id="role"
                  value={form.role}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  placeholder="Senior Software Engineer"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Job status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      status: value as JobApplicationStatus,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKER_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="applied-at">Applied date</Label>
                <Input
                  id="applied-at"
                  type="date"
                  value={form.appliedAt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      appliedAt: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resume used</Label>
              <Select
                value={form.resumeId || "none"}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    resumeId: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resume variation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No resume linked</SelectItem>
                  {resumesList.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.title}
                      {resume.ats_score != null
                        ? ` (ATS ${resume.ats_score})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Job description</Label>
              <Textarea
                id="job-description"
                value={form.jobDescription}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    jobDescription: e.target.value,
                  }))
                }
                placeholder="Paste the job posting or key requirements…"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Follow-ups, recruiter contacts, reminders…"
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveJob()} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving…
                </>
              ) : editingJobId ? (
                "Save changes"
              ) : (
                "Add application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              {detailsJob?.role}
            </DialogTitle>
            <DialogDescription>
              {detailsJob?.company} · {detailsJob?.status}
            </DialogDescription>
          </DialogHeader>

          {detailsJob && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3 text-muted-foreground">
                <div>
                  <p className="text-xs uppercase">Applied</p>
                  <p className="text-slate-900">
                    {formatTrackerDate(detailsJob.applied_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase">Added</p>
                  <p className="text-slate-900">
                    {formatTrackerDate(detailsJob.created_at)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs uppercase">Resume variation</p>
                  <p className="text-slate-900">
                    {detailsJob.resumeTitle ?? "None linked"}
                    {detailsJob.atsScore != null && (
                      <Badge
                        className={cn(
                          "ml-2",
                          atsScoreBadgeClass(detailsJob.atsScore),
                        )}
                      >
                        ATS {detailsJob.atsScore}
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Job description
                </p>
                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-800">
                  {detailsJob.displayJobDescription ||
                    "No job description saved."}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
                  Notes
                </p>
                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-slate-800">
                  {detailsJob.displayNotes || "No notes added."}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
