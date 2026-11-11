"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Check, BookOpen, Layers } from "lucide-react";
import { CourseWithPartsItem } from "@/lib/deviceApi";

interface CoursePartFilterProps {
  courses: CourseWithPartsItem[];
  selectedCourseId: number | "";
  selectedPartId: number | "";
  onCourseChange: (courseId: number | "") => void;
  onPartChange: (partId: number | "") => void;
  allowAll?: boolean;
  disabled?: boolean;
  courseLabel?: string;
  partLabel?: string;
  className?: string;
}

export function CoursePartFilter({
  courses,
  selectedCourseId,
  selectedPartId,
  onCourseChange,
  onPartChange,
  allowAll = false,
  disabled = false,
  courseLabel = "Course",
  partLabel = "Course Part",
  className = "",
}: CoursePartFilterProps) {
  // Course dropdown state
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const courseDropdownRef = useRef<HTMLDivElement>(null);

  // Part dropdown state
  const [partOpen, setPartOpen] = useState(false);
  const [partSearch, setPartSearch] = useState("");
  const partDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        courseDropdownRef.current &&
        !courseDropdownRef.current.contains(event.target as Node)
      ) {
        setCourseOpen(false);
      }
      if (
        partDropdownRef.current &&
        !partDropdownRef.current.contains(event.target as Node)
      ) {
        setPartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Selected course object
  const currentCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courses.find((c) => c.id === Number(selectedCourseId)) || null;
  }, [courses, selectedCourseId]);

  // Available parts for selected course (or all parts if no course selected and allowAll)
  const availableParts = useMemo(() => {
    if (currentCourse) {
      return currentCourse.parts || [];
    }
    if (allowAll) {
      // Gather all unique parts across all courses
      const allPartsMap = new Map<number, { id: number; title: string; short_title?: string }>();
      courses.forEach((c) => {
        c.parts?.forEach((p) => {
          if (!allPartsMap.has(p.id)) {
            allPartsMap.set(p.id, p);
          }
        });
      });
      return Array.from(allPartsMap.values());
    }
    return [];
  }, [currentCourse, courses, allowAll]);

  // Selected part object
  const currentPart = useMemo(() => {
    if (!selectedPartId) return null;
    for (const c of courses) {
      const match = c.parts?.find((p) => p.id === Number(selectedPartId));
      if (match) return match;
    }
    return null;
  }, [courses, selectedPartId]);

  // Filtered courses based on search
  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q))
    );
  }, [courses, courseSearch]);

  // Filtered parts based on search
  const filteredParts = useMemo(() => {
    if (!partSearch.trim()) return availableParts;
    const q = partSearch.toLowerCase();
    return availableParts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        String(p.id).includes(q) ||
        (p.short_title && p.short_title.toLowerCase().includes(q))
    );
  }, [availableParts, partSearch]);

  const handleSelectCourse = (courseId: number | "") => {
    onCourseChange(courseId);
    setCourseOpen(false);
    setCourseSearch("");
    // If resetting course or switching course, clear or check if selected part belongs
    if (courseId === "") {
      if (!allowAll) onPartChange("");
    } else {
      const course = courses.find((c) => c.id === courseId);
      const stillValid = course?.parts?.some((p) => p.id === Number(selectedPartId));
      if (!stillValid) {
        onPartChange("");
      }
    }
  };

  const handleSelectPart = (partId: number | "") => {
    onPartChange(partId);
    setPartOpen(false);
    setPartSearch("");
  };

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
        courseOpen || partOpen ? "relative z-40" : "relative z-10"
      } ${className}`}
    >
      {/* Course Selector */}
      <div className={`relative ${courseOpen ? "z-50" : "z-20"}`} ref={courseDropdownRef}>
        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            {courseLabel} {allowAll ? "" : "*"}
          </span>
          {selectedCourseId !== "" && (
            <button
              type="button"
              onClick={() => handleSelectCourse("")}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              Clear
            </button>
          )}
        </label>

        <button
          type="button"
          disabled={disabled || courses.length === 0}
          onClick={() => {
            setCourseOpen((prev) => !prev);
            setPartOpen(false);
          }}
          className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border text-left flex items-center justify-between transition-all ${
            courseOpen
              ? "border-neutral-400 dark:border-white/30 ring-2 ring-neutral-400/20 shadow-xs"
              : "border-neutral-200/80 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
          } bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="truncate pr-2 font-medium">
            {currentCourse
              ? currentCourse.title
              : allowAll
              ? "All Courses"
              : "Select Course..."}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
              courseOpen ? "rotate-180 text-neutral-700 dark:text-neutral-200" : ""
            }`}
          />
        </button>

        {courseOpen && (
          <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-neutral-200/90 dark:border-white/15 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden py-1 ring-1 ring-black/5 dark:ring-white/10">
            {/* Search Input */}
            <div className="p-2 border-b border-neutral-100 dark:border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search course..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-neutral-300 dark:focus:border-white/20 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Course List */}
            <div className="max-h-56 overflow-y-auto py-1">
              {allowAll && (
                <button
                  type="button"
                  onClick={() => handleSelectCourse("")}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors ${
                    selectedCourseId === "" ? "font-bold text-neutral-900 dark:text-white bg-neutral-100/60 dark:bg-white/5" : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <span>All Courses</span>
                  {selectedCourseId === "" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              )}

              {filteredCourses.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-neutral-400">
                  No courses found
                </div>
              ) : (
                filteredCourses.map((c) => {
                  const isSelected = selectedCourseId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCourse(c.id)}
                      className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors ${
                        isSelected
                          ? "font-bold text-neutral-900 dark:text-white bg-neutral-100/60 dark:bg-white/5"
                          : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-medium">{c.title}</div>
                        {c.subtitle && (
                          <div className="text-[11px] text-neutral-400 truncate">{c.subtitle}</div>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Part Selector */}
      <div className={`relative ${partOpen ? "z-50" : "z-10"}`} ref={partDropdownRef}>
        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-500" />
            {partLabel} {allowAll ? "" : "*"}
          </span>
          {selectedPartId !== "" && (
            <button
              type="button"
              onClick={() => handleSelectPart("")}
              className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              Clear
            </button>
          )}
        </label>

        <button
          type="button"
          disabled={disabled || (!allowAll && !selectedCourseId) || availableParts.length === 0}
          onClick={() => {
            setPartOpen((prev) => !prev);
            setCourseOpen(false);
          }}
          className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border text-left flex items-center justify-between transition-all ${
            partOpen
              ? "border-neutral-400 dark:border-white/30 ring-2 ring-neutral-400/20 shadow-xs"
              : "border-neutral-200/80 dark:border-white/10 hover:border-neutral-300 dark:hover:border-white/20"
          } bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="truncate pr-2 font-medium">
            {currentPart
              ? `${currentPart.title} (Part #${currentPart.id})`
              : !selectedCourseId && !allowAll
              ? "Select course first..."
              : availableParts.length === 0
              ? "No parts available"
              : allowAll
              ? "All Parts"
              : "Select Part..."}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
              partOpen ? "rotate-180 text-neutral-700 dark:text-neutral-200" : ""
            }`}
          />
        </button>

        {partOpen && (
          <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-neutral-200/90 dark:border-white/15 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden py-1 ring-1 ring-black/5 dark:ring-white/10">
            {/* Search Input */}
            <div className="p-2 border-b border-neutral-100 dark:border-white/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={partSearch}
                  onChange={(e) => setPartSearch(e.target.value)}
                  placeholder="Search part..."
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-neutral-300 dark:focus:border-white/20 outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Part List */}
            <div className="max-h-56 overflow-y-auto py-1">
              {allowAll && (
                <button
                  type="button"
                  onClick={() => handleSelectPart("")}
                  className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors ${
                    selectedPartId === "" ? "font-bold text-neutral-900 dark:text-white bg-neutral-100/60 dark:bg-white/5" : "text-neutral-700 dark:text-neutral-300"
                  }`}
                >
                  <span>All Parts</span>
                  {selectedPartId === "" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
              )}

              {filteredParts.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-neutral-400">
                  No parts found
                </div>
              ) : (
                filteredParts.map((p) => {
                  const isSelected = selectedPartId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPart(p.id)}
                      className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors ${
                        isSelected
                          ? "font-bold text-neutral-900 dark:text-white bg-neutral-100/60 dark:bg-white/5"
                          : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="truncate font-medium">{p.title}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">Part #{p.id}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
