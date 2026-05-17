import Link from "next/link";
import {
  BarChart3,
  Code2,
  KanbanSquare,
  Mic,
  Sparkles,
  Target,
} from "lucide-react";

import { AtsScoreDemo } from "@/components/landing/ats-score-demo";
import { HeroMockup } from "@/components/landing/hero-mockup";
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

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Build Your Profile",
    description:
      "Store your professional experience and technical skills securely in your personal vault just once.",
  },
  {
    step: "02",
    title: "Paste Any Job Description",
    description:
      "Our real-time AI engine tailors and aligns your experience metrics to the target role in seconds.",
  },
  {
    step: "03",
    title: "Get Interviewed",
    description:
      "Bypass ATS algorithmic filters with a 90+ optimization score, backed by an in-app interactive STAR coaching studio.",
  },
] as const;

const FEATURES = [
  {
    icon: Code2,
    title: "LaTeX Resume Editor",
    description:
      "Full Monaco engine integration with Overleaf-style templates for pixel-perfect, recruiter-ready PDFs.",
  },
  {
    icon: Sparkles,
    title: "AI Resume Generator",
    description:
      "Create high-impact structural layouts from a single plain-text description in one click.",
  },
  {
    icon: Target,
    title: "Job-Specific Tailoring",
    description:
      "Automated contextual keyword mirroring and bullet re-ordering for every application.",
  },
  {
    icon: BarChart3,
    title: "ATS Score Tester",
    description:
      "Instant grading, parser testing, and high-impact structural fixes before you apply.",
  },
  {
    icon: Mic,
    title: "Interview Prep Suite",
    description:
      "Iterative chat simulations, customized question banks, and STAR answer formatting.",
  },
  {
    icon: KanbanSquare,
    title: "Job Application Tracker",
    description:
      "Pipeline visibility linking custom resumes directly to active opportunities.",
  },
] as const;

const PRICING = [
  {
    name: "Free",
    price: "₹0",
    period: "/ month",
    description:
      "Core access holding 3 tailored resumes per month, baseline ATS score checking, and 1 core layout template.",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹299",
    period: "/ month",
    description:
      "Completely unlimited tailored resumes, full access to the AI interview suite, all premium templates, and advanced skills gap analyzers.",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Team / College",
    price: "₹999",
    period: "/ month",
    description:
      "Tailored for placement cells, bootcamps, and career centers looking for bulk dashboard user control and administrative overview metrics.",
    highlighted: false,
  },
] as const;

function BrandLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-bold text-white shadow-md shadow-violet-500/30">
        TYR
      </span>
      <span className="text-lg font-bold tracking-tight">Tailor Your Resume</span>
    </Link>
  );
}

export function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo className="text-white" />

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              asChild
              className="text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button
              asChild
              className="bg-violet-600 font-semibold text-white hover:bg-violet-500"
            >
              <Link href="/auth/signup">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden bg-slate-950 px-4 pb-24 pt-16 sm:px-6 sm:pt-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-slate-950 to-slate-950" />
          <div className="relative mx-auto max-w-6xl text-center">
            <span className="inline-flex items-center rounded-full border border-violet-500/40 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-200 shadow-[0_0_24px_-4px_rgba(139,92,246,0.5)]">
              🏆 Built for Mumbai Hacks — 2025
            </span>

            <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-transparent">
                Your Resume, Tailored for Every Job.
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-300 to-purple-400 bg-clip-text text-transparent">
                In 30 Seconds.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
              AI-powered resume builder that rewrites your resume for each job,
              scores it against ATS systems, and preps you for the interview.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 min-w-[200px] bg-violet-600 px-8 text-base font-semibold hover:bg-violet-500"
              >
                <Link href="/auth/signup">Start for Free →</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 min-w-[200px] border-slate-600 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>

            <HeroMockup />
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 bg-white px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How it works
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                Three steps from one profile to interview-ready — built for
                India&apos;s competitive hiring market.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((item) => (
                <div key={item.step} className="text-center md:text-left">
                  <span className="text-4xl font-bold text-violet-200">
                    {item.step}.
                  </span>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-20 border-t border-slate-100 bg-slate-50 px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need to land the role
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-slate-600">
                From LaTeX precision to interview coaching — one workspace for
                your entire job search.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                      <feature.icon className="size-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6">
          <AtsScoreDemo />
        </section>

        <section
          id="pricing"
          className="scroll-mt-20 border-t border-slate-100 bg-slate-50 px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                Start free. Upgrade when you&apos;re serious about volume and
                interview prep.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {PRICING.map((tier) => (
                <Card
                  key={tier.name}
                  className={cn(
                    "relative flex flex-col border-slate-200 bg-white",
                    tier.highlighted &&
                      "border-2 border-violet-500 shadow-lg shadow-violet-100 ring-1 ring-violet-200",
                  )}
                >
                  {"badge" in tier && tier.badge ? (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 border-0 bg-violet-600 text-white">
                      {tier.badge}
                    </Badge>
                  ) : null}
                  <CardHeader>
                    <CardTitle>{tier.name}</CardTitle>
                    <p className="mt-2">
                      <span className="text-3xl font-bold text-slate-900">
                        {tier.price}
                      </span>
                      <span className="text-slate-500">{tier.period}</span>
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <CardDescription className="flex-1 text-sm leading-relaxed">
                      {tier.description}
                    </CardDescription>
                    <Button
                      asChild
                      className={cn(
                        "mt-6 w-full",
                        tier.highlighted
                          ? "bg-violet-600 hover:bg-violet-700"
                          : "",
                      )}
                      variant={tier.highlighted ? "default" : "outline"}
                    >
                      <Link href="/auth/signup">
                        {tier.highlighted ? "Get Pro" : "Get Started"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
          <BrandLogo className="text-slate-900" />

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
            <Link href="#features" className="hover:text-slate-900">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-slate-900">
              How It Works
            </Link>
            <Link href="#pricing" className="hover:text-slate-900">
              Pricing
            </Link>
            <Link href="/auth/login" className="hover:text-slate-900">
              Sign In
            </Link>
            <Link href="/auth/signup" className="hover:text-slate-900">
              Sign Up
            </Link>
          </div>

          <p className="text-sm text-slate-600">
            Made with ❤️ for Indian job seekers
          </p>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700">
            Engineered with Llama 3.3 70B via Groq Architecture
          </p>
        </div>
      </footer>
    </div>
  );
}
