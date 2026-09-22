"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateProgramCaches, invalidateSemesterCaches } from "./query-sync";

// Program and Semester mutations here are plain Server Actions with no
// client-side mutation call to hook onSuccess into, so this instead watches
// this page's freshly-fetched content: a content signature changes exactly
// when a Program or Semester write actually landed (the redirect back to
// /admin re-fetches both lists), and each effect invalidates only the caches
// that entity's data feeds.
export function AdminCacheSync({
  programsSignature,
  semestersSignature,
}: {
  programsSignature: string;
  semestersSignature: string;
}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    invalidateProgramCaches(queryClient);
    // programsSignature is the effect's real dependency; queryClient is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programsSignature]);

  useEffect(() => {
    invalidateSemesterCaches(queryClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semestersSignature]);

  return null;
}
