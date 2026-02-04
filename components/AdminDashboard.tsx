
import React, { useState, useMemo } from 'react';
import { Employee, AdminSettings, AttendanceRecord, LeaveRecord } from '../types';
import { getCurrentPosition } from '../services/locationService';

interface AdminDashboardProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  settings: AdminSettings;
  setSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  records: AttendanceRecord[];
  leaveRecords: LeaveRecord[];
  setLeaveRecords: React.Dispatch<React.SetStateAction<LeaveRecord[]>>;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  employees, setEmployees, settings, setSettings, records, leaveRecords, setLeaveRecords, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'payroll' | 'settings'>('payroll');
  const [newEmployee, setNewEmployee] = useState({ name: '', gender: 'male' as const, position: '' });

  const payrollData = useMemo(() => {
    const daily: Record<string, any> = {};
    records.forEach(r => {
      const date = new Date(r.timestamp).toISOString().split('T')[0];
      const key = `${date}-${r.employeeId}`;
      if (!daily[key]) daily[key] = { name: r.employeeName, date, checkIn: null, checkOut: null, status: 'regular' };
      if (r.type === 'check-in') {
        daily[key].checkIn = r.timestamp;
        daily[key].status = r.status;
      } else {
        daily[key].checkOut = r.timestamp;
      }
    });
    return Object.values(daily).sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const exportCSV = () => {
    const headers = ["Date", "Name", "Check-In", "Check-Out", "Status"];
    const rows = payrollData.map(r => [
      r.date,
      r.name,
      r.checkIn ? new Date(r.checkIn).toLocaleTimeString() : "-",
      r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : "-",
      r.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addEmployee = () => {
    if (newEmployee.name && newEmployee.position) {
      setEmployees(prev => [...prev, { ...newEmployee, id: Math.random().toString(36).substr(2, 9) }]);
      setNewEmployee({ name: '', gender: 'male', position: '' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-white">
      <header className="px-6 py-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">Terminal</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Admin Control Unit</p>
        </div>
        <div className="flex gap-4">
          {activeTab === 'payroll' && records.length > 0 && (
            <button onClick={exportCSV} className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">
              Export CSV
            </button>
          )}
          <button onClick={onLogout} className="px-6 py-2 bg-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
            Exit
          </button>
        </div>
      </header>

      <div className="px-6 flex gap-8 border-b border-slate-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'payroll', label: 'Attendance logs' },
          { id: 'roster', label: 'Staff Roster' },
          { id: 'settings', label: 'Preferences' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-4 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap border-b-2 transition-all ${
              activeTab === tab.id ? 'border-slate-950 text-slate-950' : 'border-transparent text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="p-6">
        {activeTab === 'payroll' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Date</th>
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Name</th>
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">In / Out</th>
                    <th className="py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payrollData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 text-xs font-bold text-slate-500">{row.date}</td>
                      <td className="py-5 text-xs font-black uppercase tracking-tight">{row.name}</td>
                      <td className="py-5 text-xs font-medium text-slate-600">
                        {row.checkIn ? new Date(row.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--'}
                        {' / '}
                        {row.checkOut ? new Date(row.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                      <td className="py-5">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          row.status === 'on-time' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payrollData.length === 0 && (
                <div className="py-20 text-center text-slate-300 uppercase font-black text-[10px] tracking-[0.5em]">No Data Recorded</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-slate-50 p-8 rounded-[40px] space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Onboard Staff</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input 
                  placeholder="FULL NAME"
                  className="bg-white border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-4 focus:ring-slate-100 transition-all uppercase outline-none"
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                />
                <input 
                  placeholder="JOB ROLE"
                  className="bg-white border-none rounded-2xl px-5 py-4 font-bold text-xs focus:ring-4 focus:ring-slate-100 transition-all uppercase outline-none"
                  value={newEmployee.position}
                  onChange={e => setNewEmployee({...newEmployee, position: e.target.value})}
                />
                <button 
                  onClick={addEmployee}
                  className="bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all active:scale-95"
                >
                  Confirm Staff
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className="p-6 border border-slate-100 rounded-[32px] flex justify-between items-center hover:border-slate-300 transition-all group">
                  <div>
                    <p className="font-black uppercase text-sm tracking-tight">{emp.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{emp.position}</p>
                  </div>
                  <button 
                    onClick={() => setEmployees(prev => prev.filter(e => e.id !== emp.id))}
                    className="w-10 h-10 rounded-xl bg-rose-50 text-rose-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Access PIN</label>
                  <input 
                    type="password"
                    maxLength={6}
                    className="w-full bg-slate-50 border-none rounded-3xl px-8 py-5 text-2xl font-black tracking-[0.5em] text-center focus:ring-4 focus:ring-slate-100 transition-all outline-none"
                    value={settings.adminPin}
                    onChange={e => setSettings({...settings, adminPin: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shift Start</label>
                     <input type="time" className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 font-bold text-sm outline-none" value={settings.workStartTime} onChange={e => setSettings({...settings, workStartTime: e.target.value})}/>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Shift End</label>
                     <input type="time" className="w-full bg-slate-50 border-none rounded-3xl px-6 py-4 font-bold text-sm outline-none" value={settings.workEndTime} onChange={e => setSettings({...settings, workEndTime: e.target.value})}/>
                   </div>
                </div>
                <div className="pt-10 border-t border-slate-100">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-950 mb-6">Geofence Parameters</h4>
                   <div className="grid grid-cols-2 gap-6 mb-6">
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Latitude</label>
                        <input type="number" step="any" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none" value={settings.officeLocation.lat} onChange={e => setSettings({...settings, officeLocation: {...settings.officeLocation, lat: parseFloat(e.target.value)}})}/>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Longitude</label>
                        <input type="number" step="any" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold outline-none" value={settings.officeLocation.lng} onChange={e => setSettings({...settings, officeLocation: {...settings.officeLocation, lng: parseFloat(e.target.value)}})}/>
                      </div>
                   </div>
                   <button 
                     onClick={async () => {
                       try {
                         const pos = await getCurrentPosition();
                         setSettings({...settings, officeLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude }});
                         alert("GEOFENCE CENTER UPDATED TO CURRENT COORDINATES");
                       } catch (err) {
                         alert("FAILED TO GET LOCATION. PLEASE CHECK PERMISSIONS.");
                       }
                     }}
                     className="w-full py-4 bg-slate-50 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all active:scale-95"
                   >
                     Use Current Location as Office Center
                   </button>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
