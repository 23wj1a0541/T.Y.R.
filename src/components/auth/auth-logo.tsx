export function AuthLogo() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-violet-600 text-lg font-bold tracking-tight text-white shadow-sm">
        TYR
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Tailor Your Resume
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          AI-powered resumes that get interviews
        </p>
      </div>
    </div>
  );
}
