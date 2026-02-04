
import React, { useState, useMemo } from 'react';
import { Employee, AdminSettings, AttendanceRecord, Holiday, LeaveRecord } from '../types';
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
  const [activeTab, setActiveTab] = useState<'reports' | 'leaves' | 'payroll' | 'employees' | 'settings'>('reports');
  const [newEmployee, setNewEmployee] = useState({ name: '', gender: 'male' as const, position: '' });
  const [newLeave, setNewLeave] = useState({ employeeId: '', date: '', reason: '' });

  // Filter States for Payroll
  const [payrollFilterDateStart, setPayrollFilterDateStart] = useState('');
  const [payrollFilterDateEnd, setPayrollFilterDateEnd] = useState('');
  const [payrollFilterEmployee, setPayrollFilterEmployee] = useState('');

  const todayStr = new Date().toLocaleDateString('en-US');
  const todayISO = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === todayISO);
  
  const onTimeRecords = todayRecords.filter(r => r.type === 'check-in' && r.status === 'on-time');
  const lateRecords = todayRecords.filter(r => r.type === 'check-in' && r.status === 'late');

  // Aggregated Payroll Data with Filter Logic
  const payrollData = useMemo(() => {
    const dailyData: Record<string, Record<string, { in?: number, out?: number, name: string, isLeave?: boolean, leaveReason?: string }>> = {};

    // Process Attendance Records
    records.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!dailyData[date]) dailyData[date] = {};
      if (!dailyData[date][record.employeeId]) {
        dailyData[date][record.employeeId] = { name: record.employeeName };
      }

      if (record.type === 'check-in') {
        if (!dailyData[date][record.employeeId].in || record.timestamp < dailyData[date][record.employeeId].in!) {
          dailyData[date][record.employeeId].in = record.timestamp;
        }
      } else {
        if (!dailyData[date][record.employeeId].out || record.timestamp > dailyData[date][record.employeeId].out!) {
          dailyData[date][record.employeeId].out = record.timestamp;
        }
      }
    });

    // Process Leave Records
    leaveRecords.forEach(leave => {
      if (!dailyData[leave.date]) dailyData[leave.date] = {};
      if (!dailyData[leave.date][leave.employeeId]) {
        dailyData[leave.date][leave.employeeId] = { name: leave.employeeName };
      }
      dailyData[leave.date][leave.employeeId].isLeave = true;
      dailyData[leave.date][leave.employeeId].leaveReason = leave.reason;
    });

    const result: any[] = [];
    Object.keys(dailyData).sort((a, b) => b.localeCompare(a)).forEach(date => {
      // Apply Date Filters
      if (payrollFilterDateStart && date < payrollFilterDateStart) return;
      if (payrollFilterDateEnd && date > payrollFilterDateEnd) return;

      Object.keys(dailyData[date]).forEach(empId => {
        // Apply Employee Filter
        if (payrollFilterEmployee && empId !== payrollFilterEmployee) return;

        const item = dailyData[date][empId];
        const checkIn = item.in ? new Date(item.in) : null;
        const checkOut = item.out ? new Date(item.out) : null;

        // Calculate Late
        let lateness = "";
        let isLate = false;
        if (checkIn && !item.isLeave) {
          const [h, m] = settings.workStartTime.split(':').map(Number);
          const limit = new Date(checkIn);
          limit.setHours(h, m, 0, 0);
          if (checkIn > limit) {
            isLate = true;
            const diffMs = checkIn.getTime() - limit.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            lateness = `${diffMins}m`;
          }
        }

        // Calculate Overtime
        let overtime = "";
        let isOvertime = false;
        if (checkOut && !item.isLeave) {
          const [h, m] = settings.workEndTime.split(':').map(Number);
          const limit = new Date(checkOut);
          limit.setHours(h, m, 0, 0);
          if (checkOut > limit) {
            isOvertime = true;
            const diffMs = checkOut.getTime() - limit.getTime();
            const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
            overtime = `+${diffHrs}h`;
          }
        }

        result.push({
          date,
          empId,
          name: item.name,
          in: item.isLeave ? "LEAVE" : (checkIn ? checkIn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--'),
          out: item.isLeave ? "--" : (checkOut ? checkOut.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--'),
          lateness,
          isLate,
          overtime,
          isOvertime,
          isLeave: item.isLeave,
          leaveReason: item.leaveReason
        });
      });
    });

    return result;
  }, [records, leaveRecords, settings, payrollFilterDateStart, payrollFilterDateEnd, payrollFilterEmployee]);

  const exportExcel = () => {
    const fileName = `payroll_report_${new Date().toISOString().split('T')[0]}.xls`;
    
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #f8fafc; color: #64748b; font-weight: bold; border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 8px; font-family: sans-serif; font-size: 12px; }
          .late { color: #ef4444; font-weight: bold; }
          .overtime { color: #10b981; font-weight: bold; }
          .leave { color: #f59e0b; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee Name</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Lateness</th>
              <th>Overtime</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
    `;

    payrollData.forEach(row => {
      const checkInStyle = row.isLeave ? 'class="leave"' : '';
      tableHtml += `
        <tr>
          <td>${row.date}</td>
          <td style="text-transform: uppercase;">${row.name}</td>
          <td ${checkInStyle}>${row.in}</td>
          <td>${row.out}</td>
          <td class="${row.isLate ? 'late' : ''}">${row.lateness || '--'}</td>
          <td class="${row.isOvertime ? 'overtime' : ''}">${row.overtime || '--'}</td>
          <td>${row.isLeave ? (row.leaveReason || 'On Leave') : ''}</td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const addEmployee = () => {
    if (newEmployee.name && newEmployee.position) {
      setEmployees(prev => [...prev, { ...newEmployee, id: Math.random().toString(36).substr(2, 9) }]);
      setNewEmployee({ name: '', gender: 'male', position: '' });
    }
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const addLeave = () => {
    if (newLeave.employeeId && newLeave.date) {
      const emp = employees.find(e => e.id === newLeave.employeeId);
      if (emp) {
        setLeaveRecords(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          employeeId: emp.id,
          employeeName: emp.name,
          date: newLeave.date,
          reason: newLeave.reason || 'Leave of absence'
        }]);
        setNewLeave({ employeeId: '', date: '', reason: '' });
      }
    }
  };

  const deleteLeave = (id: string) => {
    setLeaveRecords(prev => prev.filter(l => l.id !== id));
  };

  return (
    <div className="pb-24 max-w-4xl mx-auto px-4">
      <header className="py-6 bg-white sticky top-0 z-20 flex justify-between items-center gap-2 border-b -mx-4 px-6">
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight truncate">Admin Terminal</h1>
          <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">{todayStr}</p>
        </div>
        <button onClick={onLogout} className="shrink-0 px-3 sm:px-4 py-2 bg-slate-900 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-colors">Logout</button>
      </header>

      <div className="flex bg-white sticky top-[84px] z-10 -mx-4 px-4 border-b overflow-x-auto no-scrollbar">
        {[
          { id: 'reports', label: 'Overview' },
          { id: 'payroll', label: 'Payroll' },
          { id: 'leaves', label: 'Leaves' },
          { id: 'employees', label: 'Roster' },
          { id: 'settings', label: 'Config' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[70px] sm:min-w-[80px] py-4 text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all border-b-4 whitespace-nowrap px-1 sm:px-2 ${
              activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main className="py-6">
        {activeTab === 'reports' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-emerald-50 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-emerald-100 shadow-sm min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 truncate">Punctual</p>
                <p className="text-2xl sm:text-5xl font-black text-emerald-700 tracking-tighter truncate">{onTimeRecords.length}</p>
              </div>
              <div className="bg-rose-50 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] border border-rose-100 shadow-sm min-w-0">
                <p className="text-[8px] sm:text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 truncate">Late</p>
                <p className="text-2xl sm:text-5xl font-black text-rose-700 tracking-tighter truncate">{lateRecords.length}</p>
              </div>
            </div>

            <section className="space-y-4">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest px-1">Recent Activity</h3>
              <div className="space-y-3">
                {todayRecords.length > 0 ? todayRecords.map(record => (
                  <div key={record.id} className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-100 flex items-center gap-3 sm:gap-4 hover:shadow-lg transition-all">
                    <div className="relative shrink-0">
                       <img src={record.photo} className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover ring-2 sm:ring-4 ring-slate-50" alt="Selfie" />
                       <div className={`absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-[7px] sm:text-[10px] font-black text-white ${record.type === 'check-in' ? 'bg-blue-500' : 'bg-slate-900'}`}>
                         {record.type === 'check-in' ? 'IN' : 'OUT'}
                       </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 uppercase text-[9px] sm:text-xs truncate">{record.employeeName}</p>
                      <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold">
                        {new Date(record.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </p>
                    </div>
                    {record.type === 'check-in' && (
                      <span className={`shrink-0 px-2 sm:px-4 py-1 rounded-lg sm:rounded-xl text-[7px] sm:text-[8px] font-black tracking-widest uppercase ${
                        record.status === 'on-time' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {record.status === 'on-time' ? 'On Time' : 'Late'}
                      </span>
                    )}
                  </div>
                )) : (
                  <div className="py-16 text-center bg-white rounded-[32px] sm:rounded-[40px] border border-dashed border-slate-200">
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">No activity reported</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Filters Section */}
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advanced Filters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Start Date</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-[10px] focus:ring-2 focus:ring-blue-500"
                    value={payrollFilterDateStart}
                    onChange={e => setPayrollFilterDateStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">End Date</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-[10px] focus:ring-2 focus:ring-blue-500"
                    value={payrollFilterDateEnd}
                    onChange={e => setPayrollFilterDateEnd(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Employee</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-[10px] focus:ring-2 focus:ring-blue-500 appearance-none"
                    value={payrollFilterEmployee}
                    onChange={e => setPayrollFilterEmployee(e.target.value)}
                  >
                    <option value="">All Employees</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => {
                    setPayrollFilterDateStart('');
                    setPayrollFilterDateEnd('');
                    setPayrollFilterEmployee('');
                  }}
                  className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Payroll Statistics ({payrollData.length})</h3>
              <button 
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Export Excel
              </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">In</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Out</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Late</th>
                      <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">OT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrollData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-4 text-[10px] font-bold text-slate-500 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase truncate max-w-[100px]">{row.name}</td>
                        <td className={`px-4 py-4 text-[10px] font-black ${row.isLeave ? 'text-amber-600' : 'text-slate-700'}`}>
                          {row.in}
                        </td>
                        <td className="px-4 py-4 text-[10px] font-bold text-slate-700">{row.out}</td>
                        <td className={`px-4 py-4 text-[10px] font-black ${row.isLate ? 'text-rose-500' : 'text-slate-300'}`}>
                          {row.lateness || '--'}
                        </td>
                        <td className={`px-4 py-4 text-[10px] font-black ${row.isOvertime ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {row.overtime || '--'}
                        </td>
                      </tr>
                    ))}
                    {payrollData.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-xl shadow-blue-50/50 space-y-4 sm:space-y-6">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Absence Recording</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Member</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 sm:py-4 font-bold text-[10px] sm:text-sm truncate appearance-none"
                      value={newLeave.employeeId}
                      onChange={e => setNewLeave({...newLeave, employeeId: e.target.value})}
                    >
                      <option value="">Select Staff</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Leave Date</label>
                    <input 
                      type="date"
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 sm:py-4 font-bold text-[10px] sm:text-sm"
                      value={newLeave.date}
                      onChange={e => setNewLeave({...newLeave, date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Note (Reason)</label>
                  <input 
                    placeholder="Short description..."
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 sm:py-4 font-bold text-[10px] sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none truncate"
                    value={newLeave.reason}
                    onChange={e => setNewLeave({...newLeave, reason: e.target.value})}
                  />
                </div>
                <button 
                  onClick={addLeave}
                  className="w-full bg-amber-500 text-white font-black uppercase tracking-widest py-4 sm:py-5 rounded-2xl shadow-xl shadow-amber-100 hover:bg-amber-600 transition-all active:scale-[0.98] text-[10px]"
                >
                  Record Absence
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest px-1">Confirmed Leaves</h3>
              <div className="grid grid-cols-1 gap-2">
                {leaveRecords.length > 0 ? leaveRecords.map(leave => (
                  <div key={leave.id} className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-100 flex justify-between items-center group gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-sm sm:text-xl shrink-0">🌴</div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 uppercase text-[9px] sm:text-xs truncate">{leave.employeeName}</p>
                        <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5 truncate leading-none">
                          {new Date(leave.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => deleteLeave(leave.id)} className="shrink-0 p-2 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-xl transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )) : (
                  <p className="text-center py-10 text-slate-300 text-[10px] font-black uppercase tracking-widest bg-white rounded-3xl border border-dashed border-slate-100">Empty Record</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-xl shadow-blue-50/50 space-y-4 sm:space-y-6">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Add Staff</h3>
              <div className="space-y-3 sm:space-y-4">
                <input 
                  placeholder="Full Name"
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 sm:py-4 font-bold text-[10px] sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none truncate"
                  value={newEmployee.name}
                  onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <select 
                    className="bg-slate-50 border-none rounded-2xl px-5 py-3 sm:py-4 font-bold text-[10px] sm:text-sm appearance-none"
                    value={newEmployee.gender}
                    onChange={e => setNewEmployee({...newEmployee, gender: e.target.value as any})}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <input 
                    placeholder="Role (e.g. Designer)"
                    className="bg-slate-50 border-none rounded-2xl px-5 py-3 sm:py-4 font-bold text-[10px] sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none truncate"
                    value={newEmployee.position}
                    onChange={e => setNewEmployee({...newEmployee, position: e.target.value})}
                  />
                </div>
                <button 
                  onClick={addEmployee}
                  className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 sm:py-5 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98] text-[10px]"
                >
                  Save Profile
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest px-1">Roster List</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-white p-4 rounded-2xl sm:rounded-3xl border border-slate-100 flex justify-between items-center group hover:border-blue-100 transition-all gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 uppercase text-[9px] sm:text-xs truncate">{emp.name}</p>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 truncate">
                        {emp.position} · {emp.gender}
                      </p>
                    </div>
                    <button onClick={() => deleteEmployee(emp.id)} className="shrink-0 p-2 sm:p-3 bg-rose-50 text-rose-300 hover:text-rose-600 rounded-xl transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div className="bg-white p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] border border-slate-100 shadow-xl shadow-blue-50/50 space-y-6 sm:space-y-8">
              <div className="space-y-2">
                <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Admin Security Pin</label>
                <input 
                  type="text"
                  maxLength={6}
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 sm:py-4 font-mono font-black text-lg sm:text-2xl tracking-[0.4em] sm:tracking-[0.5em] text-center focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings.adminPin}
                  onChange={e => setSettings({...settings, adminPin: e.target.value.replace(/\D/g, '')})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Shift Start Time</label>
                  <input 
                    type="time"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 sm:py-4 font-black text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.workStartTime}
                    onChange={e => setSettings({...settings, workStartTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Shift End Time</label>
                  <input 
                    type="time"
                    className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 sm:py-4 font-black text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.workEndTime}
                    onChange={e => setSettings({...settings, workEndTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Office Geofence</h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase block tracking-widest ml-1">Latitude</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none min-w-0"
                      value={settings.officeLocation.lat}
                      onChange={e => setSettings({...settings, officeLocation: {...settings.officeLocation, lat: parseFloat(e.target.value)}})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase block tracking-widest ml-1">Longitude</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full bg-slate-50 border-none rounded-2xl px-4 py-3 text-[10px] sm:text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none min-w-0"
                      value={settings.officeLocation.lng}
                      onChange={e => setSettings({...settings, officeLocation: {...settings.officeLocation, lng: parseFloat(e.target.value)}})}
                    />
                  </div>
                </div>
                <button 
                  onClick={async () => {
                    try {
                      const pos = await getCurrentPosition();
                      setSettings({
                        ...settings, 
                        officeLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude }
                      });
                    } catch (err) {
                      alert("Unable to fetch location. Please check browser permissions.");
                    }
                  }}
                  className="w-full py-4 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors"
                >
                  📍 Update Center Point
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
