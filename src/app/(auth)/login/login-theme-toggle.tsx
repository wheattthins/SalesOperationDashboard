"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";

export function LoginThemeToggle() {
  return (
    <div className="absolute right-4 top-4 z-10 lg:right-6 lg:top-6">
      <ThemeToggle />
    </div>
  );
}
