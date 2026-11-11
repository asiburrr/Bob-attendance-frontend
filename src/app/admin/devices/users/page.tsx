"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Radio,
  X,
  XCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/feedback/Toast";
import { CoursePartFilter } from "@/components/attendance/CoursePartFilter";
import {
  fetchDeviceLiveData,
  fetchCoursesWithParts,
  fetchPartEnrolledUsers,
  triggerCardEnrollment,
  triggerBulkEnrollment,
  cancelCardEnrollment,
  registerDeviceUser,
  DeviceItem,
  DeviceUserItem,
  CourseWithPartsItem,
  PartEnrolledUserItem,
} from "@/lib/deviceApi";

export default function CardholdersPage() {
  const toast = useToast();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<"enroll" | "directory">("enroll");

  // Terminal telemetry & devices
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [allCardholders, setAllCardholders] = useState<DeviceUserItem[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("BOB-IOT001");

  // Course & Part selection for enrollment
  const [courses, setCourses] = useState<CourseWithPartsItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [selectedPartId, setSelectedPartId] = useState<number | "">("");

  // Enrolled students in selected Part
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<PartEnrolledUserItem[]>([]);
  const [partStats, setPartStats] = useState<{ total: number; assigned: number; unassigned: number }>({
    total: 0,
    assigned: 0,
    unassigned: 0,
  });

  // Bulk selection state (Max 20 per firmware specification)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Active pairing banner state
  const [activePairing, setActivePairing] = useState<{
    device_id: string;
    mode: "single" | "bulk";
    student_ids: string[];
    timestamp: number;
  } | null>(null);

  // Manual Add Modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newCardNumber, setNewCardNumber] = useState("");

  // Directory search
  const [directorySearch, setDirectorySearch] = useState("");

  // 1. Initial Load: Devices & Courses
  const loadInitialData = useCallback(async () => {
    try {
      setLoadingDevices(true);
      const [devData, courseData] = await Promise.all([
        fetchDeviceLiveData().catch(() => null),
        fetchCoursesWithParts().catch(() => []),
      ]);

      if (devData?.devices && devData.devices.length > 0) {
        setDevices(devData.devices);
        if (!selectedDevice || !devData.devices.some((d: DeviceItem) => d.device_id === selectedDevice)) {
          // Default to first online device, or first device
          const online = devData.devices.find((d: DeviceItem) => d.is_online === 1);
          setSelectedDevice(online ? online.device_id : devData.devices[0].device_id);
        }
      }
      if (devData?.users) {
        setAllCardholders(devData.users);
      }
      if (Array.isArray(courseData)) {
        setCourses(courseData);
      }
    } catch {
      toast.error("Failed to load device system data");
    } finally {
      setLoadingDevices(false);
    }
  }, [selectedDevice, toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Load enrolled students whenever Part selection changes
  const loadPartStudents = useCallback(async (partId: number, silent = false) => {
    try {
      if (!silent) setLoadingStudents(true);
      const res = await fetchPartEnrolledUsers(partId, selectedDevice);
      if (res?.users) {
        setEnrolledStudents(res.users);
        setPartStats({
          total: res.total_count,
          assigned: res.assigned_count,
          unassigned: res.unassigned_count,
        });
      } else {
        setEnrolledStudents([]);
        setPartStats({ total: 0, assigned: 0, unassigned: 0 });
      }
      // Reset selection when changing part
      setSelectedStudentIds([]);
    } catch {
      if (!silent) toast.error("Failed to load enrolled students for this part");
    } finally {
      if (!silent) setLoadingStudents(false);
    }
  }, [selectedDevice, toast]);

  useEffect(() => {
    if (selectedPartId && typeof selectedPartId === "number") {
      loadPartStudents(selectedPartId);
    } else {
      setEnrolledStudents([]);
      setPartStats({ total: 0, assigned: 0, unassigned: 0 });
      setSelectedStudentIds([]);
    }
  }, [selectedPartId, loadPartStudents]);

  // Handle Course selection change
  const handleCourseChange = (courseId: number | "") => {
    setSelectedCourseId(courseId);
    setSelectedPartId("");
  };

  // Handle Part selection change
  const handlePartChange = (partId: number | "") => {
    setSelectedPartId(partId);
  };

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return enrolledStudents;
    const q = studentSearch.toLowerCase().trim();
    return enrolledStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q)) ||
        (s.card_number && s.card_number.toLowerCase().includes(q))
    );
  }, [enrolledStudents, studentSearch]);

  // Toggle selection for a single student (Max 20)
  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds((prev) => prev.filter((id) => id !== studentId));
    } else {
      if (selectedStudentIds.length >= 20) {
        toast.error("Maximum 20 students can be selected for bulk enrollment at one time", "Limit Reached");
        return;
      }
      setSelectedStudentIds((prev) => [...prev, studentId]);
    }
  };

  // Select all unassigned students up to 20
  const handleSelectAllUnassigned = () => {
    const unassigned = enrolledStudents
      .filter((s) => !s.is_card_assigned)
      .map((s) => s.student_id);

    if (unassigned.length === 0) {
      toast.info("All students in this part already have RFID cards assigned.");
      return;
    }

    const nextBatch = unassigned.slice(0, 20);
    setSelectedStudentIds(nextBatch);
    if (unassigned.length > 20) {
      toast.info(`Selected the first 20 unassigned students (out of ${unassigned.length}).`);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Trigger Bulk Enrollment (BULK_ENROLL:id1,id2,...)
  const handleBulkEnroll = async () => {
    if (!selectedDevice) {
      toast.error("Please select a target terminal first");
      return;
    }
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least 1 student to enroll");
      return;
    }
    if (selectedStudentIds.length > 20) {
      toast.error("Maximum 20 students can be enrolled in one bulk session");
      return;
    }

    setActionLoading(true);
    try {
      const res = await triggerBulkEnrollment(selectedDevice, selectedStudentIds);
      if (res?.status === "success") {
        toast.success(
          `Terminal ${selectedDevice} is now in BULK PAIRING mode for ${selectedStudentIds.length} students! Tap cards sequentially on the RFID scanner.`,
          "Bulk Enrollment Active"
        );
        setActivePairing({
          device_id: selectedDevice,
          mode: "bulk",
          student_ids: [...selectedStudentIds],
          timestamp: Date.now(),
        });
      } else {
        toast.error(res?.message || "Failed to trigger bulk enrollment");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error starting bulk enrollment");
    } finally {
      setActionLoading(false);
    }
  };

  // Trigger Single Enrollment (ENROLL:student_id)
  const handleSingleEnroll = async (studentId: string, studentName: string) => {
    if (!selectedDevice) {
      toast.error("Please select a target terminal first");
      return;
    }

    setActionLoading(true);
    try {
      const res = await triggerCardEnrollment(selectedDevice, studentId);
      if (res?.status === "success") {
        toast.success(
          `Terminal ${selectedDevice} set to ENROLL mode for ${studentName} (#${studentId}). Tap card on scanner now!`,
          "Pairing Mode Active"
        );
        setActivePairing({
          device_id: selectedDevice,
          mode: "single",
          student_ids: [studentId],
          timestamp: Date.now(),
        });
      } else {
        toast.error(res?.message || "Failed to start pairing mode");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error initiating single enrollment");
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Pairing Mode
  const handleCancelPairing = async () => {
    if (!selectedDevice) return;
    setActionLoading(true);
    try {
      await cancelCardEnrollment(selectedDevice);
      toast.info(`Pairing mode cancelled on terminal ${selectedDevice}.`);
      setActivePairing(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel pairing mode");
    } finally {
      setActionLoading(false);
    }
  };

  // Manual Add Cardholder form submit
  const handleAddManualUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !newUserId || !newUserName || !newCardNumber) {
      toast.error("Please fill in all cardholder fields");
      return;
    }
    setActionLoading(true);
    try {
      await registerDeviceUser(selectedDevice, newUserId, newCardNumber, newUserName);
      toast.success(`Student #${newUserId} (${newUserName}) bound to card ${newCardNumber}.`, "Cardholder Created");
      setAddModalOpen(false);
      setNewUserId("");
      setNewUserName("");
      setNewCardNumber("");
      loadInitialData();
      if (selectedPartId && typeof selectedPartId === "number") {
        loadPartStudents(selectedPartId, true);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to add cardholder");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter Directory cardholders
  const filteredDirectoryUsers = useMemo(() => {
    if (!directorySearch.trim()) return allCardholders;
    const q = directorySearch.toLowerCase().trim();
    return allCardholders.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.student_id && u.student_id.toLowerCase().includes(q)) ||
        (u.user_id && u.user_id.toLowerCase().includes(q)) ||
        (u.card_number && u.card_number.toLowerCase().includes(q)) ||
        (u.device_id && u.device_id.toLowerCase().includes(q))
    );
  }, [allCardholders, directorySearch]);

  const activeDeviceObj = useMemo(() => {
    return devices.find((d) => d.device_id === selectedDevice);
  }, [devices, selectedDevice]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-indigo-500" />
            <span>Device RFID Card Enrollment</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select course and part to assign 125kHz RFID cards individually or bulk enroll up to 20 students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingDevices || loadingStudents ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => {
              loadInitialData();
              if (selectedPartId && typeof selectedPartId === "number") {
                loadPartStudents(selectedPartId);
              }
            }}
            aria-label="Refresh data"
          />

          {/* Tab buttons */}
          <div className="flex items-center bg-neutral-200/60 dark:bg-neutral-800/60 p-1 rounded-2xl border border-neutral-300/40 dark:border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("enroll")}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === "enroll"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Enroll by Course & Part
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("directory")}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                activeTab === "directory"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              All Cardholders ({allCardholders.length})
            </button>
          </div>

          {/* Add cardholder manually */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Add</span>
          </Button>
        </div>
      </div>

      {/* Active Pairing Live Banner */}
      {activePairing && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 dark:border-amber-500/20 backdrop-blur-md shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-white">
                  RFID Terminal Pairing Active: {activePairing.device_id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white">
                  {activePairing.mode === "bulk" ? `BULK (${activePairing.student_ids.length})` : "SINGLE"}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                {activePairing.mode === "bulk"
                  ? `Please tap ${activePairing.student_ids.length} student cards sequentially on terminal scanner (${activePairing.student_ids.join(", ")}).`
                  : `Please tap RFID card for Student #${activePairing.student_ids[0]} on the terminal scanner.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelPairing}
              disabled={actionLoading}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Pairing</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === "enroll" ? (
        <div className="space-y-6">
          {/* Top Filter Card: Select Terminal and Course & Part */}
          <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs relative z-30 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Terminal Selector (col 1-4) */}
              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Target RFID Terminal
                </label>
                <div className="relative">
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/70 dark:bg-neutral-900/70 text-neutral-900 dark:text-neutral-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {devices.map((d) => (
                      <option key={d.device_id} value={d.device_id}>
                        {d.device_name || d.device_id} ({d.device_id}) {d.is_online ? "• Online" : "• Offline"}
                      </option>
                    ))}
                  </select>
                </div>
                {activeDeviceObj && (
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-neutral-500">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeDeviceObj.is_online ? "bg-emerald-500 animate-pulse" : "bg-red-400"
                      }`}
                    />
                    <span>{activeDeviceObj.is_online ? "Online & listening" : "Terminal offline"}</span>
                    <span>•</span>
                    <span className="font-mono">{activeDeviceObj.ip_address || "No IP"}</span>
                  </div>
                )}
              </div>

              {/* Course & Part Filter (col 5-12) */}
              <div className="lg:col-span-8">
                <CoursePartFilter
                  courses={courses}
                  selectedCourseId={selectedCourseId}
                  selectedPartId={selectedPartId}
                  onCourseChange={handleCourseChange}
                  onPartChange={handlePartChange}
                  allowAll={false}
                  courseLabel="Select Course"
                  partLabel="Select Part to Enroll"
                />
              </div>
            </div>
          </div>

          {/* Enrolled Students Roster Card */}
          <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs relative z-10 space-y-5">
            {!selectedPartId ? (
              /* Empty state when no part selected */
              <div className="py-16 px-4 text-center space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto shadow-sm">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Select a Course & Part
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                  Choose a course and course part in the filter above to display enrolled students and assign 125kHz RFID cards.
                </p>
              </div>
            ) : loadingStudents ? (
              /* Loading skeleton */
              <div className="py-16 px-4 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Loading enrolled students for this part...
                </p>
              </div>
            ) : (
              /* Enrolled Students Table */
              <>
                {/* Roster Header & Stats */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-3 border-b border-neutral-200/60 dark:border-white/10">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                      <span>Enrolled Students</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        {partStats.total} Total
                      </span>
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{partStats.assigned} Card Assigned</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{partStats.unassigned} No Card</span>
                      </span>
                    </div>
                  </div>

                  {/* Search and Bulk Action Toolbar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full sm:w-56">
                      <Input
                        placeholder="Search student or ID..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        leftIcon={<Search className="w-3.5 h-3.5" />}
                      />
                    </div>

                    {/* Select All Unassigned Button */}
                    {partStats.unassigned > 0 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectAllUnassigned}
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Select Unassigned (Max 20)</span>
                      </Button>
                    )}

                    {selectedStudentIds.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelection}
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </Button>
                    )}

                    {/* Bulk Enroll Trigger Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBulkEnroll}
                      disabled={actionLoading || selectedStudentIds.length === 0}
                      className="shadow-md"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        Bulk Enroll ({selectedStudentIds.length}
                        <span className="opacity-70 font-normal">/20</span>)
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                    <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
                      <tr>
                        <th className="pb-3 w-10 text-center">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="pb-3">Student</th>
                        <th className="pb-3">Student ID</th>
                        <th className="pb-3">Phone</th>
                        <th className="pb-3">125kHz RFID Card</th>
                        <th className="pb-3 text-right">Pairing Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-neutral-400">
                            No enrolled students found matching your criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((s) => {
                          const isSelected = selectedStudentIds.includes(s.student_id);
                          const initials = s.name
                            ? s.name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : "ST";

                          return (
                            <tr
                              key={s.student_id}
                              className={`transition-colors hover:bg-neutral-500/5 ${
                                isSelected ? "bg-indigo-500/5 dark:bg-indigo-500/10" : ""
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleStudentSelection(s.student_id)}
                                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                  aria-label={`Select student ${s.name}`}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-neutral-300 dark:text-neutral-600" />
                                  )}
                                </button>
                              </td>

                              {/* Student Name & Avatar */}
                              <td className="py-3.5 pr-4">
                                <div className="flex items-center gap-3">
                                  {s.avatar_url ? (
                                    <img
                                      src={s.avatar_url}
                                      alt={s.name}
                                      className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-white/10 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-neutral-700 dark:to-neutral-800 text-indigo-700 dark:text-neutral-200 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-200/40 dark:border-white/10 shadow-xs">
                                      {initials}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <div className="font-semibold text-neutral-900 dark:text-white truncate">
                                      {s.name || "Unnamed Student"}
                                    </div>
                                    <div className="text-[11px] text-neutral-400">
                                      User #{s.user_id}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Student ID */}
                              <td className="py-3.5 font-mono font-semibold text-neutral-900 dark:text-white">
                                #{s.student_id}
                              </td>

                              {/* Phone */}
                              <td className="py-3.5 font-mono text-neutral-500">
                                {s.phone || "—"}
                              </td>

                              {/* Card Status */}
                              <td className="py-3.5">
                                {s.is_card_assigned ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                      <span>Card Assigned</span>
                                    </span>
                                    <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 text-[11px] bg-neutral-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-neutral-200/50 dark:border-white/10">
                                      {s.card_number}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                    <AlertCircle className="w-3 h-3 text-amber-500" />
                                    <span>No Card Assigned</span>
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-3.5 text-right">
                                {s.is_card_assigned ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSingleEnroll(s.student_id, s.name)}
                                    disabled={actionLoading}
                                  >
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    <span>Re-pair</span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleSingleEnroll(s.student_id, s.name)}
                                    disabled={actionLoading}
                                  >
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    <span>Enroll to Device</span>
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Tab 2: Master Directory of All Registered Cardholders */
        <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Showing {filteredDirectoryUsers.length} of {allCardholders.length} registered 125kHz RFID cardholders
            </div>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by name, ID, or card UID..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5" />}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
              <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
                <tr>
                  <th className="pb-3">Student ID</th>
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">125kHz Card UID</th>
                  <th className="pb-3">Assigned Terminal</th>
                  <th className="pb-3">Enrolled At</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5">
                {filteredDirectoryUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      No cardholders match your query.
                    </td>
                  </tr>
                ) : (
                  filteredDirectoryUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-neutral-500/5 transition-colors">
                      <td className="py-3 font-mono font-semibold text-neutral-900 dark:text-white">
                        #{u.student_id || u.user_id}
                      </td>
                      <td className="py-3 font-medium text-neutral-900 dark:text-white">
                        {u.name}
                      </td>
                      <td className="py-3 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {u.card_number}
                      </td>
                      <td className="py-3 font-mono text-neutral-500">
                        {u.device_id || "All Terminals"}
                      </td>
                      <td className="py-3 font-mono text-neutral-500">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "Active"}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            handleSingleEnroll(u.student_id || u.user_id || "", u.name);
                          }}
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Re-pair</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Add Cardholder Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add Cardholder Manually"
        description="Directly bind an RFID card UID to a student without live terminal scanning."
      >
        <form onSubmit={handleAddManualUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Terminal
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 text-neutral-900 dark:text-neutral-100"
            >
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_name || d.device_id} ({d.device_id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Student ID
            </label>
            <Input
              placeholder="e.g. 1871"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Full Name
            </label>
            <Input
              placeholder="e.g. Tamim Ahmed"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              125kHz Card UID
            </label>
            <Input
              placeholder="e.g. 0004928123"
              value={newCardNumber}
              onChange={(e) => setNewCardNumber(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={actionLoading}>
              Save Cardholder
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
