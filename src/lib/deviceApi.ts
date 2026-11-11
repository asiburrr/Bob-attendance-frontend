export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface TimelineBucket {
  hour: string;
  label: string;
  status: 'online' | 'offline' | 'degraded' | 'nodata';
  uptime_pct: number;
  drops: number;
  downtime_sec: number;
}

export interface DeviceConnectivityData {
  uptime_pct: number;
  total_drops: number;
  total_downtime_sec: number;
  last_seen_sec: number | null;
  timeline: TimelineBucket[];
}

export interface DeviceItem {
  id: number;
  device_id: string;
  device_name: string;
  ip_address: string;
  mac_address: string;
  user_count: number;
  fw_version: string;
  cpu_usage: number;
  free_ram: number;
  queue_count: number;
  last_activity: string | null;
  is_online: number;
  created_at: string | null;
  connectivity: DeviceConnectivityData;
}

export interface DeviceUserItem {
  id: number;
  device_id: string;
  student_id: string;
  user_id?: string;
  card_number: string;
  name: string;
  created_at: string | null;
}

export interface PartEnrolledUserItem {
  enrollment_id: number;
  user_id: number;
  student_id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  is_card_assigned: boolean;
  card_number: string | null;
  assigned_device_id: string | null;
  cardholder_id: number | null;
}

export interface PartEnrolledUsersResponse {
  status: string;
  part_id: number;
  part_title: string;
  course_id?: number | null;
  course_title?: string | null;
  total_count: number;
  assigned_count: number;
  unassigned_count: number;
  users: PartEnrolledUserItem[];
}

export interface AttendanceItem {
  id: string;
  device_id: string;
  student_id: string | null;
  user_id?: string | null;
  user_name: string;
  card_uid: string;
  swipe_time: string | null;
  is_offline: boolean;
  is_used: boolean;
  is_spam: boolean;
  created_at: string | null;
}

export interface CommandItem {
  id: number;
  device_id: string;
  command: string;
  status: 'pending' | 'sent' | 'success' | 'failed';
  return_data: string | null;
  created_at: string | null;
  executed_at: string | null;
}

export interface AttendanceScheduleItem {
  id: number;
  part_id: number;
  part_title?: string;
  start_time: string;
  end_time: string;
  late_time: string;
  available_days: string[];
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceLogItem {
  id: number;
  device_attendance_id?: string | null;
  device_id?: string | null;
  student_id: string;
  student_name?: string;
  phone_number?: string;
  course_id?: number | null;
  course_title?: string;
  part_id?: number | null;
  part_title?: string;
  status: 'present' | 'absent' | 'late';
  type: 'manual' | 'device';
  att_date: string;
  att_time: string;
  att_datetime: string;
  created_at: string;
}

export interface PaginatedAttendanceLogsResponse {
  status: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  logs: AttendanceLogItem[];
}

export interface RawPunchItem {
  id: string;
  device_id: string;
  student_id: string;
  user_name: string;
  card_uid: string;
  swipe_time: string | null;
  is_offline: boolean;
  is_used: boolean;
  is_spam: boolean;
  created_at: string | null;
}

export interface PaginatedRawPunchesResponse {
  status: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  punches: RawPunchItem[];
}

export interface CoursePartItem {
  id: number;
  title: string;
  short_title?: string;
  course_id?: number;
  course_title?: string;
  has_schedule?: boolean;
}

export interface CourseWithPartsItem {
  id: number;
  title: string;
  subtitle?: string;
  parts: {
    id: number;
    title: string;
    short_title?: string;
    index?: number;
  }[];
}

export interface RealtimeAttendanceStudent {
  enrollment_id: number;
  user_id: number;
  student_id: string;
  name: string;
  phone_number: string;
  avatar: string | null;
  status: 'pending' | 'present' | 'late' | 'absent';
  log_id: number | null;
  log_type: 'device' | 'manual' | null;
  att_time: string | null;
}

export interface RealtimeAttendanceResponse {
  status: string;
  part_id: number;
  part_title: string;
  course_id: number;
  course_title: string;
  date: string;
  total_students: number;
  students: RealtimeAttendanceStudent[];
}

export interface DeviceLiveDataResponse {
  status: string;
  stats: {
    total_terminals: number;
    online_terminals: number;
    swipes_today: number;
    registered_users: number;
    active_schedules?: number;
    total_logs?: number;
  };
  devices: DeviceItem[];
  users: DeviceUserItem[];
  attendance: AttendanceItem[];
  commands: CommandItem[];
  schedules?: AttendanceScheduleItem[];
  logs?: AttendanceLogItem[];
}

export async function fetchDeviceLiveData(): Promise<DeviceLiveDataResponse> {
  const res = await fetch(`${API_BASE_URL}/api/devices/live-data/`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to load device data (${res.status})`);
  }
  return res.json();
}

export async function sendDeviceCommand(deviceId: string, command: string) {
  const res = await fetch(`${API_BASE_URL}/api/devices/command/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, command }),
  });
  return res.json();
}

export async function triggerCardEnrollment(deviceId: string, studentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/devices/enroll/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, student_id: studentId, user_id: studentId }),
  });
  return res.json();
}

export async function triggerBulkEnrollment(deviceId: string, studentIds: string[]) {
  const res = await fetch(`${API_BASE_URL}/api/devices/enroll/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, student_ids: studentIds }),
  });
  return res.json();
}

export async function cancelCardEnrollment(deviceId: string) {
  const res = await fetch(`${API_BASE_URL}/api/devices/cancel-enroll/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  });
  return res.json();
}

