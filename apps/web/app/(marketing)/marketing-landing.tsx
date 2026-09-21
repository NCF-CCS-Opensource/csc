import {
  ArrowRight,
  CheckCircle2,
  Crown,
  GraduationCap,
  QrCode,
  ScanLine,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { AppLogoMark } from "@/components/app-logo";
import { DecorativeAccents } from "@/components/decorative-accents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type IconTone = "yellow" | "coral" | "teal" | "lavender";

const ICON_TONES: Record<IconTone, string> = {
  yellow: "bg-[var(--color-yellow)] text-foreground",
  coral: "bg-[var(--color-coral)] text-white",
  teal: "bg-[var(--color-teal)] text-foreground",
  lavender: "bg-[var(--color-lavender)] text-foreground",
};

function AccentIcon({
  icon: Icon,
  tone,
}: Readonly<{ icon: LucideIcon; tone: IconTone }>) {
  return (
    <span
      className={`flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] ${ICON_TONES[tone]}`}
    >
      <Icon className="size-6" aria-hidden />
    </span>
  );
}

function SectionHeading({
  overline,
  title,
  lede,
}: Readonly<{ overline: string; title: string; lede?: string }>) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {overline}
      </p>
      <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {lede ? (
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">{lede}</p>
      ) : null}
    </div>
  );
}

const roles = [
  {
    icon: GraduationCap,
    tone: "teal" as const,
    name: "Student",
    blurb:
      "Know exactly where you stand: attendance history, live penalty balance, and clearance readiness — all from your own QR card.",
    points: ["personal QR card", "real-time penalty ledger", "clearance standing"],
  },
  {
    icon: ScanLine,
    tone: "yellow" as const,
    name: "Officer",
    blurb:
      "Run events end to end: create events, staff the scan booth, correct grids, record payments at the booth, and verify clearances.",
    points: ["event creation & booth scans", "manual attendance corrections", "payment recording & clearance checks"],
  },
  {
    icon: Crown,
    tone: "lavender" as const,
    name: "Governor",
    blurb:
      "Own the semester cycle: create and close semesters, manage programs, promote officers, and pull official PDF reports with AI narratives.",
    points: ["semester lifecycle", "programs & officer promotions", "official PDF reports"],
  },
];

const steps = [
  {
    icon: QrCode,
    tone: "yellow" as const,
    title: "Sign in & grab your QR",
    copy: "Continue with your @gbox.ncf.edu.ph school Google account, claim your roster entry, and grab your QR card.",
  },
  {
    icon: ScanLine,
    tone: "teal" as const,
    title: "Scan in at every session",
    copy: "Officers scan you in and out at each AM and PM session — the full pair is what marks you present.",
  },
  {
    icon: ShieldCheck,
    tone: "coral" as const,
    title: "Watch the ledger, then clear",
    copy: "Missed sessions become penalties on your ledger. Settle them and your clearance opens.",
  },
];

function Hero({ signedIn }: Readonly<{ signedIn: boolean }>) {
  const href = signedIn ? "/dashboard" : "/sign-in";
  const label = signedIn ? "Go to Dashboard" : "Continue with your school Google account";

  return (
    <section data-testid="hero" className="relative overflow-hidden px-4 py-20 sm:px-8 sm:py-28">
      <DecorativeAccents />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
        <AppLogoMark size="xl" className="size-16 sm:size-20" />
        <Badge>College of Computer Studies</Badge>
        <h1 className="font-heading text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl">
          ccs attendance
        </h1>
        <p className="max-w-xl text-base font-medium text-muted-foreground sm:text-lg">
          QR-based attendance, penalties, and semester clearance for the College of Computer
          Studies — no more paper sign-in sheets.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button asChild variant="pill" size="lg">
            <Link href={href} data-testid="hero-cta">
              {label}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/#how-it-works">
              See how it works <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Built for every student, officer, and governor of CCS.
        </p>
      </div>
    </section>
  );
}

