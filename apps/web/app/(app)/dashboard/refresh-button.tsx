"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { dashboardQueryKey } from "./query-key";

export function RefreshButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  // Two caches now, so Refresh has to clear both: the Query cache wins on the
  // client, and router.refresh() alone would leave it untouched (ADR 0013).
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() =>
        startTransition(async () => {
          await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
          router.refresh();
        })
      }
      disabled={pending}
    >
      <RefreshCw className={pending ? "animate-spin" : ""} />
      {pending ? "Refreshing" : "Refresh"}
    </Button>
  );
}
