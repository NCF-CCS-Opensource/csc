"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAGE_SIZES = [10, 15, 20];

export function usePagination<T>(items: T[], initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, items, pageSize],
  );

  return {
    page: currentPage,
    pageItems,
    pageSize,
    totalPages,
    setPage,
    setPageSize: (nextPageSize: number) => {
      setPageSizeState(nextPageSize);
      setPage(1);
    },
  };
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span>Rows per page</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger
            aria-label="Rows per page"
            className="border-2 border-[#111111] bg-white shadow-[var(--shadow-sm)]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={String(size)}>{size} per page</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>{totalItems} total</span>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span className="min-w-24 text-center text-sm font-bold">Page {page} of {totalPages}</span>
        <Button type="button" variant="outline" size="sm" aria-label="Next page" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
