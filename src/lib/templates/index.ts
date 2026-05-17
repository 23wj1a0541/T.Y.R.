export type TemplateMeta = {
  id: string;
  name: string;
  description: string;
  preview_description: string;
};

export const classicTemplate = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{parskip}
\setlength{\parskip}{6pt} % Space between paragraphs
\setlength{\parindent}{0pt} % No indentation at the start of paragraphs
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{hyperref}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{10pt}{6pt}

\pagestyle{empty}

\begin{document}

\begin{center}
  {\LARGE\bfseries John Doe}\\[4pt]
  Software Engineer\\
  \href{mailto:john.doe@email.com}{john.doe@email.com} \textbar\
  (555) 123-4567 \textbar\
  San Francisco, CA \textbar\
  \href{https://linkedin.com/in/johndoe}{linkedin.com/in/johndoe}
\end{center}

\section{Professional Summary}
Results-driven software engineer with 6+ years of experience building scalable web applications, leading cross-functional teams, and delivering measurable business impact.

\section{Experience}
\textbf{Senior Software Engineer} \hfill Jun 2021 -- Present\\
\textit{Acme Technologies, San Francisco, CA}
\begin{itemize}[leftmargin=*, nosep]
  \item Led migration of monolithic platform to microservices, reducing deployment time by 40\%.
  \item Mentored a team of 5 engineers and established code review standards adopted company-wide.
  \item Designed REST APIs serving 2M+ daily requests with 99.9\% uptime.
\end{itemize}

\vspace{6pt}
\textbf{Software Engineer} \hfill Aug 2018 -- May 2021\\
\textit{Bright Labs, Austin, TX}
\begin{itemize}[leftmargin=*, nosep]
  \item Built customer-facing React dashboards used by 50,000+ monthly active users.
  \item Improved database query performance by 35\% through indexing and query optimization.
  \item Collaborated with product and design to ship 12 major features on schedule.
\end{itemize}

\section{Education}
\textbf{B.S. Computer Science} \hfill 2014 -- 2018\\
University of California, Berkeley

\section{Skills}
\textbf{Languages:} JavaScript, TypeScript, Python, SQL\\
\textbf{Frameworks:} React, Node.js, Next.js, PostgreSQL, Docker, AWS

\section{Projects}
\textbf{Open Source CLI Tool} --- Automated developer workflow tasks; 500+ GitHub stars.\\
\textbf{Personal Portfolio} --- \href{https://johndoe.dev}{johndoe.dev} --- Showcase of full-stack projects and case studies.

\end{document}
`;

export const modernTemplate = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{parskip}
\setlength{\parskip}{6pt} % Space between paragraphs
\setlength{\parindent}{0pt} % No indentation at the start of paragraphs
\usepackage[margin=0.6in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{hyperref}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\titleformat{\section}{\normalsize\bfseries\uppercase}{}{0em}{}
\titlespacing*{\section}{0pt}{8pt}{4pt}

\pagestyle{empty}
\setlength{\parindent}{0pt}

\begin{document}

\noindent
\begin{minipage}[t]{0.30\textwidth}
  \raggedright
  {\LARGE\bfseries John}\\[2pt]
  {\LARGE\bfseries Doe}\\[12pt]

  \textbf{Contact}\\[4pt]
  \href{mailto:john.doe@email.com}{john.doe@email.com}\\[3pt]
  (555) 123-4567\\[3pt]
  San Francisco, CA\\[3pt]
  \href{https://linkedin.com/in/johndoe}{linkedin.com/in/johndoe}\\[3pt]
  \href{https://johndoe.dev}{johndoe.dev}\\[14pt]

  \textbf{Skills}\\[4pt]
  JavaScript\\
  TypeScript\\
  React\\
  Node.js\\
  Python\\
  PostgreSQL\\
  AWS\\
  Docker\\[14pt]

  \textbf{Education}\\[4pt]
  B.S. Computer Science\\
  UC Berkeley\\
  2014 -- 2018
\end{minipage}%
\hfill
\begin{minipage}[t]{0.66\textwidth}
  \raggedright
  {\huge\bfseries Software Engineer}\\[10pt]

  \section{Summary}
  Innovative engineer with 6+ years building user-centric products. Strong track record of technical leadership and cross-team collaboration.

  \section{Experience}
  \textbf{Senior Software Engineer}\\
  \textit{Acme Technologies} \hfill Jun 2021 -- Present
  \begin{itemize}[leftmargin=*, nosep, topsep=2pt]
    \item Architected microservices platform serving 2M+ daily API requests.
    \item Reduced infrastructure costs by 25\% through performance tuning.
    \item Led agile ceremonies for a squad of 8 engineers and designers.
  \end{itemize}

  \vspace{4pt}
  \textbf{Software Engineer}\\
  \textit{Bright Labs} \hfill Aug 2018 -- May 2021
  \begin{itemize}[leftmargin=*, nosep, topsep=2pt]
    \item Developed React applications with 50,000+ monthly active users.
    \item Implemented CI/CD pipelines cutting release cycles from weeks to days.
  \end{itemize}

  \section{Projects}
  \textbf{DevFlow CLI} --- Open-source automation tool with 500+ GitHub stars.\\
  \textbf{Analytics Dashboard} --- Real-time metrics platform built with Next.js and PostgreSQL.
\end{minipage}

\end{document}
`;

export const minimalTemplate = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{parskip}
\setlength{\parskip}{6pt} % Space between paragraphs
\setlength{\parindent}{0pt} % No indentation at the start of paragraphs
\usepackage[margin=1in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{hyperref}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\titleformat{\section}{\normalsize\bfseries}{}{0em}{}
\titlespacing*{\section}{0pt}{14pt}{6pt}

\pagestyle{empty}
\setlength{\parskip}{6pt}

\begin{document}

\begin{center}
  John Doe\\[2pt]
  \small
  john.doe@email.com \quad (555) 123-4567 \quad San Francisco, CA
\end{center}

\section{Summary}
Software engineer focused on clarity, reliability, and thoughtful product development.

\section{Experience}
\textbf{Senior Software Engineer}, Acme Technologies \hfill 2021 -- Present\\
Led platform modernization and mentored engineers on best practices.

\textbf{Software Engineer}, Bright Labs \hfill 2018 -- 2021\\
Built React applications and improved system performance across core services.

\section{Education}
\textbf{B.S. Computer Science}, University of California, Berkeley \hfill 2018

\section{Skills}
JavaScript, TypeScript, React, Node.js, Python, SQL, AWS

\section{Projects}
DevFlow CLI --- Developer automation tool.\\
Portfolio --- \href{https://johndoe.dev}{johndoe.dev}

\end{document}
`;

export const atsSafeTemplate = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{parskip}
\setlength{\parskip}{6pt} % Space between paragraphs
\setlength{\parindent}{0pt} % No indentation at the start of paragraphs
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{hyperref}

\hypersetup{hidelinks}

\titleformat{\section}{\large\bfseries}{}{0em}{}
\titlespacing*{\section}{0pt}{10pt}{4pt}

\pagestyle{empty}
\setlength{\parindent}{0pt}

\begin{document}

John Doe\\
Software Engineer\\
Email: john.doe@email.com\\
Phone: (555) 123-4567\\
Location: San Francisco, California\\
LinkedIn: linkedin.com/in/johndoe\\
Website: johndoe.dev

\section{Professional Summary}
Software engineer with six years of experience developing web applications, APIs, and cloud infrastructure. Proven ability to deliver projects on time and improve system reliability.

\section{Work Experience}

Senior Software Engineer\\
Acme Technologies, San Francisco, California\\
June 2021 to Present
\begin{itemize}[leftmargin=*]
  \item Led migration from monolithic architecture to microservices.
  \item Managed team of five software engineers.
  \item Built REST APIs supporting over two million daily requests.
\end{itemize}

Software Engineer\\
Bright Labs, Austin, Texas\\
August 2018 to May 2021
\begin{itemize}[leftmargin=*]
  \item Developed customer-facing web applications using JavaScript and React.
  \item Optimized database queries improving response time by 35 percent.
  \item Partnered with product managers to define requirements and timelines.
\end{itemize}

\section{Education}

Bachelor of Science in Computer Science\\
University of California, Berkeley\\
Graduated 2018

\section{Technical Skills}

Programming Languages: JavaScript, TypeScript, Python, SQL\\
Frameworks and Tools: React, Node.js, Next.js, PostgreSQL, Docker, Amazon Web Services\\
Methods: Agile, Scrum, Test Driven Development, Code Review

\section{Projects}

Open Source Command Line Tool: Automated developer workflows with 500 GitHub stars.\\
Personal Portfolio Website: Full stack projects and technical writing at johndoe.dev.

\end{document}
`;

export const technicalTemplate = String.raw`\documentclass[11pt,a4paper]{article}

\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{parskip}
\setlength{\parskip}{6pt} % Space between paragraphs
\setlength{\parindent}{0pt} % No indentation at the start of paragraphs
\usepackage[margin=0.75in]{geometry}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{hyperref}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black}

\titleformat{\section}{\large\bfseries}{}{0em}{}[\titlerule]
\titlespacing*{\section}{0pt}{8pt}{4pt}

\pagestyle{empty}

\begin{document}

\begin{center}
  {\LARGE\bfseries John Doe}\\[2pt]
  Software Engineer \textbar\ \href{mailto:john.doe@email.com}{john.doe@email.com} \textbar\ (555) 123-4567 \textbar\ \href{https://github.com/johndoe}{github.com/johndoe}
\end{center}

\section{Technical Skills}
\begin{itemize}[leftmargin=*, nosep]
  \item \textbf{Languages:} JavaScript, TypeScript, Python, Go, SQL
  \item \textbf{Frontend:} React, Next.js, HTML5, CSS3, Webpack
  \item \textbf{Backend:} Node.js, Express, GraphQL, REST, PostgreSQL, Redis
  \item \textbf{DevOps:} Docker, Kubernetes, AWS (EC2, S3, Lambda), GitHub Actions
  \item \textbf{Practices:} System design, TDD, CI/CD, code review, Agile/Scrum
\end{itemize}

\section{Summary}
Backend-leaning full-stack engineer with 6+ years shipping production systems. Passionate about clean architecture, observability, and developer experience.

\section{Projects}
\textbf{DevFlow CLI} \hfill \href{https://github.com/johndoe/devflow}{github.com/johndoe/devflow}\\
Open-source CLI for automating local dev environments. 500+ stars, 40+ contributors.
\begin{itemize}[leftmargin=*, nosep]
  \item Built in TypeScript with plugin architecture and comprehensive test suite.
\end{itemize}

\vspace{4pt}
\textbf{Real-Time Analytics Platform} \hfill 2023\\
Event ingestion pipeline processing 100K events/minute using Node.js and PostgreSQL.
\begin{itemize}[leftmargin=*, nosep]
  \item Implemented WebSocket layer and Redis caching for sub-100ms dashboard updates.
\end{itemize}

\section{Experience}
\textbf{Senior Software Engineer} \hfill Jun 2021 -- Present\\
\textit{Acme Technologies}
\begin{itemize}[leftmargin=*, nosep]
  \item Designed microservices architecture; reduced p99 latency from 800ms to 120ms.
  \item Introduced OpenTelemetry tracing across 12 services.
  \item Led technical design reviews and mentored 5 junior engineers.
\end{itemize}

\vspace{4pt}
\textbf{Software Engineer} \hfill Aug 2018 -- May 2021\\
\textit{Bright Labs}
\begin{itemize}[leftmargin=*, nosep]
  \item Built React/Node.js features for B2B SaaS product with 50K MAU.
  \item Owned PostgreSQL schema migrations and query optimization.
\end{itemize}

\section{Education}
\textbf{B.S. Computer Science}, University of California, Berkeley \hfill 2018

\end{document}
`;

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional single-column resume with clear section dividers.",
    preview_description:
      "Timeless layout with centered header, ruled sections, and bullet-point experience entries.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two-column layout with a compact sidebar for contact and skills.",
    preview_description:
      "Contemporary split design: sidebar for contact, skills, and education; main column for summary and experience.",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean design with generous whitespace and understated typography.",
    preview_description:
      "Sparse, elegant formatting focused on readability with minimal visual noise.",
  },
  {
    id: "ats-safe",
    name: "ATS Safe",
    description: "Plain, parser-friendly formatting with no columns or complex layout.",
    preview_description:
      "Single-column, linear structure optimized for applicant tracking systems.",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Developer-focused resume with skills and projects placed up front.",
    preview_description:
      "Engineering-oriented layout highlighting technical skills, GitHub projects, and stack details.",
  },
];

export const TEMPLATE_LATEX: Record<string, string> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
  "ats-safe": atsSafeTemplate,
  technical: technicalTemplate,
};

export function getTemplateLatex(id: string): string | undefined {
  return TEMPLATE_LATEX[id];
}

export function getTemplateById(id: string): TemplateMeta | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
