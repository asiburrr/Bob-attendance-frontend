"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/feedback/Toast";
import {
  fetchAttendanceSchedules,
  createAttendanceSchedule,
  updateAttendanceSchedule,
  deleteAttendanceSchedule,
  fetchCourseParts,
  AttendanceScheduleItem,
  CoursePartItem,
} from "@/lib/deviceApi";

const WEEKDAYS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export default function AttendanceSchedulesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [schedules, setSchedules] = useState<AttendanceScheduleItem[]>([]);
  const [courseParts, setCourseParts] = useState<CoursePartItem[]>([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<number | "">("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [lateTime, setLateTime] = useState("09:15");
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Saturday",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
  ]);
  const [isActive, setIsActive] = useState(true);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [scheds, parts] = await Promise.all([
        fetchAttendanceSchedules(),
        fetchCourseParts(),
      ]);
      setSchedules(scheds);
      setCourseParts(parts);
    } catch {
      if (!silent) toast.error("Failed to load schedules");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingScheduleId(null);
    const availablePart = courseParts.find((p) => !p.has_schedule);
    setSelectedPartId(availablePart ? availablePart.id : "");
    setStartTime("09:00");
    setEndTime("11:00");
    setLateTime("09:15");
    setSelectedDays(["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"]);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (s: AttendanceScheduleItem) => {
    setEditingScheduleId(s.id);
    setSelectedPartId(s.part_id);
    setStartTime(s.start_time.slice(0, 5));
    setEndTime(s.end_time.slice(0, 5));
    setLateTime(s.late_time.slice(0, 5));
    setSelectedDays(s.available_days || []);
    setIsActive(s.is_active);
    setModalOpen(true);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartId) {
      toast.error("Please select a Course Part");
      return;
    }
    if (selectedDays.length === 0) {
      toast.error("Please select at least one available day");
      return;
    }

    const formatTimePayload = (t: string) => {
      if (!t) return "00:00:00";
      const parts = t.split(":");
      if (parts.length === 2) return `${t}:00`;
      return t;
    };

    setActionLoading(true);
    try {
      if (editingScheduleId !== null) {
        // Edit Mode
        const res = await updateAttendanceSchedule(editingScheduleId, {
          start_time: formatTimePayload(startTime),
          end_time: formatTimePayload(endTime),
          late_time: formatTimePayload(lateTime),
          available_days: selectedDays,
          is_active: isActive,
        });

        if (res.status === "success") {
          toast.success("Schedule updated successfully", "Updated");
          setModalOpen(false);
          await loadData(true);
        } else {
          toast.error(res.message || "Failed to update schedule");
        }
      } else {
        // Create Mode - enforce 1 schedule per part
        const alreadyScheduled = courseParts.find((p) => p.id === Number(selectedPartId))?.has_schedule;
        if (alreadyScheduled) {
          toast.error("A schedule already exists for this course part. Only 1 schedule is permitted per part.");
          setActionLoading(false);
          return;
        }

        const res = await createAttendanceSchedule({
          part_id: Number(selectedPartId),
          start_time: formatTimePayload(startTime),
          end_time: formatTimePayload(endTime),
          late_time: formatTimePayload(lateTime),
          available_days: selectedDays,
          is_active: isActive,
        });

        if (res.status === "success") {
          toast.success("Attendance schedule created successfully", "Schedule Active");
          setModalOpen(false);
          await loadData(true);
        } else {
          toast.error(res.message || "Failed to create schedule");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save schedule");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to remove this attendance schedule?")) return;
    try {
      await deleteAttendanceSchedule(id);
      toast.success("Schedule removed", "Deleted");
      await loadData(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete schedule");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Attendance Schedules (Course Batches)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Define session windows, late cutoffs, and active class days in Dhaka time (UTC+6). Strictly 1 schedule per course part.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => loadData(false)}
            aria-label="Refresh schedules"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Schedule</span>
          </Button>
        </div>
      </div>

      {/* Schedules List Panel */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          <div className="flex items-center gap-2">
            <span>Configured Course Schedules ({schedules.length})</span>
            <span className="font-mono text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-medium">
              1 Schedule per Part
            </span>
          </div>
          <span className="font-mono text-[11px] bg-neutral-500/10 px-2 py-0.5 rounded-md">
            Timezone: Asia/Dhaka (UTC+6)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
            <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
              <tr>
                <th className="pb-3">Course Part</th>
                <th className="pb-3">Class Window</th>
                <th className="pb-3">Late Cutoff</th>
                <th className="pb-3">Scheduled Days</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    No attendance schedules configured yet. Click "Create Schedule" above.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-500/5 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {s.part_title || `Course Part #${s.part_id}`}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        part_id: {s.part_id}
                      </div>
                    </td>
                    <td className="py-3 font-mono text-neutral-800 dark:text-neutral-200 font-semibold">
                      {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                    </td>
                    <td className="py-3 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                      &gt; {s.late_time.slice(0, 5)} (Late)
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {s.available_days?.map((d, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-neutral-500/10 dark:bg-white/5 text-[10px] font-medium"
                          >
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">
                      {s.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="neutral">Disabled</Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                          title="Edit Schedule"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal (Create & Edit) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingScheduleId !== null ? "Edit Attendance Schedule" : "Create Attendance Schedule"}
        description={
          editingScheduleId !== null
            ? "Update class session timetable, late threshold, or active days."
            : "Each course part can have strictly one schedule for automated RFID presence."
        }
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4">
          {/* Part Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Select Course Part (course_part) *
            </label>
            {courseParts.length > 0 ? (
              <select
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(Number(e.target.value))}
                disabled={editingScheduleId !== null}
                className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 text-neutral-900 dark:text-neutral-100 ${
                  editingScheduleId !== null ? "opacity-60 cursor-not-allowed" : ""
                }`}
                required
              >
                {editingScheduleId === null && (
                  <option value="" disabled>
                    -- Select an available Course Part --
                  </option>
                )}
                {courseParts.map((p) => {
                  const isScheduled = Boolean(p.has_schedule && editingScheduleId === null);
                  return (
                    <option key={p.id} value={p.id} disabled={isScheduled}>
                      {p.title} ({p.course_title}) [Part #{p.id}]
                      {isScheduled ? " — (Already Scheduled)" : ""}
                    </option>
                  );
                })}
              </select>
            ) : (
              <Input
                label="Course Part ID"
                type="number"
                placeholder="Enter Part ID (e.g. 1)"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(Number(e.target.value))}
                disabled={editingScheduleId !== null}
                required
              />
            )}
            {editingScheduleId !== null ? (
              <p className="text-[11px] text-neutral-400 mt-1">
                Course part is locked for this schedule. To assign a schedule to a different part, create a new one.
              </p>
            ) : (
              <p className="text-[11px] text-neutral-400 mt-1">
                Parts marked <em>(Already Scheduled)</em> cannot be re-selected. Only 1 schedule per part is allowed.
              </p>
            )}
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Late Cutoff *
              </label>
              <input
                type="time"
                value={lateTime}
                onChange={(e) => setLateTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 font-mono"
                required
              />
            </div>
          </div>

          {/* Available Days */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Available Days *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs rounded-xl font-medium transition-all ${
                      isSelected
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                        : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/15"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active_toggle"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded-md accent-blue-600"
            />
            <label
              htmlFor="is_active_toggle"
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer"
            >
              Active Schedule (Immediately evaluate punches during session window)
            </label>
          </div>

          {/* Dhaka Time Zone Notice */}
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
            <strong>Timezone:</strong> Evaluated in Asia/Dhaka (UTC+6). Any card tap after {lateTime} will automatically be logged as <strong>Late</strong>.
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={actionLoading}
            >
              {editingScheduleId !== null ? "Update Schedule" : "Save Schedule"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
