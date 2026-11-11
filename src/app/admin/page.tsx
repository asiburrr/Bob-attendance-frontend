"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Cpu,
  Clock,
  Users,
  Terminal,
  RefreshCw,
  ArrowUpRight,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/feedback/Toast";
import {
  fetchDeviceLiveData,
  DeviceItem,
  AttendanceItem,
} from "@/lib/deviceApi";

export default function AdminDashboardPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_terminals: 0,
    online_terminals: 0,
    swipes_today: 0,
    registered_users: 0,
  });
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceItem[]>([]);

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchDeviceLiveData();
      if (data?.stats) setStats(data.stats);
      if (data?.devices) setDevices(data.devices);
      if (data?.attendance) setRecentAttendance(data.attendance.slice(0, 6));
    } catch {
      if (!silent) toast.error("Could not fetch live telemetry");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Live telemetry for RFID attendance terminals and access control network.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            aria-label="Refresh Dashboard"
          />
          <Link href="/admin/devices">
            <Button variant="secondary" size="sm" className="shadow-xs">
              <Cpu className="w-3.5 h-3.5" />
              <span>Terminals</span>
            </Button>
          </Link>
          <Link href="/admin/devices/users">
            <Button variant="primary" size="sm" className="shadow-xs">
              <Zap className="w-3.5 h-3.5" />
              <span>Pair Card</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          label="Active Terminals"
          value={`${stats.online_terminals} / ${stats.total_terminals}`}
          icon={Cpu}
          variant="emerald"
          badge={
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              100% Online
            </span>
          }
        />
        <StatCard
          label="Today's Punches"
          value={stats.swipes_today}
          icon={Clock}
          variant="indigo"
          description="Real-time attendance stream"
        />
        <StatCard
          label="Enrolled Cardholders"
          value={stats.registered_users}
          icon={Users}
          variant="violet"
          description="Active 125kHz RFID cards"
        />
      </div>

      {/* Two Clean Module Panels (Exact edu\exam style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Module 1: Device Management */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {devices.length} Terminal Connected
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Device Hub &amp; Hardware Fleet
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Hardware telemetry, 24-hour connectivity logs, NTP time sync, and remote reboot.
              </p>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-neutral-200/60 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2">
            <Link href="/admin/devices" className="w-full sm:w-1/2">
              <Button variant="secondary" size="sm" className="w-full justify-between">
                <span>Manage Terminals</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/admin/devices/commands" className="w-full sm:w-1/2">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>Dispatch Commands</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Module 2: Attendance & Access */}
        <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between hover:border-neutral-300 dark:hover:border-white/20 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center text-violet-600 dark:text-violet-400">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                Access Engine
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Attendance &amp; Cardholders
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                RFID cardholder EEPROM roster, live swipe streams, and CSV export records.
              </p>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-neutral-200/60 dark:border-white/10 flex flex-col sm:flex-row items-center gap-2">
            <Link href="/admin/attendance" className="w-full sm:w-1/2">
              <Button variant="secondary" size="sm" className="w-full justify-between">
                <span>Attendance Logs</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Link href="/admin/devices/users" className="w-full sm:w-1/2">
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span>View Cardholders</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Swipes Table */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
              Recent Attendance Swipes
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Live stream from hardware terminals
            </p>
          </div>
          <Link href="/admin/attendance">
            <Button variant="ghost" size="sm">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
            <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
              <tr>
                <th className="pb-3">Cardholder</th>
                <th className="pb-3">User ID</th>
                <th className="pb-3">Card UID</th>
                <th className="pb-3">Terminal</th>
                <th className="pb-3">Swipe Time</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5">
              {recentAttendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-400">
                    No recent attendance swipes today.
                  </td>
                </tr>
              ) : (
                recentAttendance.map((punch) => (
                  <tr key={punch.id} className="hover:bg-neutral-500/5 transition-colors">
                    <td className="py-3 font-semibold text-neutral-900 dark:text-white">
                      {punch.user_name || "Guest / Unassigned"}
                    </td>
                    <td className="py-3 font-mono text-neutral-500">
                      #{punch.user_id || "—"}
                    </td>
                    <td className="py-3 font-mono text-blue-600 dark:text-blue-400 font-medium">
                      {punch.card_uid}
                    </td>
                    <td className="py-3 font-mono text-neutral-500">
                      {punch.device_id}
                    </td>
                    <td className="py-3 font-mono text-neutral-500">
                      {punch.swipe_time ? new Date(punch.swipe_time).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-3 text-right">
                      {punch.is_offline ? (
                        <Badge variant="warning">Offline Buffer</Badge>
                      ) : (
                        <Badge variant="success">Sync</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
