// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import React from "react"
import fs from "node:fs"
import path from "node:path"

import {
  BentoGrid,
  BentoCell,
  BentoCellHeader,
  BentoCellOverline,
  BentoCellTitle,
  BentoCellDescription,
  BentoCellContent,
  BentoCellFooter,
} from "./bento-grid"

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("BentoGrid layout container", () => {
  it("renders 4-column base grid with consistent 20px gap and data-slot", () => {
    render(
      <BentoGrid data-testid="bento-grid">
        <BentoCell data-testid="cell-1">Cell 1</BentoCell>
      </BentoGrid>
    )

    const grid = screen.getByTestId("bento-grid")
    expect(grid).toBeInTheDocument()
    expect(grid).toHaveAttribute("data-slot", "bento-grid")
    expect(grid.className).toContain("grid")
    expect(grid.className).toContain("min-[900px]:grid-cols-4")
    expect(grid.className).toContain("gap-5")
    expect(grid.className).toContain("bento-grid")
  })

  it("collapses responsively: 2 columns on tablet (<900px) and 1 column on mobile (<520px)", () => {
    render(
      <BentoGrid data-testid="responsive-grid">
        <div>Cell</div>
      </BentoGrid>
    )

    const grid = screen.getByTestId("responsive-grid")
    // Mobile (<520px): 1 column
    expect(grid.className).toContain("grid-cols-1")
    // Tablet (<900px, >=520px): 2 columns
    expect(grid.className).toContain("min-[520px]:grid-cols-2")
    // Desktop (>=900px): 4 columns
    expect(grid.className).toContain("min-[900px]:grid-cols-4")
  })

  it("defines CSS @utility bento-grid with media queries for 900px tablet and 520px mobile collapse in globals.css", () => {
    const globalsCss = fs.readFileSync(
      path.resolve(__dirname, "../../app/globals.css"),
      "utf-8"
    )

    expect(globalsCss).toContain("@utility bento-grid")
    expect(globalsCss).toMatch(/grid-template-columns:\s*repeat\(4,\s*1fr\)/)
    expect(globalsCss).toMatch(/gap:\s*20px/)
    expect(globalsCss).toMatch(/@media\s*\(\s*max-width:\s*900px\s*\)/)
    expect(globalsCss).toMatch(/grid-template-columns:\s*repeat\(2,\s*1fr\)/)
    expect(globalsCss).toMatch(/@media\s*\(\s*max-width:\s*520px\s*\)/)
    expect(globalsCss).toMatch(/grid-template-columns:\s*1fr/)
  })

  it("supports asChild composition", () => {
    render(
      <BentoGrid asChild>
        <section data-testid="bento-section">
          <div>Section Cell</div>
        </section>
      </BentoGrid>
    )

    const section = screen.getByTestId("bento-section")
    expect(section.tagName.toLowerCase()).toBe("section")
    expect(section).toHaveAttribute("data-slot", "bento-grid")
    expect(section.className).toContain("grid")
  })

  it("merges custom className without losing base grid styles", () => {
    render(
      <BentoGrid className="custom-bento-class" data-testid="custom-grid">
        <div>Cell</div>
      </BentoGrid>
    )

    const grid = screen.getByTestId("custom-grid")
    expect(grid.className).toContain("custom-bento-class")
    expect(grid.className).toContain("grid")
    expect(grid.className).toContain("min-[900px]:grid-cols-4")
  })
})

