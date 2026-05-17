export function HeroMockup() {
  const latexLines = [
    "\\documentclass{article}",
    "\\begin{document}",
    "\\section{Experience}",
    "\\textbf{Software Engineer} — Acme Corp",
    "Led migration to microservices; cut deploy time 40\\%",
    "\\section{Skills}",
    "TypeScript, React, Node.js, AWS",
    "\\end{document}",
  ];

  return (
    <div className="mx-auto mt-14 max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-violet-500/10 ring-1 ring-white/10">
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-900 px-4 py-3">
        <span className="size-2.5 rounded-full bg-red-500/90" />
        <span className="size-2.5 rounded-full bg-amber-500/90" />
        <span className="size-2.5 rounded-full bg-emerald-500/90" />
        <span className="ml-3 text-xs text-slate-400">
          tailor-your-resume · editor
        </span>
      </div>

      <div className="grid md:grid-cols-2">
        <div className="border-b border-white/10 bg-[#1e1e1e] p-4 md:border-b-0 md:border-r">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Monaco · LaTeX
          </p>
          <pre className="overflow-hidden font-mono text-[11px] leading-relaxed text-slate-300">
            {latexLines.map((line, index) => (
              <div key={line} className="flex gap-3">
                <span className="select-none text-slate-600">
                  {index + 1}
                </span>
                <span
                  className={
                    line.startsWith("\\") ? "text-violet-300" : "text-slate-200"
                  }
                >
                  {line}
                </span>
              </div>
            ))}
          </pre>
        </div>

        <div className="bg-white p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Live preview
          </p>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left shadow-inner">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Alex Rivera</h3>
              <p className="text-xs text-slate-500">
                alex@email.com · Mumbai, India
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
                Summary
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">
                Full-stack engineer with 4+ years shipping scalable products.
                Expert in React, Node.js, and cloud-native delivery.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-violet-700">
                Experience
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-900">
                Software Engineer — Acme Corp
              </p>
              <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                <li>Reduced deploy time 40% via CI/CD overhaul</li>
                <li>Owned payments microservice serving 2M+ users</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-1">
              {["React", "TypeScript", "AWS", "PostgreSQL"].map((skill) => (
                <span
                  key={skill}
                  className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