function ValueProps() {
  return (
    <section
      id="value-prop"
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-8 sm:py-24"
    >
      <SectionHeading
        overline="what it does"
        title="attendance without the clipboard"
        lede="Everything an event needs to record who showed up, what they owe, and whether they clear — kept in one ledger."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-[10px] border-2 border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-lg)] sm:col-span-2 sm:p-6 lg:row-span-2">
          <AccentIcon icon={QrCode} tone="yellow" />
          <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
            Scan in, scan out
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Officers run realtime check-in booths that read a QR card instead of ticking a paper
            list. Every time-in and time-out is captured the instant it’s scanned — both halves, no
            sign-in sheets.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-[10px] border-2 border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)] sm:p-6 lg:row-span-2">
          <AccentIcon icon={Wallet} tone="coral" />
          <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
            a penalty ledger that adds itself up
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Missed sessions become penalty balances automatically. What you owe is derived on read,
            never guessed — and every payment recorded against it stays auditable.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-[10px] border-2 border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <AccentIcon icon={ShieldCheck} tone="teal" />
          <h3 className="font-heading text-lg font-bold tracking-tight text-foreground">
            clearance you can verify
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The end-of-semester gate opens exactly when your outstanding balance is zero — checked
            on screen before you’re signed off.
          </p>
        </div>
        <div className="flex flex-col gap-3 rounded-[10px] border-2 border-[var(--border)] bg-[var(--bg-surface)] p-5 sm:p-6">
          <AccentIcon icon={GraduationCap} tone="lavender" />
          <h3 className="font-heading text-lg font-bold tracking-tight text-foreground">
            CCS rules, enforced
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Whole-semester liability, separate per-semester balances, and AM/PM session checks —
            codified the way the department runs it.
          </p>
        </div>
      </div>
    </section>
  );
}

function Roles() {
  return (
    <section id="roles" className="bg-[var(--bg-surface-elevated)] py-20 sm:py-24">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-8">
        <SectionHeading
          overline="who it’s for"
          title="built for everyone at the college"
          lede="One ledger, three seats at the table."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.name}
              data-slot="role-card"
              className="flex flex-col gap-4 rounded-[10px] border-2 border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)] sm:p-6"
            >
              <AccentIcon icon={role.icon} tone={role.tone} />
              <div>
                <h3 className="font-heading text-lg font-bold tracking-tight text-foreground">
                  {role.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{role.blurb}</p>
                <ul className="mt-4 flex flex-col gap-2">
                  {role.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm font-medium text-foreground"
                    >
                      <CheckCircle2
                        className="size-4 shrink-0 text-[var(--color-coral)]"
                        aria-hidden
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-8 sm:py-24"
    >
      <SectionHeading
        overline="how it works"
        title="from sign-in to signed-off"
        lede="Three steps and you’re on the ledger."
      />
      <div className="grid gap-5 md:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.title}
            data-testid="how-it-works-step"
            className="flex flex-col gap-4 rounded-[10px] border-2 border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)] sm:p-6"
          >
            <span className="flex size-12 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--color-yellow)] font-heading text-lg font-extrabold text-foreground">
              {i + 1}
            </span>
            <div>
              <h3 className="font-heading text-lg font-bold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaBand({ signedIn }: Readonly<{ signedIn: boolean }>) {
  const href = signedIn ? "/dashboard" : "/sign-in";
  const label = signedIn ? "Go to Dashboard" : "Continue with your school Google account";

  return (
    <section className="px-4 pb-20 sm:px-8 sm:pb-24">
      <div className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-[14px] border-2 border-[var(--border)] bg-[var(--bg-dark)] px-6 py-14 text-center shadow-[var(--shadow-lg)] sm:px-10 sm:py-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
          ready when you are
        </p>
        <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          your attendance, finally on a ledger
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-medium text-white/80">
          Join the students, officers, and governors of CCS who trade clipboards for QR codes at
          every assembly.
        </p>
        <div className="mt-8">
          <Button asChild variant="pill" size="lg">
            <Link href={href} data-testid="band-cta">
              {label}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export function MarketingLanding({ signedIn }: Readonly<{ signedIn: boolean }>) {
  return (
    <main className="flex flex-1 flex-col">
      <Hero signedIn={signedIn} />
      <ValueProps />
      <Roles />
      <HowItWorks />
      <CtaBand signedIn={signedIn} />
      <footer
        data-testid="landing-footer"
        className="border-t-2 border-border px-4 py-6 text-center text-xs font-medium text-muted-foreground sm:px-8"
      >
        CCS Attendance · College of Computer Studies — No paper. No lost records.
      </footer>
    </main>
  );
}