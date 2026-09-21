import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-[#111111] px-3 py-0.5 text-xs font-bold whitespace-nowrap transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[#FFE566] text-[#111111]",
        present: "bg-[#4ECDC4] text-[#111111]",
        incomplete: "bg-[#FFE566] text-[#111111]",
        absent: "bg-[#E8635A] text-white",
        cleared: "bg-[#C4B5FD] text-[#111111]",
        secondary: "bg-[#7B6CF6] text-white",
        destructive: "bg-[#E8635A] text-white",
        outline: "bg-white text-[#111111]",
        ghost: "bg-transparent text-[#111111] border-transparent",
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
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
