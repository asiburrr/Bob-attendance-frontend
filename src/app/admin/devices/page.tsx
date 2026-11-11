"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Cpu,
  RefreshCw,
  Zap,
  Activity,
  HardDrive,
  Wifi,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/feedback/Toast";
import {
  fetchDeviceLiveData,
  sendDeviceCommand,
  DeviceItem,
} from "@/lib/deviceApi";

export default function DevicesPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceItem[]>([]);

  const loadDevices = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchDeviceLiveData();
      if (data?.devices) setDevices(data.devices);
    } catch {
      if (!silent) toast.error("Failed to load device list");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDevices();
    const interval = setInterval(() => loadDevices(true), 10000);
    return () => clearInterval(interval);
  }, [loadDevices]);

  const handleSendCommand = async (deviceId: string, cmd: string) => {
    setActionLoading(true);
    try {
      await sendDeviceCommand(deviceId, cmd);
      toast.success(`Dispatched ${cmd} to ${deviceId}`, "Command Queued");
      await loadDevices(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to dispatch command");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Terminals &amp; Hardware Fleet
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Real-time telemetry, 24h connectivity health, and remote instruction dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => loadDevices(false)}
            aria-label="Refresh terminals"
          />
        </div>
      </div>

      {/* Terminals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {devices.map((device) => {
          const isOnline = Boolean(device.is_online);
          const uptime = device.connectivity?.uptime_pct ?? 100;

          return (
            <div
              key={device.id}
              className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-5 hover:border-neutral-300 dark:hover:border-white/20 transition-all"
            >
              {/* Terminal Title & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                      {device.device_name || device.device_id}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-neutral-500/10 dark:bg-white/5 border border-neutral-200/50 dark:border-white/5 text-neutral-600 dark:text-neutral-300">
                      {device.device_id}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-3">
                    <span>IP: {device.ip_address || "192.168.1.100"}</span>
                    <span>•</span>
                    <span>MAC: {device.mac_address || "48:E7:29:4D:B2:1A"}</span>
                  </div>
                </div>

                <Badge variant={isOnline ? "success" : "danger"}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </Badge>
              </div>

              {/* Hardware Telemetry Counters */}
              <div className="grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-neutral-500/5 dark:bg-white/5 border border-neutral-200/50 dark:border-white/5 text-xs">
                <div>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block">
                    CPU Load
                  </span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {device.cpu_usage}%
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block">
                    Free Heap
                  </span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {device.free_ram} KB
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500 block">
                    Buffer Queue
                  </span>
                  <span className="font-mono font-semibold text-neutral-900 dark:text-white">
                    {device.queue_count} records
                  </span>
                </div>
              </div>

              {/* 24-Hour Timeline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                  <span>24-Hour Timeline</span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {uptime}% Uptime
                  </span>
                </div>
                <div className="grid grid-cols-24 gap-1 h-5 p-1 rounded-xl bg-neutral-500/10 dark:bg-white/5 border border-neutral-200/40 dark:border-white/5">
                  {device.connectivity?.timeline?.map((bucket, idx) => {
                    const bg =
                      bucket.status === "online"
                        ? "bg-emerald-500"
                        : bucket.status === "degraded"
                        ? "bg-amber-500"
                        : bucket.status === "offline"
                        ? "bg-rose-500"
                        : "bg-neutral-400 dark:bg-neutral-600";
                    return (
                      <div
                        key={idx}
                        title={`${bucket.label}: ${bucket.uptime_pct}% uptime, ${bucket.drops} drops`}
                        className={`h-full rounded-xs transition-opacity hover:opacity-75 ${bg}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Remote Actions */}
              <div className="pt-3 border-t border-neutral-200/60 dark:border-white/10 flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSendCommand(device.device_id, "PING")}
                  disabled={actionLoading}
                >
                  Ping
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSendCommand(device.device_id, "FORCE_NTP")}
                  disabled={actionLoading}
                >
                  Sync Time
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSendCommand(device.device_id, "CLEAR_QUEUE")}
                  disabled={actionLoading}
                >
                  Clear Queue
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleSendCommand(device.device_id, "SYNC_USERS")}
                  disabled={actionLoading}
                >
                  Sync Users
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleSendCommand(device.device_id, "REBOOT")}
                  disabled={actionLoading}
                >
                  Reboot
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
