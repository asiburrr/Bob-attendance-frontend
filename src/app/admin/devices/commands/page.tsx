"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Terminal,
  RefreshCw,
  Send,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/feedback/Toast";
import {
  fetchDeviceLiveData,
  sendDeviceCommand,
  DeviceItem,
  CommandItem,
} from "@/lib/deviceApi";

export default function CommandsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [commands, setCommands] = useState<CommandItem[]>([]);

  const [selectedDevice, setSelectedDevice] = useState("SOH-CD001");
  const [customCommand, setCustomCommand] = useState("");

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchDeviceLiveData();
      if (data?.devices) setDevices(data.devices);
      if (data?.commands) setCommands(data.commands);
    } catch {
      if (!silent) toast.error("Failed to load command audit logs");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDispatch = async (cmdString: string) => {
    if (!selectedDevice || !cmdString) return;
    setActionLoading(true);
    try {
      await sendDeviceCommand(selectedDevice, cmdString.trim());
      toast.success(`Dispatched ${cmdString} to ${selectedDevice}`, "Instruction Enqueued");
      setCustomCommand("");
      await loadData(true);
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
            Remote Hardware Commands
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Enqueue hardware control directives and inspect ESP32 handshake logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />}
            variant="ghost"
            size="sm"
            onClick={() => loadData(false)}
            aria-label="Refresh logs"
          />
        </div>
      </div>

      {/* Dispatch Console Card */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4">
        <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
          Dispatch Hardware Directive
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Target Terminal
            </label>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-neutral-200/80 dark:border-white/10 bg-white/60 dark:bg-white/5 text-neutral-900 dark:text-neutral-100"
            >
              {devices.map((d) => (
                <option key={d.device_id} value={d.device_id}>
                  {d.device_name} ({d.device_id})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 flex flex-col justify-end">
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Custom Directive String
            </label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="e.g. SET_SERVER:http://127.0.0.1:8000"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
              />
              <Button
                variant="primary"
                size="md"
                onClick={() => handleDispatch(customCommand)}
                loading={actionLoading}
                disabled={!customCommand}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-400 font-medium mr-1">Presets:</span>
          {["PING", "FORCE_NTP", "CLEAR_QUEUE", "SYNC_USERS", "REBOOT"].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleDispatch(preset)}
              disabled={actionLoading}
              className="px-3 py-1 text-xs rounded-xl border border-neutral-200/80 dark:border-white/10 bg-neutral-500/5 hover:bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 transition-all font-mono"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Audit Log */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-neutral-200/80 dark:border-white/10 shadow-xs space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
          Command Execution Audit History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
            <thead className="border-b border-neutral-200/60 dark:border-white/10 uppercase font-semibold text-[10px] tracking-wider text-neutral-500">
              <tr>
                <th className="pb-3">Command ID</th>
                <th className="pb-3">Target Device</th>
                <th className="pb-3">Payload</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Dispatched At</th>
                <th className="pb-3">Terminal Response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200/40 dark:divide-white/5">
              {commands.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400">
                    No remote commands dispatched yet.
                  </td>
                </tr>
              ) : (
                commands.map((cmd) => (
                  <tr key={cmd.id} className="hover:bg-neutral-500/5 transition-colors">
                    <td className="py-3 font-mono text-neutral-500">
                      #{cmd.id}
                    </td>
                    <td className="py-3 font-mono font-semibold text-neutral-900 dark:text-white">
                      {cmd.device_id}
                    </td>
                    <td className="py-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                      {cmd.command}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant={
                          cmd.status === "success"
                            ? "success"
                            : cmd.status === "failed"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {cmd.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-neutral-500">
                      {cmd.created_at ? new Date(cmd.created_at).toLocaleTimeString() : "—"}
                    </td>
                    <td className="py-3 font-mono text-neutral-500 truncate max-w-xs">
                      {cmd.return_data || "Awaiting next heartbeat..."}
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

