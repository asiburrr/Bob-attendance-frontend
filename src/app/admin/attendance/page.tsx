"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Clock,
  Search,
  Download,
  RefreshCw,
  Play,
  UserCheck,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { CoursePartFilter } from "@/components/attendance/CoursePartFilter";
import { useToast } from "@/components/feedback/Toast";
import {
  fetchPaginatedAttendanceLogs,
  triggerAttendanceProcessing,
  fetchCoursesWithParts,
  AttendanceLogItem,
  CourseWithPartsItem,
  API_BASE_URL,
} from "@/lib/deviceApi";

export default function AttendancePage() {
  const toast = useToast();

  // Data & loading state
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [logs, setLogs] = useState<AttendanceLogItem[]>([]);
  const [courses, setCourses] = useState<CourseWithPartsItem[]>([]);

  // Filter state
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedPartId, setSelectedPartId] = useState<number | "">("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Load courses and their parts once for the filter
  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchCoursesWithParts();
        setCourses(data);
      } catch {
        // non-blocking
      }
    }
    loadCourses();
  }, []);

  // Fetch paginated attendance logs
  const loadLogs = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await fetchPaginatedAttendanceLogs({
          course_id: selectedCourseId ? Number(selectedCourseId) : undefined,
          part_id: selectedPartId ? Number(selectedPartId) : undefined,
          status: selectedStatus || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          search: searchQuery || undefined,
          page: currentPage,
          page_size: pageSize,
        });

        if (res?.status === "success") {
          setLogs(res.logs || []);
          setTotalRecords(res.total || 0);
          setTotalPages(res.total_pages || 1);
        } else {
          if (!silent) toast.error("Failed to load attendance logs");
        }
      } catch {
        if (!silent) toast.error("Error communicating with attendance service");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [
      selectedCourseId,
      selectedPartId,
      selectedStatus,
      dateFrom,
      dateTo,
      searchQuery,
      currentPage,
      pageSize,
      toast,
    ]
  );

  useEffect(() => {
    loadLogs();
    const interval = setInterval(() => loadLogs(true), 10000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  // Handle process & sync
  const handleProcessLogs = async () => {
    setProcessing(true);
    try {
      const res = await triggerAttendanceProcessing();
      if (res?.status === "success") {
        toast.success(
          res.result?.message || "Attendance logs processed via schedule rules.",
          "Batch Sync Complete"
        );
        await loadLogs(true);
      } else {
        toast.error("Failed to run attendance processor");
      }
    } catch (err: any) {
      toast.error(err?.message || "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCourseId("");
    setSelectedPartId("");
    setSelectedStatus("");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Export CSV handler with active filters
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedCourseId) params.set("course_id", String(selectedCourseId));
    if (selectedPartId) params.set("part_id", String(selectedPartId));
    if (selectedStatus) params.set("status", selectedStatus);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (searchQuery) params.set("search", searchQuery);

    const exportUrl = `${API_BASE_URL}/api/devices/export-attendance-logs/?${params.toString()}`;
    window.open(exportUrl, "_blank");
    toast.info("Downloading attendance records CSV...", "Export Started");
  };

  const hasActiveFilters = Boolean(
    selectedCourseId ||
      selectedPartId ||
      selectedStatus ||
      dateFrom ||
      dateTo ||
      searchQuery
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Attendance Records &amp; Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Official evaluated attendance records based on course schedules and live taking sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => loadLogs(false)}
            aria-label="Refresh Attendance"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleProcessLogs}
            loading={processing}
            title="Evaluate unprocessed punches against schedules"
          >
            <Play className="w-3.5 h-3.5 text-blue-500 fill-current" />
            <span>Process &amp; Sync</span>
          </Button>

          <Link href="/admin/attendance/realtime">
            <Button variant="primary" size="sm">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Realtime Taking</span>
            </Button>
          </Link>

          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-5 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4 relative z-30">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filter Attendance Records
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Course & Part Filter (Reusable, Searchable) */}
        <CoursePartFilter
          courses={courses}
          selectedCourseId={selectedCourseId}
          selectedPartId={selectedPartId}
          onCourseChange={(cId) => {
            setSelectedCourseId(cId);
            setCurrentPage(1);
          }}
          onPartChange={(pId) => {
            setSelectedPartId(pId);
            setCurrentPage(1);
          }}
          allowAll={true}
          courseLabel="Course"
          partLabel="Course Part"
        />

        {/* Secondary Filters: Status, Date Range & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 relative z-10">
          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 font-medium outline-none focus:ring-1 focus:ring-neutral-400/20"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-400" /> Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 font-mono outline-none focus:ring-1 focus:ring-neutral-400/20"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-neutral-400" /> Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 font-mono outline-none focus:ring-1 focus:ring-neutral-400/20"
            />
          </div>

          {/* Search Box: Student ID, Phone, Name */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Search Student / Phone / Name
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="ID, phone, student name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-neutral-400/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4 relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
            <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
              <tr>
                <th className="pb-3 pr-4">LOG ID</th>
                <th className="pb-3 pr-4">STUDENT</th>
                <th className="pb-3 pr-4">COURSE &amp; PART</th>
                <th className="pb-3 pr-4">DATE &amp; TIME</th>
                <th className="pb-3 pr-4">METHOD</th>
                <th className="pb-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5 font-sans">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
                      <span>Loading attendance records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No attendance records found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-500/5 transition-colors">
                    {/* Log ID */}
                    <td className="py-3.5 pr-4 font-mono text-[11px] text-neutral-400">
                      #{log.id}
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {log.student_name || "Student"}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500 mt-0.5">
                        <span>ID: {log.student_id}</span>
                        {log.phone_number && (
                          <>
                            <span>•</span>
                            <span>{log.phone_number}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Course & Part */}
                    <td className="py-3.5 pr-4">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {log.part_title || `Part #${log.part_id}`}
                      </div>
                      {log.course_title && (
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs">
                          {log.course_title}
                        </div>
                      )}
                    </td>

                    {/* Date & Time */}
                    <td className="py-3.5 pr-4 font-mono text-[11px]">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {log.att_time}
                      </div>
                      <div className="text-neutral-400 text-[10px]">
                        {log.att_date}
                      </div>
                    </td>

                    {/* Method */}
                    <td className="py-3.5 pr-4">
                      {log.type === "device" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                          <Cpu className="w-3 h-3" />
                          {log.device_id || "Terminal"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border border-neutral-500/20">
                          Manual Action
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 text-right">
                      {log.status === "present" && (
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Present
                        </Badge>
                      )}
                      {log.status === "late" && (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1" />
                          Late
                        </Badge>
                      )}
                      {log.status === "absent" && (
                        <Badge variant="danger">
                          <XCircle className="w-3 h-3 mr-1" />
                          Absent
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reusable Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={totalRecords}
          pageSize={pageSize}
          onPageChange={(page) => {
            setCurrentPage(page);
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          disabled={loading}
        />
      </div>
    </div>
  );
}
