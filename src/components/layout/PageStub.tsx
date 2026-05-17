type PageStubProps = {
  title: string;
};

export function PageStub({ title }: PageStubProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 py-16">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-500">Coming soon</p>
    </div>
  );
}
