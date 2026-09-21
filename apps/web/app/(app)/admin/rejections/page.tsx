import Link from "next/link";
import type { RejectedScanLogRequest, RejectedScanLogResponse } from "@attendance/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireGovernor } from "@/lib/auth";
import { apiPost } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export default async function RejectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  await requireGovernor();
  const { q, sort } = await searchParams;

  const { rejections: rows } = await apiPost<RejectedScanLogResponse>("scan/rejections-log", {
    q,
    sort: sort === "time" ? "time" : "student",
  } satisfies RejectedScanLogRequest);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-[var(--bg-page)] min-h-[calc(100vh-3rem)]">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]">
          Governor Audit Log
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground lowercase">
          rejected scans
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Permanent scan rejections and anomalies requiring administrative review.
        </p>
      </header>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Filter by Student or QR reference"
          className="flex-1 rounded-[8px] border-2 border-border bg-card px-3 py-2 text-sm shadow-[var(--shadow-sm)] outline-none transition-all focus:border-[var(--color-coral)] focus:ring-2 focus:ring-[var(--color-coral)]"
        />
        <input type="hidden" name="sort" value={sort ?? ""} />
        <Button type="submit" variant="default" className="shadow-[var(--shadow-sm)]">
          Filter
        </Button>
      </form>

      <div className="flex gap-3">
        <Button asChild variant="outline" size="sm" className="shadow-[var(--shadow-sm)]">
          <Link href={`/admin/rejections?${q ? `q=${encodeURIComponent(q)}&` : ""}sort=student`}>
            Sort by Student
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="shadow-[var(--shadow-sm)]">
          <Link href={`/admin/rejections?${q ? `q=${encodeURIComponent(q)}&` : ""}sort=time`}>
            Sort by time
          </Link>
        </Button>
      </div>

      <Card className="border-2 border-border rounded-[12px] bg-card shadow-[var(--shadow-md)]">
        <CardHeader className="border-b-2 border-border/10">
          <CardTitle className="font-heading text-lg font-bold">
            Rejected Scans Log ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No rejected scans.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((row) => (
                <div
                  key={row.scanId}
                  data-testid="rejected-scan-entry"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[10px] bg-card border-2 border-[#F9A8B8] shadow-[var(--shadow-md)] transition-all"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold text-sm sm:text-base text-foreground">
                        {row.studentName
                          ? `${row.studentName} (${row.studentIdText})`
                          : "Unresolved QR"}
                      </span>
                      <Badge variant="absent" className="text-xs shadow-[var(--shadow-sm)]">
                        Rejected
                      </Badge>
                    </div>
                    <p
                      className="text-muted-foreground font-mono text-xs truncate max-w-md"
                      title={row.qrPayload}
                    >
                      QR: {row.qrPayload}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground sm:text-right shrink-0">
                    <span>
                      Officer: <strong className="text-foreground">{row.officerName}</strong>
                    </span>
                    <span className="font-mono">
                      {new Date(row.scannedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
