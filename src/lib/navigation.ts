import {
  BarChart3,
  Code2,
  KanbanSquare,
  LayoutDashboard,
  Mic,
  Sparkles,
  Target,
  User,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { title: "Resume Editor", href: "/app/editor", icon: Code2 },
  { title: "AI Generate", href: "/app/generate", icon: Sparkles },
  { title: "Tailor for Job", href: "/app/tailor", icon: Target },
  { title: "ATS Score", href: "/app/ats-score", icon: BarChart3 },
  { title: "Interview Prep", href: "/app/interview", icon: Mic },
  { title: "Job Tracker", href: "/app/tracker", icon: KanbanSquare },
  { title: "My Profile", href: "/app/profile", icon: User },
];

export const pageTitles: Record<string, string> = {
  "/app/dashboard": "Dashboard",
  "/app/editor": "Resume Editor",
  "/app/generate": "AI Generate",
  "/app/tailor": "Tailor for Job",
  "/app/ats-score": "ATS Score",
  "/app/interview": "Interview Prep",
  "/app/tracker": "Job Tracker",
  "/app/profile": "My Profile",
};

export function getPageTitle(pathname: string): string {
  return pageTitles[pathname] ?? "Tailor Your Resume";
}
