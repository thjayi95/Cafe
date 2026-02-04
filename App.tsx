
import React, { useState, useEffect } from 'react';
import { Employee, AdminSettings, AttendanceRecord, ViewState, LeaveRecord } from './types';
import EmployeeView from './components/EmployeeView';
import AdminGate from './components/AdminGate';
import AdminDashboard from './components/AdminDashboard';
import CalendarView from './components/CalendarView';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('employee');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [settings, setSettings] = useState<AdminSettings>({
    adminPin: '123456',
    workStartTime: '09:00',
    workEndTime: '18:00',
    officeLocation: {
      lat: 7.802212871127979,
      lng: 98.30375813809852
    }
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);

  // Persistence
  useEffect(() => {
    const storedEmployees = localStorage.getItem('att_employees');
    const storedSettings = localStorage.getItem('att_settings');
    const storedRecords = localStorage.getItem('att_records');
    const storedLeaves = localStorage.getItem('att_leaves');
    
    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
    if (storedSettings) setSettings(JSON.parse(storedSettings));
    if (storedRecords) setRecords(JSON.parse(storedRecords));
    if (storedLeaves) setLeaveRecords(JSON.parse(storedLeaves));
  }, []);

  useEffect(() => {
    localStorage.setItem('att_employees', JSON.stringify(employees));
    localStorage.setItem('att_settings', JSON.stringify(settings));
    localStorage.setItem('att_records', JSON.stringify(records));
    localStorage.setItem('att_leaves', JSON.stringify(leaveRecords));
  }, [employees, settings, records, leaveRecords]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {view === 'employee' && (
        <EmployeeView 
          employees={employees} 
          settings={settings} 
          records={records}
          onRecordSubmit={(newRecord) => setRecords(prev => [...prev, newRecord])}
          onOpenAdmin={() => setView('admin_gate')}
          onOpenCalendar={() => setView('calendar')}
        />
      )}

      {view === 'calendar' && (
        <CalendarView 
          records={records}
          leaveRecords={leaveRecords}
          onBack={() => setView('employee')}
        />
      )}

      {view === 'admin_gate' && (
        <AdminGate 
          correctPin={settings.adminPin} 
          onSuccess={() => setView('admin_dashboard')}
          onCancel={() => setView('employee')}
        />
      )}

      {view === 'admin_dashboard' && (
        <AdminDashboard 
          employees={employees}
          setEmployees={setEmployees}
          settings={settings}
          setSettings={setSettings}
          records={records}
          leaveRecords={leaveRecords}
          setLeaveRecords={setLeaveRecords}
          onLogout={() => setView('employee')}
        />
      )}
    </div>
  );
};

export default App;
