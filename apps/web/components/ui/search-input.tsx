"use client";

import { Input } from "@/components/ui/input";

export function SearchInput({
  value,
  onChange,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search name, email, or student ID"
      aria-label="Search name, email, or student ID"
      className="flex-1 border-2 border-border rounded-[8px] bg-card focus-visible:ring-2 focus-visible:ring-[var(--color-coral)] focus-visible:border-[var(--color-coral)] shadow-[var(--shadow-sm)]"
    />
  );
}