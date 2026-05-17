"use client";

import {
  parseStarSections,
  STAR_SECTION_STYLES,
} from "@/lib/interview-utils";
import { cn } from "@/lib/utils";

export function StarHighlightedAnswer({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const sections = parseStarSections(text);

  if (sections.length === 0) {
    return (
      <p
        className={cn("whitespace-pre-wrap text-sm leading-relaxed", className)}
      >
        {text}
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {sections.map((section) => {
        const styles = STAR_SECTION_STYLES[section.key];
        return (
          <div key={section.key} className={styles.container}>
            <p
              className={cn(
                "mb-1 text-xs font-semibold uppercase tracking-wide",
                styles.label,
              )}
            >
              {section.label}
            </p>
            <p className="text-sm leading-relaxed text-slate-800">
              {section.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
