export type Plan = "free" | "pro";

export type JobApplicationStatus =
  | "saved"
  | "applied"
  | "screening"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type WorkExperience = {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
  achievements: string[];
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  grade: string | null;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link: string | null;
  highlights: string[];
};

export type Skill = {
  id: string;
  name: string;
  level: SkillLevel;
  category: string;
};

export type ResumeContent = {
  summary: string | null;
  workExperience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  /** Full LaTeX source stored by the resume editor */
  latexSource?: string;
};

/** Row shape for `public.user_profiles` */
export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  plan: Plan;
  resumes_used: number;
  resumes_limit: number;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.resumes` */
export type Resume = {
  id: string;
  user_id: string;
  title: string;
  template: string;
  slug: string | null;
  content: ResumeContent;
  ats_score: number | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

/** Row shape for `public.job_applications` */
export type JobApplication = {
  id: string;
  user_id: string;
  resume_id: string | null;
  company: string;
  role: string;
  status: JobApplicationStatus;
  job_url: string | null;
  location: string | null;
  salary_range: string | null;
  applied_at: string | null;
  notes: string | null;
  job_description?: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, "id">>;
        Relationships: [];
      };
      resumes: {
        Row: Resume;
        Insert: Omit<Resume, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Resume, "id" | "user_id">>;
        Relationships: [];
      };
      job_applications: {
        Row: JobApplication;
        Insert: Omit<JobApplication, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<JobApplication, "id" | "user_id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
