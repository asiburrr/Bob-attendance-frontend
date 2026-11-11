"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Cpu,
  Search,
  Download,
  RefreshCw,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/feedback/Toast";
import {
  fetchPaginatedRawPunches,
  fetchDeviceLiveData,
  RawPunchItem,
  DeviceItem,
  API_BASE_URL,
} from "@/lib/deviceApi";

export default function DeviceLogsPage() {
  const toast = useToast();

  // Data & loading state
  const [loading, setLoading] = useState(true);
  const [punches, setPunches] = useState<RawPunchItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);

  // Filter state
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Load available devices list once
  useEffect(() => {
    async function loadDevices() {
      try {
        const live = await fetchDeviceLiveData();
        if (live?.devices) {
          setDevices(live.devices);
        }
      } catch {
        // non-blocking
      }
    }
    loadDevices();
  }, []);

  // Fetch paginated punches
  const loadPunches = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const res = await fetchPaginatedRawPunches({
          device_id: selectedDevice || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          search: searchQuery || undefined,
          page: currentPage,
          page_size: pageSize,
        });

        if (res?.status === "success") {
          setPunches(res.punches || []);
          setTotalRecords(res.total || 0);
          setTotalPages(res.total_pages || 1);
        } else {
          if (!silent) toast.error("Failed to load device punch records");
        }
      } catch {
        if (!silent) toast.error("Error communicating with device service");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [selectedDevice, dateFrom, dateTo, searchQuery, currentPage, pageSize, toast]
  );

  // Reset page to 1 when filters change
  const handleFilterApply = () => {
    setCurrentPage(1);
    loadPunches(false);
  };

  const handleResetFilters = () => {
    setSelectedDevice("");
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  useEffect(() => {
    loadPunches();
    const interval = setInterval(() => loadPunches(true), 10000);
    return () => clearInterval(interval);
  }, [loadPunches]);

  // Export CSV handler
  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (selectedDevice) params.set("device_id", selectedDevice);
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    if (searchQuery) params.set("search", searchQuery);

    const exportUrl = `${API_BASE_URL}/api/devices/export-csv/?${params.toString()}`;
    window.open(exportUrl, "_blank");
    toast.info("Downloading raw terminal punch telemetry CSV...", "Export Started");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Device Swipe Logs
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Raw RFID tap logs ingested directly from physical terminals with status and evaluation telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => loadPunches(false)}
            aria-label="Refresh Swipes"
          />

          <Button variant="secondary" size="sm" onClick={handleExportCsv}>
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4 relative z-20">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Filter Telemetry Records
          </span>
          {(selectedDevice || dateFrom || dateTo || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-white underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Terminal / Device ID Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Terminal
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => {
                setSelectedDevice(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 font-medium outline-none focus:ring-1 focus:ring-neutral-400/20"
            >
              <option value="">All Terminals</option>
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_name ? `${d.device_name} (${d.device_id})` : d.device_id}
                </option>
              ))}
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

          {/* Search UID / Student ID / Name */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Search Card / Student / Name
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Card UID, Student ID, Name..."
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

      {/* Raw Punches Table */}
      <div className="p-4 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4 relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
            <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
              <tr>
                <th className="pb-3 pr-4">PUNCH ID</th>
                <th className="pb-3 pr-4">TERMINAL</th>
                <th className="pb-3 pr-4">STUDENT / CARDHOLDER</th>
                <th className="pb-3 pr-4 font-mono">CARD UID</th>
                <th className="pb-3 pr-4">SWIPE TIME</th>
                <th className="pb-3 pr-4 text-center">MODE</th>
                <th className="pb-3 text-right">PROCESSING STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5 font-mono">
              {loading && punches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-sans">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-neutral-500" />
                      <span>Loading raw swipes...</span>
                    </div>
                  </td>
                </tr>
              ) : punches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 font-sans">
                    No swipe records found matching the active criteria.
                  </td>
                </tr>
              ) : (
                punches.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-500/5 transition-colors">
                    <td className="py-3 pr-4 text-neutral-400 text-[11px]">
                      #{p.id}
                    </td>

                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-neutral-500/10 text-neutral-800 dark:text-neutral-200">
                        <Cpu className="w-3 h-3 text-neutral-400" />
                        {p.device_id}
                      </span>
                    </td>

                    <td className="py-3 pr-4 font-sans">
                      <div className="font-semibold text-neutral-900 dark:text-white">
                        {p.user_name || "Unregistered"}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-500">
                        {p.student_id ? `ID: ${p.student_id}` : "No Student ID"}
                      </div>
                    </td>

                    <td className="py-3 pr-4 font-mono text-xs text-neutral-800 dark:text-neutral-200">
                      {p.card_uid}
                    </td>

                    <td className="py-3 pr-4 text-[11px]">
                      {p.swipe_time ? (
                        <div>
                          <div className="text-neutral-900 dark:text-neutral-100">
                            {new Date(p.swipe_time).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </div>
                          <div className="text-neutral-400 text-[10px]">
                            {new Date(p.swipe_time).toISOString().split("T")[0]}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="py-3 pr-4 text-center">
                      {p.is_offline ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Offline Sync
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          Live Online
                        </span>
                      )}
                    </td>

                    <td className="py-3 text-right">
                      {p.is_spam ? (
                        <Badge variant="danger">
                          Spam Blocked
                        </Badge>
                      ) : p.is_used ? (
                        <Badge variant="success">
                          Processed in Log
                        </Badge>
                      ) : (
                        <Badge variant="neutral">
                          Queued / Pending
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
