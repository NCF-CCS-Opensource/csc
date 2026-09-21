import { FloatingNavbar } from "@/components/floating-navbar";
import { ModeToggle } from "@/components/mode-toggle";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg-page)]">
      <FloatingNavbar right={<ModeToggle />} />
      {children}
    </div>
  );
}