describe("BentoCell primitive", () => {
  describe("Cell spans", () => {
    it("supports Hero (2×2) span with mobile collapse", () => {
      const { rerender } = render(
        <BentoCell span="hero" data-testid="hero-cell">
          Hero Content
        </BentoCell>
      )

      let cell = screen.getByTestId("hero-cell")
      expect(cell).toHaveAttribute("data-slot", "bento-cell")
      expect(cell).toHaveAttribute("data-span", "hero")
      expect(cell.className).toContain("col-span-2")
      expect(cell.className).toContain("row-span-2")
      expect(cell.className).toContain("max-[520px]:col-span-1")
      expect(cell.className).toContain("max-[520px]:row-span-1")

      // Alias 2x2
      rerender(
        <BentoCell span="2x2" data-testid="hero-cell">
          Hero 2x2 Content
        </BentoCell>
      )
      cell = screen.getByTestId("hero-cell")
      expect(cell.className).toContain("col-span-2")
      expect(cell.className).toContain("row-span-2")
    })

    it("supports Wide (2×1 and 3×1) spans with responsive collapse", () => {
      const { rerender } = render(
        <BentoCell span="wide" data-testid="wide-cell">
          Wide 2x1 Content
        </BentoCell>
      )

      let cell = screen.getByTestId("wide-cell")
      expect(cell.className).toContain("col-span-2")
      expect(cell.className).toContain("row-span-1")
      expect(cell.className).toContain("max-[520px]:col-span-1")

      // 3x1 Wide span
      rerender(
        <BentoCell span="wide-3" data-testid="wide-cell">
          Wide 3x1 Content
        </BentoCell>
      )
      cell = screen.getByTestId("wide-cell")
      expect(cell.className).toContain("col-span-3")
      expect(cell.className).toContain("row-span-1")
      expect(cell.className).toContain("max-[900px]:col-span-2")
      expect(cell.className).toContain("max-[520px]:col-span-1")

      // Alias 3x1
      rerender(
        <BentoCell span="3x1" data-testid="wide-cell">
          Wide 3x1 Alias Content
        </BentoCell>
      )
      cell = screen.getByTestId("wide-cell")
      expect(cell.className).toContain("col-span-3")
      expect(cell.className).toContain("row-span-1")
    })

    it("supports Tall (1×2) span with mobile collapse", () => {
      const { rerender } = render(
        <BentoCell span="tall" data-testid="tall-cell">
          Tall 1x2 Content
        </BentoCell>
      )

      let cell = screen.getByTestId("tall-cell")
      expect(cell.className).toContain("col-span-1")
      expect(cell.className).toContain("row-span-2")
      expect(cell.className).toContain("max-[520px]:row-span-1")

      // Alias 1x2
      rerender(
        <BentoCell span="1x2" data-testid="tall-cell">
          Tall 1x2 Alias Content
        </BentoCell>
      )
      cell = screen.getByTestId("tall-cell")
      expect(cell.className).toContain("col-span-1")
      expect(cell.className).toContain("row-span-2")
    })

    it("supports Small (1×1) span", () => {
      const { rerender } = render(
        <BentoCell span="small" data-testid="small-cell">
          Small 1x1 Content
        </BentoCell>
      )

      let cell = screen.getByTestId("small-cell")
      expect(cell.className).toContain("col-span-1")
      expect(cell.className).toContain("row-span-1")

      // Default span is small
      rerender(
        <BentoCell data-testid="small-cell">Default Span Content</BentoCell>
      )
      cell = screen.getByTestId("small-cell")
      expect(cell.className).toContain("col-span-1")
      expect(cell.className).toContain("row-span-1")
    })

    it("supports manual colSpan and rowSpan overrides", () => {
      render(
        <BentoCell colSpan={3} rowSpan={2} data-testid="manual-span-cell">
          Manual Spanned
        </BentoCell>
      )

      const cell = screen.getByTestId("manual-span-cell")
      expect(cell.className).toContain("col-span-3")
      expect(cell.className).toContain("row-span-2")
    })
  })

  describe("Surface, borders, radius, and selective elevation", () => {
    it("renders white surfaces with 2px #111111 borders and 10-12px border radius", () => {
      render(<BentoCell data-testid="styled-cell">Content</BentoCell>)

      const cell = screen.getByTestId("styled-cell")
      // White surface
      expect(cell.className).toContain("bg-white")
      // 2px border and #111111 border token
      expect(cell.className).toContain("border-2")
      expect(cell.className).toContain("border-[#111111]")
      // 10-12px border radius
      expect(cell.className).toContain("rounded-[10px]")
    })

    it("automatically elevates Hero cells with 6px shadow by default", () => {
      render(
        <BentoCell span="hero" data-testid="hero-cell">
          Hero
        </BentoCell>
      )

      const cell = screen.getByTestId("hero-cell")
      expect(cell).toHaveAttribute("data-elevation", "hero")
      expect(cell.className).toContain("shadow-[var(--shadow-lg)]")
      expect(cell.className).toContain("shadow-[6px_6px_0px_0px_#111111]")
    })

    it("elevates standard cells with 4px shadow by default", () => {
      render(
        <BentoCell span="wide" data-testid="standard-cell">
          Standard Card
        </BentoCell>
      )

      const cell = screen.getByTestId("standard-cell")
      expect(cell).toHaveAttribute("data-elevation", "standard")
      expect(cell.className).toContain("shadow-[var(--shadow-md)]")
      expect(cell.className).toContain("shadow-[4px_4px_0px_0px_#111111]")
    })

    it("renders flat supporting cards with border only (shadow-none) when elevation is flat", () => {
      render(
        <BentoCell elevation="flat" data-testid="flat-cell">
          Flat Supporting Card
        </BentoCell>
      )

      const cell = screen.getByTestId("flat-cell")
      expect(cell).toHaveAttribute("data-elevation", "flat")
      expect(cell.className).toContain("shadow-none")
      expect(cell.className).toContain("border-2")
      expect(cell.className).toContain("border-[#111111]")
    })

    it("allows explicit elevation override regardless of cell span", () => {
      render(
        <BentoCell span="hero" elevation="flat" data-testid="flat-hero">
          Flat Hero
        </BentoCell>
      )

      const cell = screen.getByTestId("flat-hero")
      expect(cell).toHaveAttribute("data-elevation", "flat")
      expect(cell.className).toContain("shadow-none")
    })

    it("supports interactive tactile press-down states", () => {
      render(
        <BentoCell interactive data-testid="interactive-cell">
          Clickable Cell
        </BentoCell>
      )

      const cell = screen.getByTestId("interactive-cell")
      expect(cell.className).toContain("cursor-pointer")
      expect(cell.className).toContain("hover:translate-x-[2px]")
      expect(cell.className).toContain("hover:translate-y-[2px]")
      expect(cell.className).toContain("hover:shadow-[var(--shadow-hover)]")
      expect(cell.className).toContain("active:translate-x-[4px]")
      expect(cell.className).toContain("active:translate-y-[4px]")
      expect(cell.className).toContain("active:shadow-none")
    })
  })

  describe("Overline category tags", () => {
    it("renders overline category tag in uppercase, letter-spaced (0.08em), muted text above title", () => {
      render(
        <BentoCell
          overline="STUDENT PORTAL"
          title="Attendance Summary"
          description="Semester 1 • 2026"
          data-testid="cell-with-header"
        >
          <div>Body copy</div>
        </BentoCell>
      )

      const cell = screen.getByTestId("cell-with-header")
      const overline = screen.getByText("STUDENT PORTAL")
      const title = screen.getByText("Attendance Summary")
      const description = screen.getByText("Semester 1 • 2026")

      expect(overline).toBeInTheDocument()
      expect(overline).toHaveAttribute("data-slot", "bento-cell-overline")
      expect(title).toBeInTheDocument()
      expect(title).toHaveAttribute("data-slot", "bento-cell-title")
      expect(description).toBeInTheDocument()
      expect(description).toHaveAttribute("data-slot", "bento-cell-description")

      // Category tag style requirements:
      // uppercase
      expect(overline.className).toContain("uppercase")
      // letter-spaced (0.08em)
      expect(overline.className).toContain("tracking-[0.08em]")
      // muted text
      expect(overline.className).toContain("text-[#888888]")
      expect(overline.className).toContain("font-semibold")

      // DOM hierarchy: overline must render above title
      const header = overline.closest('[data-slot="bento-cell-header"]')
      expect(header).toBeInTheDocument()
      expect(header?.children[0]).toBe(overline)
      expect(header?.children[1]).toBe(title)
      expect(header?.children[2]).toBe(description)
      expect(cell).toContainElement(header as HTMLElement | null)
    })

    it("supports composable subcomponents for custom header layout", () => {
      render(
        <BentoCell data-testid="composed-cell">
          <BentoCellHeader>
            <BentoCellOverline>OFFICER DESK</BentoCellOverline>
            <BentoCellTitle>Recent Scans</BentoCellTitle>
            <BentoCellDescription>Live booth stream</BentoCellDescription>
          </BentoCellHeader>
          <BentoCellContent data-testid="composed-content">
            <p>Scan 1</p>
          </BentoCellContent>
          <BentoCellFooter data-testid="composed-footer">
            <span>Updated 2s ago</span>
          </BentoCellFooter>
        </BentoCell>
      )

      const overline = screen.getByText("OFFICER DESK")
      const title = screen.getByText("Recent Scans")
      const content = screen.getByTestId("composed-content")
      const footer = screen.getByTestId("composed-footer")

      expect(overline.className).toContain("uppercase")
      expect(overline.className).toContain("tracking-[0.08em]")
      expect(overline.className).toContain("text-[#888888]")
      expect(title.tagName.toLowerCase()).toBe("h3")
      expect(content).toHaveAttribute("data-slot", "bento-cell-content")
      expect(footer).toHaveAttribute("data-slot", "bento-cell-footer")
    })
  })

  describe("Complete Bento Layout and DOM hierarchy", () => {
    it("renders full dashboard bento composition with correct hierarchy and span roles", () => {
      render(
        <BentoGrid data-testid="full-dashboard">
          {/* Hero cell (2x2) */}
          <BentoCell
            span="hero"
            overline="CAMPUS LEDGER"
            title="Active Attendance Session"
            description="Room 402 • General Assembly"
            data-testid="hero-module"
          >
            <div>Active QR Stream</div>
          </BentoCell>

          {/* Wide cell (2x1) */}
          <BentoCell
            span="wide"
            overline="STREAM"
            title="Recent Scan Feed"
            data-testid="wide-module"
          >
            <div>Latest 5 scans</div>
          </BentoCell>

          {/* Tall cell (1x2) */}
          <BentoCell
            span="tall"
            overline="METRICS"
            title="Clearance Status"
            data-testid="tall-module"
          >
            <div>Vertical checklist</div>
          </BentoCell>

          {/* Small cell (1x1) */}
          <BentoCell
            span="small"
            overline="STATS"
            title="Attendees"
            data-testid="small-module"
          >
            <div>124</div>
          </BentoCell>
        </BentoGrid>
      )

      const grid = screen.getByTestId("full-dashboard")
      expect(grid.children.length).toBe(4)

      const hero = screen.getByTestId("hero-module")
      expect(hero).toHaveAttribute("data-span", "hero")
      expect(hero).toHaveAttribute("data-elevation", "hero")
      expect(hero.className).toContain("col-span-2")
      expect(hero.className).toContain("row-span-2")

      const wide = screen.getByTestId("wide-module")
      expect(wide).toHaveAttribute("data-span", "wide")
      expect(wide).toHaveAttribute("data-elevation", "standard")
      expect(wide.className).toContain("col-span-2")
      expect(wide.className).toContain("row-span-1")

      const tall = screen.getByTestId("tall-module")
      expect(tall).toHaveAttribute("data-span", "tall")
      expect(tall).toHaveAttribute("data-elevation", "standard")
      expect(tall.className).toContain("col-span-1")
      expect(tall.className).toContain("row-span-2")

      const small = screen.getByTestId("small-module")
      expect(small).toHaveAttribute("data-span", "small")
      expect(small).toHaveAttribute("data-elevation", "standard")
      expect(small.className).toContain("col-span-1")
      expect(small.className).toContain("row-span-1")
    })
  })
})
