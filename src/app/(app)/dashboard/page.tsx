import Link from "next/link";
import { format } from "date-fns";
import {
  BarChart3,
  Briefcase,
  CalendarCheck,
  FileText,
  Lightbulb,
  ListChecks,
  Pencil,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const stats = [
  {
    label: "Resumes Created",
    value: "2",
    icon: FileText,
    iconClass: "bg-violet-100 text-violet-600",
  },
  {
    label: "Jobs Applied",
    value: "0",
    icon: Briefcase,
    iconClass: "bg-blue-100 text-blue-600",
  },
  {
    label: "Avg ATS Score",
    value: "—",
    icon: TrendingUp,
    iconClass: "bg-emerald-100 text-emerald-600",
  },
  {
    label: "Interviews Scheduled",
    value: "0",
    icon: CalendarCheck,
    iconClass: "bg-amber-100 text-amber-600",
  },
] as const;

const quickActions = [
  {
    title: "Generate Resume with AI",
    description: "Create a polished resume in minutes with AI assistance",
    href: "/app/generate",
    icon: Sparkles,
    gradient: "from-violet-600 to-purple-700",
    hover: "hover:from-violet-700 hover:to-purple-800",
  },
  {
    title: "Tailor for a Job",
    description: "Match your resume to a specific job description",
    href: "/app/tailor",
    icon: Target,
    gradient: "from-blue-600 to-cyan-600",
    hover: "hover:from-blue-700 hover:to-cyan-700",
  },
  {
    title: "Test ATS Score",
    description: "See how well your resume passes applicant tracking systems",
    href: "/app/ats-score",
    icon: BarChart3,
    gradient: "from-emerald-600 to-teal-600",
    hover: "hover:from-emerald-700 hover:to-teal-700",
  },
] as const;

const recentResumes = [
  {
    id: "1",
    name: "Senior Software Engineer",
    template: "Modern Professional",
    modified: new Date(2026, 4, 15),
    atsScore: 87,
  },
  {
    id: "2",
    name: "Product Manager — Tech",
    template: "Executive",
    modified: new Date(2026, 4, 12),
    atsScore: 72,
  },
  {
    id: "3",
    name: "Data Analyst Portfolio",
    template: "Creative",
    modified: new Date(2026, 4, 8),
    atsScore: null,
  },
] as const;

const tips = [
  {
    title: "Lead with impact",
    description:
      "Start bullet points with strong action verbs and quantify results whenever possible.",
    icon: Zap,
    iconClass: "bg-violet-100 text-violet-600",
  },
  {
    title: "Match keywords",
    description:
      "Mirror important skills and phrases from the job posting to improve ATS compatibility.",
    icon: ListChecks,
    iconClass: "bg-blue-100 text-blue-600",
  },
  {
    title: "Keep it scannable",
    description:
      "Use clear headings, consistent formatting, and one page when you have under 10 years of experience.",
    icon: Lightbulb,
    iconClass: "bg-amber-100 text-amber-600",
  },
] as const;

function atsBadgeClass(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-600";
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function DashboardPage() {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="mx-auto h-full w-full max-w-6xl space-y-8 overflow-y-auto px-8 py-8">
      <header>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          {getGreeting()}! Ready to land your next job?
        </h2>
        <p className="mt-1 text-sm text-slate-500">{today}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-lg",
                    stat.iconClass,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-slate-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Quick Actions
          </h3>
          <p className="text-sm text-slate-500">
            Jump straight into what matters most
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="group">
                <Card
                  className={cn(
                    "h-full border-0 bg-gradient-to-br text-white shadow-md transition-all",
                    action.gradient,
                    action.hover,
                    "group-hover:shadow-lg group-hover:-translate-y-0.5",
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-4 pt-1">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                      <Icon className="size-6" />
                    </div>
                    <div>
                      <p className="text-base font-semibold">{action.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-white/80">
                        {action.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Recent Resumes
            </h3>
            <p className="text-sm text-slate-500">
              Pick up where you left off
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/editor">View all</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentResumes.map((resume) => (
            <Card key={resume.id} className="shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
                <div className="min-w-0 flex-1 space-y-1">
                  <CardTitle className="truncate text-slate-900">
                    {resume.name}
                  </CardTitle>
                  <CardDescription>{resume.template}</CardDescription>
                </div>
                <Badge
                  className={cn(
                    "shrink-0 border-0 font-medium",
                    atsBadgeClass(resume.atsScore),
                  )}
                >
                  ATS {resume.atsScore ?? "—"}
                </Badge>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <p className="text-xs text-slate-500">
                  Modified {format(resume.modified, "MMM d, yyyy")}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/app/editor?id=${resume.id}`}>
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Pro Tips for a Better Resume
          </h3>
          <p className="text-sm text-slate-500">
            Small changes that make a big difference
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tips.map((tip) => {
            const Icon = tip.icon;
            return (
              <Card key={tip.title} className="shadow-sm">
                <CardContent className="space-y-3">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      tip.iconClass,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tip.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {tip.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