export async function fetchPartEnrolledUsers(partId: number, deviceId?: string): Promise<PartEnrolledUsersResponse> {
  const url = `${API_BASE_URL}/api/devices/part-users/?part_id=${partId}${deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch enrolled students for part');
  }
  return res.json();
}

export async function saveDeviceUser(data: { device_id: string; student_id: string; user_id?: string; card_number?: string; name?: string }) {
  const res = await fetch(`${API_BASE_URL}/api/devices/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_id: data.device_id,
      student_id: data.student_id || data.user_id,
      card_number: data.card_number,
      name: data.name,
    }),
  });
  return res.json();
}

export async function registerDeviceUser(deviceId: string, studentId: string, card_number?: string, name?: string) {
  return saveDeviceUser({ device_id: deviceId, student_id: studentId, user_id: studentId, card_number, name });
}

export async function deleteDeviceUser(deviceId: string, studentId: string) {
  const res = await fetch(`${API_BASE_URL}/api/devices/users/?device_id=${encodeURIComponent(deviceId)}&student_id=${encodeURIComponent(studentId)}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function fetchCourseParts(): Promise<CoursePartItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/devices/course-parts/`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return data.parts || [];
}

export async function fetchAttendanceSchedules(partId?: number): Promise<AttendanceScheduleItem[]> {
  const url = partId ? `${API_BASE_URL}/api/devices/schedules/?part_id=${partId}` : `${API_BASE_URL}/api/devices/schedules/`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  return data.schedules || [];
}

export async function createAttendanceSchedule(schedule: {
  part_id: number;
  start_time: string;
  end_time: string;
  late_time: string;
  available_days: string[];
  is_active: boolean;
}) {
  const res = await fetch(`${API_BASE_URL}/api/devices/schedules/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  return res.json();
}

export async function updateAttendanceSchedule(scheduleId: number, schedule: {
  part_id?: number;
  start_time?: string;
  end_time?: string;
  late_time?: string;
  available_days?: string[];
  is_active?: boolean;
}) {
  const res = await fetch(`${API_BASE_URL}/api/devices/schedules/${scheduleId}/`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(schedule),
  });
  return res.json();
}

export async function deleteAttendanceSchedule(scheduleId: number) {
  const res = await fetch(`${API_BASE_URL}/api/devices/schedules/${scheduleId}/`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function fetchAttendanceLogs(filters?: {
  student_id?: string;
  part_id?: number;
  status?: string;
  att_date?: string;
}): Promise<AttendanceLogItem[]> {
  const params = new URLSearchParams();
  if (filters?.student_id) params.set('student_id', filters.student_id);
  if (filters?.part_id) params.set('part_id', String(filters.part_id));
  if (filters?.status) params.set('status', filters.status);
  if (filters?.att_date) params.set('att_date', filters.att_date);

  const res = await fetch(`${API_BASE_URL}/api/devices/logs/?${params.toString()}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return data.logs || [];
}

export async function fetchPaginatedAttendanceLogs(filters?: {
  student_id?: string;
  course_id?: number;
  part_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedAttendanceLogsResponse> {
  const params = new URLSearchParams();
  if (filters?.student_id) params.set('student_id', filters.student_id);
  if (filters?.course_id) params.set('course_id', String(filters.course_id));
  if (filters?.part_id) params.set('part_id', String(filters.part_id));
  if (filters?.status) params.set('status', filters.status);
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.page_size) params.set('page_size', String(filters.page_size));

  const res = await fetch(`${API_BASE_URL}/api/devices/logs/?${params.toString()}`, {
    cache: 'no-store',
  });
  return res.json();
}

export async function fetchPaginatedRawPunches(filters?: {
  device_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<PaginatedRawPunchesResponse> {
  const params = new URLSearchParams();
  if (filters?.device_id) params.set('device_id', filters.device_id);
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.page_size) params.set('page_size', String(filters.page_size));

  const res = await fetch(`${API_BASE_URL}/api/devices/raw-punches/?${params.toString()}`, {
    cache: 'no-store',
  });
  return res.json();
}

export async function triggerAttendanceProcessing(): Promise<{
  status: string;
  result: { processed: number; logs_created: number; spam_flagged: number; message: string };
}> {
  const res = await fetch(`${API_BASE_URL}/api/devices/trigger-process/`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchCoursesWithParts(): Promise<CourseWithPartsItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/devices/courses-with-parts/`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  return data.courses || [];
}

export async function fetchRealtimeAttendance(
  partId: number,
  date?: string
): Promise<RealtimeAttendanceResponse> {
  const d = date ? `&date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE_URL}/api/devices/realtime-attendance/?part_id=${partId}${d}`, {
    cache: 'no-store',
  });
  return res.json();
}

export async function markRealtimeAttendance(data: {
  student_id: string;
  part_id: number;
  status: 'present' | 'late' | 'absent' | 'delete' | 'undo' | 'pending' | string;
  undo?: boolean;
  att_date?: string;
  att_time?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/devices/realtime-attendance/mark/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function bulkMarkRealtimeAttendance(data: {
  student_ids: string[];
  part_id: number;
  status: 'present' | 'late' | 'absent';
  att_date?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/devices/realtime-attendance/bulk-mark/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
