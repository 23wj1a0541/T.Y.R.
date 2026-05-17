import type { JobApplicationStatus } from "@/types/database";

export const JOB_DESCRIPTION_MARKER = "\n\n---JOB_DESCRIPTION---\n\n";

export type KanbanColumnConfig = {
  status: JobApplicationStatus;
  title: string;
  headerClass: string;
  borderClass: string;
  badgeClass: string;
  avatarClass: string;
};

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    status: "saved",
    title: "Saved",
    headerClass: "text-slate-700",
    borderClass: "border-slate-200 bg-slate-50/80",
    badgeClass: "bg-slate-200 text-slate-800",
    avatarClass: "bg-slate-200 text-slate-800",
  },
  {
    status: "applied",
    title: "Applied",
    headerClass: "text-blue-800",
    borderClass: "border-blue-200 bg-blue-50/60",
    badgeClass: "bg-blue-100 text-blue-800",
    avatarClass: "bg-blue-100 text-blue-800",
  },
  {
    status: "screening",
    title: "Screening",
    headerClass: "text-amber-900",
    borderClass: "border-amber-200 bg-amber-50/70",
    badgeClass: "bg-amber-100 text-amber-900",
    avatarClass: "bg-amber-100 text-amber-900",
  },
  {
    status: "interview",
    title: "Interview",
    headerClass: "text-orange-800",
    borderClass: "border-orange-200 bg-orange-50/70",
    badgeClass: "bg-orange-100 text-orange-800",
    avatarClass: "bg-orange-100 text-orange-800",
  },
  {
    status: "offer",
    title: "Offer",
    headerClass: "text-emerald-800",
    borderClass: "border-emerald-200 bg-emerald-50/70",
    badgeClass: "bg-emerald-100 text-emerald-800",
    avatarClass: "bg-emerald-100 text-emerald-800",
  },
  {
    status: "rejected",
    title: "Rejected",
    headerClass: "text-rose-800",
    borderClass: "border-rose-200 bg-rose-50/70",
    badgeClass: "bg-rose-100 text-rose-800",
    avatarClass: "bg-rose-100 text-rose-800",
  },
];

export const TRACKER_STATUS_OPTIONS = KANBAN_COLUMNS.map((c) => ({
  value: c.status,
  label: c.title,
}));

export function packJobNotes(
  userNotes: string,
  jobDescription: string,
): string | null {
  const notes = userNotes.trim();
  const description = jobDescription.trim();

  if (!notes && !description) return null;
  if (!description) return notes;
  if (!notes) return `${JOB_DESCRIPTION_MARKER}${description}`;
  return `${notes}${JOB_DESCRIPTION_MARKER}${description}`;
}

export function unpackJobNotes(combined: string | null): {
  notes: string;
  jobDescription: string;
} {
  if (!combined) {
    return { notes: "", jobDescription: "" };
  }

  const index = combined.indexOf(JOB_DESCRIPTION_MARKER);
  if (index === -1) {
    return { notes: combined, jobDescription: "" };
  }

  return {
    notes: combined.slice(0, index).trim(),
    jobDescription: combined
      .slice(index + JOB_DESCRIPTION_MARKER.length)
      .trim(),
  };
}

export function splitJobRecordNotes(
  notes: string | null,
  jobDescription: string | null | undefined,
): { notes: string; jobDescription: string } {
  if (jobDescription?.trim()) {
    return {
      notes: notes?.trim() ?? "",
      jobDescription: jobDescription.trim(),
    };
  }

  return unpackJobNotes(notes);
}

export function atsScoreBadgeClass(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) {
    return "bg-slate-100 text-slate-600";
  }
  if (score > 80) return "bg-emerald-100 text-emerald-800";
  if (score > 60) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-800";
}

export function formatTrackerDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
