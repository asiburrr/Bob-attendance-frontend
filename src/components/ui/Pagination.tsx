"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
}: PaginationProps) {
  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 text-xs text-neutral-600 dark:text-neutral-400 select-none">
      {/* Records Count & Page Size */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing{" "}
          <strong className="text-neutral-900 dark:text-neutral-100 font-mono">
            {startRecord}–{endRecord}
          </strong>{" "}
          of{" "}
          <strong className="text-neutral-900 dark:text-neutral-100 font-mono">
            {totalRecords}
          </strong>{" "}
          records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-neutral-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={disabled}
              className="px-2 py-1 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 font-mono text-neutral-900 dark:text-neutral-100 outline-none focus:ring-1 focus:ring-neutral-400/20"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={disabled || currentPage <= 1}
          className="p-1.5 rounded-xl border border-neutral-200/60 dark:border-white/10 hover:bg-neutral-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={disabled || currentPage <= 1}
          className="p-1.5 rounded-xl border border-neutral-200/60 dark:border-white/10 hover:bg-neutral-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-1.5 text-neutral-400 font-mono text-xs">
                  …
                </span>
              );
            }
            const isCurrent = p === currentPage;
            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onPageChange(Number(p))}
                disabled={disabled || isCurrent}
                className={`min-w-[28px] h-7 px-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  isCurrent
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-xs"
                    : "border border-neutral-200/60 dark:border-white/10 hover:bg-neutral-500/10 text-neutral-700 dark:text-neutral-300"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={disabled || currentPage >= totalPages}
          className="p-1.5 rounded-xl border border-neutral-200/60 dark:border-white/10 hover:bg-neutral-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={disabled || currentPage >= totalPages}
          className="p-1.5 rounded-xl border border-neutral-200/60 dark:border-white/10 hover:bg-neutral-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          title="Last Page"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
