"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Next 16 (App Router) has no generic "navigation pending" event outside a
// single <Link>'s useLinkStatus subtree, so this shows the bar on any
// internal link click and hides it once usePathname()/useSearchParams()
// reflect the new route (issue #318).
export function NavProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const locationKey = useRef(`${pathname}?${searchParams.toString()}`);

  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`;
    if (key !== locationKey.current) {
      locationKey.current = key;
      setVisible(false);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a");
      if (
        !anchor ||
        anchor.target ||
        anchor.hasAttribute("download") ||
        !anchor.href ||
        anchor.origin !== window.location.origin
      ) {
        return;
      }
      if (`${anchor.pathname}?${anchor.search.slice(1)}` !== locationKey.current) {
        setVisible(true);
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  if (!visible) return null;

  return (
    <progress
      aria-label="Page loading"
      value={1}
      max={1}
      className="fixed top-0 left-0 z-50 h-0.5 w-full animate-pulse appearance-none bg-transparent [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-[var(--color-yellow)] [&::-moz-progress-bar]:bg-[var(--color-yellow)]"
    />
  );
}
