"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Clock,
  X,
  ChevronDown,
  LogOut,
  Users,
  Terminal,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({ mobileOpen = false, onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isDeviceActive = pathname.startsWith("/admin/devices");
  const [deviceMenuOpen, setDeviceMenuOpen] = useState(isDeviceActive);

  useEffect(() => {
    if (isDeviceActive) {
      setDeviceMenuOpen(true);
    }
  }, [isDeviceActive]);

  const displayName = user?.name || user?.identifier || "Administrator";
  const displayEmail = user?.email || user?.identifier || "admin@battlesofbiology.org";
  const initial = displayName ? displayName.charAt(0).toUpperCase() : "A";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/95 dark:bg-neutral-950/95 md:bg-white/70 md:dark:bg-neutral-900/60 md:backdrop-blur-2xl glass-nav text-neutral-800 dark:text-neutral-200 transition-colors select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-neutral-200/50 dark:border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            <Image
              src="/bob-logo.svg"
              alt="BOB Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            BOB Attendance
          </span>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-xl text-neutral-500 hover:bg-neutral-500/10 active:scale-95 transition-all"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden">
        <nav className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/admin"
            prefetch={true}
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
              pathname === "/admin"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md font-semibold active:scale-[0.98]"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white active:scale-[0.98]"
            }`}
          >
            <LayoutDashboard
              className={`w-4 h-4 ${
                pathname === "/admin" ? "text-white dark:text-neutral-900" : "text-neutral-500"
              }`}
            />
            <span>Dashboard</span>
          </Link>

          {/* Device Management Collapsible Group */}
          <div className="space-y-1 pt-0.5">
            <button
              type="button"
              onClick={() => setDeviceMenuOpen(!deviceMenuOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all group ${
                isDeviceActive
                  ? "text-neutral-950 dark:text-neutral-50 font-semibold bg-neutral-500/10"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Cpu
                  className={`w-4 h-4 ${
                    isDeviceActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-500"
                  }`}
                />
                <span>Device Hub</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${
                  deviceMenuOpen ? "rotate-180 text-neutral-700 dark:text-neutral-300" : ""
                }`}
              />
            </button>

            {deviceMenuOpen && (
              <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-neutral-200/60 dark:border-white/10 ml-5 transition-all">
                <Link
                  href="/admin/devices"
                  prefetch={true}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    pathname === "/admin/devices"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pathname === "/admin/devices"
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-neutral-400"
                    }`}
                  />
                  <span>Terminals</span>
                </Link>

                <Link
                  href="/admin/devices/schedules"
                  prefetch={true}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    pathname === "/admin/devices/schedules"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pathname === "/admin/devices/schedules"
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-neutral-400"
                    }`}
                  />
                  <span>Schedules</span>
                </Link>

                <Link
                  href="/admin/devices/users"
                  prefetch={true}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    pathname === "/admin/devices/users"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pathname === "/admin/devices/users"
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-neutral-400"
                    }`}
                  />
                  <span>Cardholders</span>
                </Link>

                <Link
                  href="/admin/devices/commands"
                  prefetch={true}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    pathname === "/admin/devices/commands"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pathname === "/admin/devices/commands"
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-neutral-400"
                    }`}
                  />
                  <span>Commands</span>
                </Link>

                <Link
                  href="/admin/devices/logs"
                  prefetch={true}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    pathname === "/admin/devices/logs"
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      pathname === "/admin/devices/logs"
                        ? "bg-white dark:bg-neutral-900"
                        : "bg-neutral-400"
                    }`}
                  />
                  <span>Device Logs</span>
                </Link>
              </div>
            )}
          </div>

          {/* Realtime Attendance Taking */}
          <Link
            href="/admin/attendance/realtime"
            prefetch={true}
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
              pathname === "/admin/attendance/realtime"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md font-semibold active:scale-[0.98]"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white active:scale-[0.98]"
            }`}
          >
            <UserCheck
              className={`w-4 h-4 ${
                pathname === "/admin/attendance/realtime" ? "text-white dark:text-neutral-900" : "text-neutral-500"
              }`}
            />
            <div className="flex items-center justify-between flex-1">
              <span>Realtime Attendance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </Link>

          {/* Attendance Logs */}
          <Link
            href="/admin/attendance"
            prefetch={true}
            onClick={onCloseMobile}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
              pathname === "/admin/attendance"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md font-semibold active:scale-[0.98]"
                : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-500/10 hover:text-neutral-900 dark:hover:text-white active:scale-[0.98]"
            }`}
          >
            <Clock
              className={`w-4 h-4 ${
                pathname === "/admin/attendance" ? "text-white dark:text-neutral-900" : "text-neutral-500"
              }`}
            />
            <span>Attendance Logs</span>
          </Link>
        </nav>
      </div>

      {/* Profile Footer */}
      {user && (
        <div className="p-3 border-t border-neutral-200/50 dark:border-white/10 shrink-0">
          <div className="p-2.5 rounded-2xl flex items-center justify-between gap-2.5 hover:bg-neutral-500/10 transition-all group">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                {initial}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {displayName}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
                  {displayEmail}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <aside className="w-56 shrink-0 hidden md:block">
        <div className="fixed top-0 left-0 bottom-0 w-56 border-r border-neutral-200/50 dark:border-white/10 z-40 overflow-hidden">
          {sidebarContent}
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
