import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

export const bentoGridVariants = cva(
  "bento-grid grid grid-cols-1 min-[520px]:grid-cols-2 min-[900px]:grid-cols-4 gap-5 w-full",
  {
    variants: {
      gap: {
        default: "gap-5",
        compact: "gap-4",
        loose: "gap-6",
      },
    },
    defaultVariants: {
      gap: "default",
    },
  }
)

export interface BentoGridProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof bentoGridVariants> {
  asChild?: boolean
}

export function BentoGrid({
  className,
  gap,
  asChild = false,
  ...props
}: Readonly<BentoGridProps>) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="bento-grid"
      className={cn(bentoGridVariants({ gap }), className)}
      {...props}
    />
  )
}

export const bentoCellVariants = cva(
  "bento-cell relative flex flex-col overflow-hidden bg-card text-foreground border-2 border-border rounded-[10px] p-5 sm:p-6 transition-all duration-100",
  {
    variants: {
      span: {
        hero: "col-span-2 row-span-2 max-[520px]:col-span-1 max-[520px]:row-span-1",
        "2x2": "col-span-2 row-span-2 max-[520px]:col-span-1 max-[520px]:row-span-1",
        wide: "col-span-2 row-span-1 max-[520px]:col-span-1",
        "2x1": "col-span-2 row-span-1 max-[520px]:col-span-1",
        "wide-3": "col-span-3 row-span-1 max-[900px]:col-span-2 max-[520px]:col-span-1",
        "3x1": "col-span-3 row-span-1 max-[900px]:col-span-2 max-[520px]:col-span-1",
        tall: "col-span-1 row-span-2 max-[520px]:row-span-1",
        "1x2": "col-span-1 row-span-2 max-[520px]:row-span-1",
        small: "col-span-1 row-span-1",
        "1x1": "col-span-1 row-span-1",
      },
      elevation: {
        hero: "shadow-[var(--shadow-lg)]",
        standard: "shadow-[var(--shadow-md)]",
        flat: "shadow-none",
      },
      interactive: {
        true: "cursor-pointer select-none hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[var(--shadow-hover)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
        false: "",
      },
    },
    defaultVariants: {
      span: "small",
      elevation: "standard",
      interactive: false,
    },
  }
)

export type BentoCellSpan =
  | "hero"
  | "wide"
  | "wide-3"
  | "tall"
  | "small"
  | "2x2"
  | "2x1"
  | "3x1"
  | "1x2"
  | "1x1"

export type BentoCellElevation = "hero" | "standard" | "flat"

export interface BentoCellProps
  extends Omit<React.ComponentProps<"div">, "title">,
    Omit<VariantProps<typeof bentoCellVariants>, "span" | "elevation"> {
  span?: BentoCellSpan
  elevation?: BentoCellElevation
  colSpan?: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2
  overline?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  asChild?: boolean
}

export function BentoCell({
  className,
  span = "small",
  elevation,
  colSpan,
  rowSpan,
  interactive,
  overline,
  title,
  description,
  asChild = false,
  children,
  ...props
}: Readonly<BentoCellProps>) {
  const Comp = asChild ? Slot.Root : "div"

  // Selective hard offset elevation:
  // Hero cells get 6px shadows by default, standard cards get 4px shadows, flat supporting cards use border only
  const resolvedElevation: BentoCellElevation =
    elevation ??
    (span === "hero" || span === "2x2" || (colSpan === 2 && rowSpan === 2)
      ? "hero"
      : "standard")

  const manualSpanClasses = cn(
    colSpan === 1 && "col-span-1",
    colSpan === 2 && "col-span-2 max-[520px]:col-span-1",
    colSpan === 3 && "col-span-3 max-[900px]:col-span-2 max-[520px]:col-span-1",
    colSpan === 4 && "col-span-4 max-[900px]:col-span-2 max-[520px]:col-span-1",
    rowSpan === 1 && "row-span-1",
    rowSpan === 2 && "row-span-2 max-[520px]:row-span-1"
  )

  const hasHeaderProps = Boolean(overline || title || description)

  return (
    <Comp
      data-slot="bento-cell"
      data-span={span}
      data-elevation={resolvedElevation}
      className={cn(
        bentoCellVariants({
          span: colSpan || rowSpan ? undefined : span,
          elevation: resolvedElevation,
          interactive,
        }),
        manualSpanClasses,
        className
      )}
      {...props}
    >
      {hasHeaderProps && !asChild ? (
        <>
          <BentoCellHeader>
            {overline && <BentoCellOverline>{overline}</BentoCellOverline>}
            {title && <BentoCellTitle>{title}</BentoCellTitle>}
            {description && (
              <BentoCellDescription>{description}</BentoCellDescription>
            )}
          </BentoCellHeader>
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export function BentoCellHeader({
  className,
  ...props
}: Readonly<React.ComponentProps<"div">>) {
  return (
    <div
      data-slot="bento-cell-header"
      className={cn("flex flex-col gap-1 pb-3", className)}
      {...props}
    />
  )
}

export function BentoCellOverline({
  className,
  ...props
}: Readonly<React.ComponentProps<"span">>) {
  return (
    <span
      data-slot="bento-cell-overline"
      className={cn(
        "text-xs font-semibold uppercase tracking-[0.08em] text-[#888888]",
        className
      )}
      {...props}
    />
  )
}

export function BentoCellTitle({
  className,
  children,
  ...props
}: Readonly<React.ComponentProps<"h3">>) {
  return (
    <h3
      data-slot="bento-cell-title"
      className={cn(
        "font-heading text-lg font-bold leading-snug text-foreground tracking-tight",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function BentoCellDescription({
  className,
  ...props
}: Readonly<React.ComponentProps<"p">>) {
  return (
    <p
      data-slot="bento-cell-description"
      className={cn("text-sm text-muted-foreground leading-relaxed", className)}
      {...props}
    />
  )
}

export function BentoCellContent({
  className,
  ...props
}: Readonly<React.ComponentProps<"div">>) {
  return (
    <div
      data-slot="bento-cell-content"
      className={cn("flex-1 text-sm text-foreground", className)}
      {...props}
    />
  )
}

export function BentoCellFooter({
  className,
  ...props
}: Readonly<React.ComponentProps<"div">>) {
  return (
    <div
      data-slot="bento-cell-footer"
      className={cn("mt-auto flex items-center pt-3 gap-2", className)}
      {...props}
    />
  )
}

// Aliases
export {
  BentoCellOverline as BentoOverline,
  BentoCellTitle as BentoTitle,
  BentoCellDescription as BentoDescription,
}
