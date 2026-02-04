
export interface Employee {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  position: string;
}

export interface AdminSettings {
  adminPin: string;
  workStartTime: string; // HH:mm
  workEndTime: string;   // HH:mm
  officeLocation: {
    lat: number;
    lng: number;
  };
}

export type RecordType = 'check-in' | 'check-out';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: number;
  type: RecordType;
  photo: string; // Base64
  location: {
    lat: number;
    lng: number;
  };
  distance: number;
  status: 'on-time' | 'late' | 'regular';
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  reason: string;
}

export type ViewState = 'employee' | 'admin_gate' | 'admin_dashboard' | 'calendar';

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'international' | 'thai';
}

// Added missing types for habit-related features used in constants.tsx, Dashboard.tsx, etc.
export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: Frequency;
  createdAt: number;
  goalCount: number;
}

export interface CheckInLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

export interface AIFeedback {
  quote: string;
  advice: string;
}
