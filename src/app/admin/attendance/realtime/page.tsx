"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CheckCheck,
  UserX,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/feedback/Toast";
import { CoursePartFilter } from "@/components/attendance/CoursePartFilter";
import {
  fetchCoursesWithParts,
  fetchRealtimeAttendance,
  markRealtimeAttendance,
  bulkMarkRealtimeAttendance,
  CourseWithPartsItem,
  RealtimeAttendanceStudent,
} from "@/lib/deviceApi";

// ==============================================================================
// Memoized Individual Student Row (Prevents other rows from re-rendering or jumping)
// ==============================================================================
interface StudentRowProps {
  student: RealtimeAttendanceStudent;
  isMarking: boolean;
  onMark: (student: RealtimeAttendanceStudent, status: "present" | "late" | "absent") => void;
}

const StudentRow = React.memo(function StudentRow({
  student,
  isMarking,
  onMark,
}: StudentRowProps) {
  const initials = student.name
    ? student.name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "ST";

  return (
    <tr className="hover:bg-neutral-500/5 transition-colors group">
      {/* Student Info */}
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-3">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={student.name}
              className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-white/10 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0 border border-neutral-300/40 dark:border-white/10 shadow-xs">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-neutral-900 dark:text-white truncate text-xs sm:text-sm">
              {student.name || "Unnamed Student"}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              <span>ID: {student.student_id}</span>
              {student.phone_number && (
                <>
                  <span>•</span>
                  <span>{student.phone_number}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Attendance Status */}
      <td className="py-3.5 pr-4">
        <div className="flex flex-col items-start gap-1">
          {student.status === "present" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Present
            </span>
          )}
          {student.status === "late" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
              <Clock className="w-3.5 h-3.5" />
              Late
            </span>
          )}
          {student.status === "absent" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25">
              <XCircle className="w-3.5 h-3.5" />
              Absent
            </span>
          )}
          {student.status === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20">
              <Clock className="w-3.5 h-3.5" />
              Pending
            </span>
          )}

          {student.att_time && (
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
              {student.att_time} {student.log_type ? `[${student.log_type}]` : ""}
            </span>
          )}
        </div>
      </td>

      {/* Action Buttons: Present | Late | Absent */}
      <td className="py-3.5 text-right">
        <div className="inline-flex items-center gap-1.5 sm:gap-2">
          {/* Present Button */}
          <button
            type="button"
            onClick={() => onMark(student, "present")}
            disabled={isMarking}
            title={student.status === "present" ? "Click to undo Present (reset to Pending)" : "Mark as Present"}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${student.status === "present"
              ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30"
              : "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300"
              }`}
          >
            Present
          </button>

          {/* Late Button */}
          <button
            type="button"
            onClick={() => onMark(student, "late")}
            disabled={isMarking}
            title={student.status === "late" ? "Click to undo Late (reset to Pending)" : "Mark as Late"}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${student.status === "late"
              ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-500/30"
              : "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-300"
              }`}
          >
            Late
          </button>

          {/* Absent Button */}
          <button
            type="button"
            onClick={() => onMark(student, "absent")}
            disabled={isMarking}
            title={student.status === "absent" ? "Click to undo Absent (reset to Pending)" : "Mark as Absent"}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${student.status === "absent"
              ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30"
              : "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-300"
              }`}
          >
            Absent
          </button>
        </div>
      </td>
    </tr>
  );
});

// ==============================================================================
// Main Realtime Attendance Page
// ==============================================================================
export default function RealtimeAttendancePage() {
  const toast = useToast();

  // Filters & State
  const [courses, setCourses] = useState<CourseWithPartsItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedPartId, setSelectedPartId] = useState<number | "">("");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [fetchingRoster, setFetchingRoster] = useState(false);
  const [students, setStudents] = useState<RealtimeAttendanceStudent[]>([]);
  const [partInfo, setPartInfo] = useState<{ title: string; courseTitle: string }>({
    title: "",
    courseTitle: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [markingStudentId, setMarkingStudentId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Ref tracking in-flight student action so 7s background poll doesn't interfere
  const markingStudentIdRef = useRef<string | null>(null);

  // Available parts for selected course
  const currentParts = useMemo(() => {
    if (!selectedCourseId) return [];
    const course = courses.find((c) => c.id === Number(selectedCourseId));
    return course ? course.parts : [];
  }, [courses, selectedCourseId]);

  // Initial load: fetch courses and their parts (Do NOT auto-select initially)
  useEffect(() => {
    let isMounted = true;
    async function loadCourses() {
      try {
        setInitialLoading(true);
        const data = await fetchCoursesWithParts();
        if (!isMounted) return;
        setCourses(data);
      } catch {
        if (isMounted) toast.error("Failed to load courses");
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }
    loadCourses();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  // When course changes
  const handleCourseChange = (courseId: number | "") => {
    setSelectedCourseId(courseId);
    setSelectedPartId("");
    setStudents([]);
    setPartInfo({ title: "", courseTitle: "" });
  };

  // Stable load attendance function
  const loadAttendance = useCallback(
    async (silent = false) => {
      if (!selectedPartId) {
        setStudents([]);
        return;
      }
      try {
        if (!silent) setFetchingRoster(true);
        const res = await fetchRealtimeAttendance(Number(selectedPartId), selectedDate);
        if (res.status === "success") {
          setStudents((prev) => {
            // First time loading: set directly
            if (prev.length === 0 || !silent) {
              return res.students || [];
            }

            // Silent poll: only update rows that actually changed to prevent scrolling/rerendering
            let hasAnyChange = false;
            const updated = prev.map((curr) => {
              if (markingStudentIdRef.current === curr.student_id) {
                return curr;
              }
              const fresh = res.students?.find((s) => s.student_id === curr.student_id);
              if (!fresh) return curr;

              if (curr.status !== fresh.status || curr.att_time !== fresh.att_time) {
                hasAnyChange = true;
                return {
                  ...curr,
                  status: fresh.status,
                  att_time: fresh.att_time,
                  log_id: fresh.log_id,
                  log_type: fresh.log_type,
                };
              }
              return curr;
            });

            return hasAnyChange ? updated : prev;
          });

          setPartInfo({
            title: res.part_title,
            courseTitle: res.course_title,
          });
        } else if (!silent) {
          toast.error("Failed to load attendance roster");
        }
      } catch {
        if (!silent) {
          toast.error("Connection error loading attendance");
        }
      } finally {
        if (!silent) setFetchingRoster(false);
      }
    },
    [selectedPartId, selectedDate, toast]
  );

  // Fetch only when selected part or date changes, plus silent 7-second background poll
  useEffect(() => {
    if (!selectedPartId) return;

    loadAttendance(false);

    const intervalId = setInterval(() => {
      loadAttendance(true);
    }, 7000);

    return () => clearInterval(intervalId);
  }, [selectedPartId, selectedDate, loadAttendance]);

  // 1-Click Action: Mark or Undo Single Student (Modifies ONLY the targeted row in-place)
  const handleMark = useCallback(
    async (student: RealtimeAttendanceStudent, targetStatus: "present" | "late" | "absent") => {
      if (!selectedPartId) return;

      const previousStatus = student.status;
      const previousTime = student.att_time;
      const previousLogType = student.log_type;
      const previousLogId = student.log_id;

      // Undo logic: tapping the currently active status resets to pending and removes attendance record
      const isUndo = previousStatus === targetStatus;
      const newStatus = isUndo ? "pending" : targetStatus;
      const nowTimeStr = isUndo
        ? null
        : new Date().toLocaleTimeString("en-US", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        });

      markingStudentIdRef.current = student.student_id;
      setMarkingStudentId(student.student_id);

      // 1. Immediate in-place state update of ONLY the affected row
      setStudents((prev) =>
        prev.map((s) =>
          s.student_id === student.student_id
            ? {
              ...s,
              status: newStatus,
              att_time: nowTimeStr,
              log_type: isUndo ? null : "manual",
              log_id: isUndo ? null : s.log_id,
            }
            : s
        )
      );

      try {
        const res = await markRealtimeAttendance({
          student_id: student.student_id,
          part_id: Number(selectedPartId),
          status: isUndo ? "delete" : targetStatus,
          undo: isUndo,
          att_date: selectedDate,
        });

        if (res.status === "success") {
          if (isUndo) {
            toast.info(
              `Attendance undone for ${student.name || student.student_id} (reset to Pending)`,
              "Attendance Reset"
            );
          } else {
            toast.success(
              `Marked ${student.name || student.student_id} as ${targetStatus.toUpperCase()}`,
              "Recorded"
            );
          }
        } else {
          // Revert only this student
          setStudents((prev) =>
            prev.map((s) =>
              s.student_id === student.student_id
                ? {
                  ...s,
                  status: previousStatus,
                  att_time: previousTime,
                  log_type: previousLogType,
                  log_id: previousLogId,
                }
                : s
            )
          );
          toast.error(res.message || "Failed to update attendance");
        }
      } catch {
        // Revert only this student
        setStudents((prev) =>
          prev.map((s) =>
            s.student_id === student.student_id
              ? {
                ...s,
                status: previousStatus,
                att_time: previousTime,
                log_type: previousLogType,
                log_id: previousLogId,
              }
              : s
          )
        );
        toast.error("Network error marking attendance");
      } finally {
        markingStudentIdRef.current = null;
        setMarkingStudentId(null);
      }
    },
    [selectedPartId, selectedDate, toast]
  );

  // Bulk Actions
  const handleBulkMark = async (status: "present" | "absent") => {
    if (!selectedPartId || students.length === 0) return;

    const targetStudents =
      status === "present"
        ? students.filter((s) => s.status === "pending" || s.status === "absent")
        : students.filter((s) => s.status === "pending");

    if (targetStudents.length === 0) {
      toast.info(
        status === "present"
          ? "All students are already marked present or late."
          : "No pending students remaining."
      );
      return;
    }

    const studentIds = targetStudents.map((s) => s.student_id);

    setBulkLoading(true);
    setStudents((prev) =>
      prev.map((s) =>
        studentIds.includes(s.student_id) ? { ...s, status: status, log_type: "manual" } : s
      )
    );

    try {
      const res = await bulkMarkRealtimeAttendance({
        part_id: Number(selectedPartId),
        student_ids: studentIds,
        status: status,
        att_date: selectedDate,
      });

      if (res.status === "success") {
        toast.success(
          `Marked ${res.count} students as ${status.toUpperCase()}`,
          "Bulk Update Complete"
        );
        await loadAttendance(true);
      } else {
        toast.error("Failed to perform bulk update");
        await loadAttendance(true);
      }
    } catch {
      toast.error("Error executing bulk attendance update");
      await loadAttendance(true);
    } finally {
      setBulkLoading(false);
    }
  };

  // Filtered roster by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        s.phone_number.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const present = students.filter((s) => s.status === "present").length;
    const late = students.filter((s) => s.status === "late").length;
    const absent = students.filter((s) => s.status === "absent").length;
    const pending = students.filter((s) => s.status === "pending").length;
    return { present, late, absent, pending, total: students.length };
  }, [students]);

  // Format date display (e.g. November 11, 2026)
  const formattedDateDisplay = useMemo(() => {
    if (!selectedDate) return "";
    try {
      const [y, m, d] = selectedDate.split("-");
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      return dt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Realtime Attendance Taking
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Select Course, Part, and Date to take or update live attendance with instant feedback.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${fetchingRoster ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => loadAttendance(false)}
            aria-label="Refresh Roster"
          />
          <Link href="/admin/attendance">
            <Button variant="secondary" size="sm">
              <Clock className="w-3.5 h-3.5" />
              <span>Attendance Logs</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Select Course, Part & Date Card */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4 relative z-30">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <BookOpen className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
          <span>Select Course, Part & Date</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {/* Reusable Searchable Course & Part Filter */}
          <div className="lg:col-span-2">
            <CoursePartFilter
              courses={courses}
              selectedCourseId={selectedCourseId}
              selectedPartId={selectedPartId}
              onCourseChange={handleCourseChange}
              onPartChange={(partId) => setSelectedPartId(partId)}
              disabled={initialLoading}
              allowAll={false}
              courseLabel="Course"
              partLabel="Course Part"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
              Attendance Date (Dhaka UTC+6) *
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 font-mono font-medium focus:ring-2 focus:ring-neutral-400/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Roster & Attendance Taking Panel */}
      {!selectedPartId ? (
        <div className="p-12 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs text-center space-y-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">
            No Course Part Selected
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
            Please search and select a Course and its corresponding Course Part above to view the student enrollment roster and take live realtime attendance.
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-5 relative z-10">
          {/* Roster Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-neutral-200/60 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  {partInfo.title || "Selected Course Part"}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                <span>{formattedDateDisplay}</span>
                <span>•</span>
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                  {stats.total} Enrolled Students
                </span>
                {partInfo.courseTitle && (
                  <>
                    <span>•</span>
                    <span>{partInfo.courseTitle}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Bulk Actions & Search */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-full sm:w-56">
                <Input
                  placeholder="Search name, ID, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5" />}
                />
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkMark("present")}
                loading={bulkLoading}
                disabled={fetchingRoster || students.length === 0}
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Present</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkMark("absent")}
                loading={bulkLoading}
                disabled={fetchingRoster || students.length === 0}
              >
                <UserX className="w-3.5 h-3.5 text-rose-500" />
                <span>Mark Pending Absent</span>
              </Button>
            </div>
          </div>

          {/* Attendance Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <div className="text-xs font-medium">Present</div>
              <div className="text-lg font-bold font-mono">{stats.present}</div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-between">
              <div className="text-xs font-medium">Late</div>
              <div className="text-lg font-bold font-mono">{stats.late}</div>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <div className="text-xs font-medium">Absent</div>
              <div className="text-lg font-bold font-mono">{stats.absent}</div>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-500/10 border border-neutral-500/20 text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
              <div className="text-xs font-medium">Pending</div>
              <div className="text-lg font-bold font-mono">{stats.pending}</div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
              <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
                <tr>
                  <th className="pb-3 w-1/2 sm:w-2/5">STUDENT</th>
                  <th className="pb-3 w-1/4 sm:w-1/4">STATUS</th>
                  <th className="pb-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5">
                {fetchingRoster ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-neutral-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
                        <span>Loading enrolled students and live statuses...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-neutral-400">
                      {students.length === 0
                        ? "No enrolled students found for this course part."
                        : "No students match your search criteria."}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <StudentRow
                      key={st.student_id}
                      student={st}
                      isMarking={markingStudentId === st.student_id}
                      onMark={handleMark}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
