import type { ResumeContent } from "@/types/database";

export function createEmptyResumeContent(latexSource = ""): ResumeContent {
  return {
    summary: null,
    workExperience: [],
    education: [],
    projects: [],
    skills: [],
    latexSource,
  };
}
