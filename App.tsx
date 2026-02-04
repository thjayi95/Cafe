
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
      lat: 31.2304, // Default to a central location, can be updated in Admin
      lng: 121.4737
    }
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaveRecords, setLeaveRecords] = useState<LeaveRecord[]>([]);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  useEffect(() => {
    // API Key Health Check
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
      setIsApiKeyMissing(true);
    }

    // Load Data
    const storedEmployees = localStorage.getItem('pro_employees');
    const storedSettings = localStorage.getItem('pro_settings');
    const storedRecords = localStorage.getItem('pro_records');
    const storedLeaves = localStorage.getItem('pro_leaves');
    
    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
    if (storedSettings) setSettings(JSON.parse(storedSettings));
    if (storedRecords) setRecords(JSON.parse(storedRecords));
    if (storedLeaves) setLeaveRecords(JSON.parse(storedLeaves));
  }, []);

  useEffect(() => {
    localStorage.setItem('pro_employees', JSON.stringify(employees));
    localStorage.setItem('pro_settings', JSON.stringify(settings));
    localStorage.setItem('pro_records', JSON.stringify(records));
    localStorage.setItem('pro_leaves', JSON.stringify(leaveRecords));
  }, [employees, settings, records, leaveRecords]);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-950 antialiased">
      {isApiKeyMissing && (
        <div className="bg-slate-900 text-white py-1 px-4 text-center">
          <p className="text-[9px] font-black uppercase tracking-[0.3em]">
            System Alert: AI Features Offline (API_KEY missing)
          </p>
        </div>
      )}

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
