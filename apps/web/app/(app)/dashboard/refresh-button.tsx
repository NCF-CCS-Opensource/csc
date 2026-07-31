"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
    >
      <RefreshCw className={pending ? "animate-spin" : ""} />
      {pending ? "Refreshing" : "Refresh"}
    </Button>
  );
}
