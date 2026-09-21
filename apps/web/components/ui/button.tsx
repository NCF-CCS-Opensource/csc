import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center font-bold whitespace-nowrap text-sm outline-none select-none transition-all duration-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:translate-x-0 disabled:translate-y-0 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "rounded-[10px] bg-primary text-white border-2 border-border shadow-[var(--shadow-md)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:shadow-[var(--shadow-md)]",
        primary:
          "rounded-[10px] bg-primary text-white border-2 border-border shadow-[var(--shadow-md)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:shadow-[var(--shadow-md)]",
        ghost:
          "rounded-[10px] bg-transparent text-foreground border-2 border-border shadow-[var(--shadow-md)] hover:bg-[var(--bg-page)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:shadow-[var(--shadow-md)]",
        pill:
          "rounded-full bg-primary text-white border-2 border-border shadow-[var(--shadow-md)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:shadow-[var(--shadow-md)]",
        secondary:
          "rounded-[10px] bg-secondary text-white border-2 border-border shadow-[var(--shadow-md)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:shadow-[var(--shadow-md)]",
        outline:
          "rounded-[10px] bg-card text-foreground border-2 border-border shadow-[var(--shadow-md)] hover:bg-[var(--bg-page)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:shadow-[var(--shadow-md)]",
        destructive:
          "rounded-[10px] bg-destructive text-white border-2 border-border shadow-[var(--shadow-md)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none disabled:shadow-[var(--shadow-md)]",
        link: "text-foreground underline-offset-4 hover:underline border-0 shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0",
      },
      size: {
        default:
          "h-9 gap-1.5 px-4 py-2 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9 p-0",
        "icon-xs": "size-6 p-0 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
