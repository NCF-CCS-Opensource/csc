import { QrCode, ScanLine, ShieldCheck } from "lucide-react";
import Link from "next/link";
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
      <section className="bg-muted/40 border-b">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-8 py-20 text-center">
          <Badge variant="secondary">College of Computer Studies</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">CCS Attendance</h1>
          <p className="text-muted-foreground max-w-md text-base sm:text-lg">
            QR-based attendance and penalty tracking — no more paper sign-in sheets.
          </p>
          <div className="flex gap-3">
            <Button asChild size="lg">
              {userId ? (
                <Link href="/dashboard">Go to Dashboard</Link>
              ) : (
                <Link href="/sign-in">Continue with your school Google account</Link>
              )}
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl px-8 py-16">
        <h2 className="mb-8 text-center text-sm font-semibold tracking-wide uppercase text-muted-foreground">
          How it works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="relative border-none shadow-sm">
              <CardHeader className="items-center gap-3 text-center">
                <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                  <step.icon className="size-6" aria-hidden />
                </span>
                <CardTitle className="text-base">
                  <span className="text-muted-foreground mr-1.5">{i + 1}.</span>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-sm">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="text-muted-foreground border-t px-8 py-6 text-center text-xs">
        CCS Attendance · College of Computer Studies
      </footer>
    </main>
  );
}
