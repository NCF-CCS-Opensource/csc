import { QrCode, ScanLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { DecorativeAccents } from "@/components/decorative-accents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@clerk/nextjs/server";

const STEPS = [
  {
    icon: QrCode,
    title: "Continue with Google & get your QR",
    description:
      "Continue with your @gbox.ncf.edu.ph school Google account and download your personal QR code.",
  },
  {
    icon: ScanLine,
    title: "Scan in at events",
    description: "An Officer scans you in and out at each half-day session — no paper sheet.",
  },
  {
    icon: ShieldCheck,
    title: "Track penalties & clearance",
    description: "See your attendance, penalties, and payments, and know exactly what's owed.",
  },
];

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden px-4 py-16 sm:px-8 sm:py-24">
        <DecorativeAccents />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <Badge>College of Computer Studies</Badge>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            ccs attendance
          </h1>
          <p className="max-w-md text-base font-medium text-muted-foreground sm:text-lg">
            QR-based attendance and penalty tracking — no more paper sign-in sheets.
          </p>
          <div className="flex gap-3">
            <Button asChild variant="pill" size="lg">
              {userId ? (
                <Link href="/dashboard">Go to Dashboard</Link>
              ) : (
                <Link href="/sign-in">Continue with your school Google account</Link>
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-8">
        <h2 className="mb-8 text-center text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
          How it works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card
              key={step.title}
              className="relative rounded-[12px] border-2 border-border bg-[var(--bg-surface)] shadow-[var(--shadow-md)]"
            >
              <CardHeader className="items-center gap-3 text-center">
                <span className="flex size-12 items-center justify-center rounded-full border-2 border-border bg-[var(--color-yellow)] text-foreground">
                  <step.icon className="size-6" aria-hidden />
                </span>
                <CardTitle className="text-base font-bold">
                  <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t-2 border-border/10 px-4 py-6 text-center text-xs text-muted-foreground sm:px-8">
        CCS Attendance · College of Computer Studies
      </footer>
    </main>
  );
}
