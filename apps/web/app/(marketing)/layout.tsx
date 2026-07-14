import { ModeToggle } from "@/components/mode-toggle";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-end border-b px-4">
        <ModeToggle />
      </header>
      {children}
    </div>
  );
}
