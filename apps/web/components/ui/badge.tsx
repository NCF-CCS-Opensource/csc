import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-border px-3 py-0.5 text-xs font-bold whitespace-nowrap transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-yellow)] text-foreground",
        present: "bg-[var(--color-teal)] text-foreground",
        incomplete: "bg-[var(--color-yellow)] text-foreground",
        absent: "bg-[var(--color-coral)] text-white",
        cleared: "bg-[var(--color-lavender)] text-foreground",
        secondary: "bg-[var(--color-secondary)] text-white",
        destructive: "bg-[var(--color-coral)] text-white",
        outline: "bg-card text-foreground",
        ghost: "bg-transparent text-foreground border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  role = "status",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      role={role}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
