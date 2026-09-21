function Star({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 0c.6 5.9 6.1 11.4 12 12-5.9.6-11.4 6.1-12 12-.6-5.9-6.1-11.4-12-12C5.9 11.4 11.4 5.9 12 0Z" />
    </svg>
  );
}

function Blob({ className }: Readonly<{ className?: string }>) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden fill="currentColor">
      <path d="M45.8,-58.3C58.9,-49.6,68.5,-34.9,72.3,-18.8C76.1,-2.7,74.1,15,66.4,29.8C58.7,44.6,45.3,56.4,29.9,63.5C14.5,70.6,-2.9,73,-19.7,68.9C-36.5,64.8,-52.7,54.2,-62.6,39.4C-72.5,24.6,-76.1,5.6,-72.3,-11.7C-68.5,-29,-57.3,-44.6,-43.1,-53.6C-28.9,-62.6,-14.5,-65,1.6,-67.3C17.6,-69.6,32.7,-67,45.8,-58.3Z" transform="translate(100 100)" />
    </svg>
  );
}

/** Handcrafted, absolute-positioned scatter — parent must be `relative`. */
export function DecorativeAccents({ className }: Readonly<{ className?: string }>) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <Star className="absolute top-[8%] left-[6%] size-8 text-[var(--color-yellow)] sm:size-10" />
      <Star className="absolute top-[18%] right-[10%] size-6 text-[var(--color-pink)] sm:size-8" />
      <Blob className="absolute bottom-[6%] left-[4%] size-24 text-[var(--color-teal)]/40 sm:size-32" />
      <Blob className="absolute -top-6 right-[4%] size-28 text-[var(--color-lavender)]/40 sm:size-40" />
      <Star className="absolute bottom-[12%] right-[16%] size-5 text-[var(--color-secondary)] sm:size-7" />
    </div>
  );
}
