
import React, { useState, useMemo } from 'react';
import { AttendanceRecord, LeaveRecord, Holiday } from '../types';

interface CalendarViewProps {
  records: AttendanceRecord[];
  leaveRecords: LeaveRecord[];
  onBack: () => void;
}

const HOLIDAYS: Holiday[] = [
  { date: '2025-01-01', name: "New Year's Day", type: 'international' },
  { date: '2025-02-14', name: "Valentine's Day", type: 'international' },
  { date: '2025-04-13', name: "Songkran Festival", type: 'thai' },
  { date: '2025-04-14', name: "Songkran Festival", type: 'thai' },
  { date: '2025-04-15', name: "Songkran Festival", type: 'thai' },
  { date: '2025-05-01', name: "Labor Day", type: 'international' },
  { date: '2025-07-28', name: "King's Birthday", type: 'thai' },
  { date: '2025-08-12', name: "Mother's Day", type: 'thai' },
  { date: '2025-10-13', name: "King Rama IX Memorial", type: 'thai' },
  { date: '2025-10-23', name: "Chulalongkorn Day", type: 'thai' },
  { date: '2025-12-05', name: "King's Birthday (Father's Day)", type: 'thai' },
  { date: '2025-12-10', name: "Constitution Day", type: 'thai' },
  { date: '2025-12-25', name: "Christmas Day", type: 'international' },
];

const CalendarView: React.FC<CalendarViewProps> = ({ records, leaveRecords, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDayDetail, setSelectedDayDetail] = useState<any>(null);

  const calendarDays = useMemo(() => {
    const days = [];
    const date = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayIndex = date.getDay();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay; i++) {
      const currentFullDate = new Date(selectedYear, selectedMonth, i);
      const isWeekend = currentFullDate.getDay() === 0 || currentFullDate.getDay() === 6;
      const dayISO = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayHolidays = HOLIDAYS.filter(h => h.date === dayISO);
      const dayLeaves = leaveRecords.filter(l => l.date === dayISO);
      const dayAttendance = records.filter(r => new Date(r.timestamp).toISOString().split('T')[0] === dayISO && r.type === 'check-in');
      
      days.push({
        day: i,
        iso: dayISO,
        isWeekend,
        holidays: dayHolidays,
        leaves: dayLeaves,
        attendance: dayAttendance
      });
    }
    return days;
  }, [selectedMonth, selectedYear, records, leaveRecords]);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 min-h-screen">
      <header className="flex justify-between items-center mb-6 sm:mb-10 gap-2 sm:gap-4">
        <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-all active:scale-95 shrink-0">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tighter truncate">Shared Calendar</h1>
          <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">Company View</p>
        </div>
        <div className="w-10 sm:w-12 shrink-0" />
      </header>

      <div className="bg-white rounded-[32px] sm:rounded-[40px] p-4 sm:p-8 shadow-xl shadow-blue-50/50 border border-slate-100 space-y-4 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-rose-50 rounded-lg">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-rose-600">Weekend</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-blue-50 rounded-lg">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500" />
              <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-blue-600">Holiday</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setSelectedMonth(m => m === 0 ? 11 : m - 1)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <h2 className="text-[10px] sm:text-sm font-black uppercase tracking-widest min-w-[80px] sm:min-w-[140px] text-center truncate">
              {new Date(selectedYear, selectedMonth).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
            </h2>
            <button onClick={() => setSelectedMonth(m => m === 11 ? 0 : m + 1)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-[7px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest pb-1">{d}</div>
          ))}
          {calendarDays.map((data, idx) => (
            <div 
              key={idx} 
              onClick={() => data && setSelectedDayDetail(data)}
              className={`min-h-[70px] sm:min-h-[120px] border rounded-xl sm:rounded-3xl p-1 sm:p-2 flex flex-col gap-1 transition-all overflow-hidden cursor-pointer active:scale-95 ${!data ? 'bg-slate-50/50 border-transparent pointer-events-none' : data.isWeekend ? 'bg-rose-50/40 border-rose-100' : 'bg-white border-slate-50 shadow-sm'}`}
            >
              {data && (
                <>
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] sm:text-xs font-black ${data.isWeekend ? 'text-rose-500' : 'text-slate-900'}`}>{data.day}</span>
                    {(data.holidays.length > 0 || data.leaves.length > 0) && (
                      <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${data.holidays.length > 0 ? 'bg-blue-500' : 'bg-amber-500'}`} />
                    )}
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-1 flex-1 overflow-hidden">
                    {data.holidays.slice(0, 1).map((h, i) => (
                      <div key={i} className="px-1 py-0.5 bg-blue-600 rounded-md sm:rounded-lg">
                         <p className="text-[5px] sm:text-[8px] font-black text-white uppercase leading-tight truncate">{h.name}</p>
                      </div>
                    ))}
                    
                    {data.leaves.slice(0, 2).map((l, i) => (
                      <div key={i} className="px-1 py-0.5 bg-amber-50 rounded-md sm:rounded-lg border border-amber-100">
                         <p className="text-[5px] sm:text-[8px] font-black text-amber-700 uppercase leading-tight truncate">🌴 {l.employeeName}</p>
                      </div>
                    ))}
                    
                    {(data.leaves.length > 2 || (data.holidays.length > 0 && data.leaves.length > 1)) && (
                      <p className="text-[5px] sm:text-[7px] font-black text-slate-400 uppercase tracking-tighter text-center">...</p>
                    )}
                  </div>
                  {data.attendance.length > 0 && (
                    <div className="mt-auto border-t border-slate-50 pt-0.5">
                      <p className="text-[5px] sm:text-[7px] font-black text-emerald-500 uppercase tracking-tighter truncate text-center">
                        {data.attendance.length} PRESENT
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-sm p-8 shadow-2xl space-y-6 relative max-h-[80vh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setSelectedDayDetail(null)}
              className="absolute top-6 right-6 p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {new Date(selectedDayDetail.iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' })}
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Information Details</p>
            </div>

            <div className="space-y-6">
              {/* Holidays */}
              {selectedDayDetail.holidays.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Holidays</p>
                  <div className="space-y-2">
                    {selectedDayDetail.holidays.map((h: any, i: number) => (
                      <div key={i} className="bg-blue-50 border border-blue-100 p-3 rounded-2xl flex items-center gap-3">
                        <span className="text-xl">🎉</span>
                        <p className="text-sm font-bold text-blue-900">{h.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leaves */}
              {selectedDayDetail.leaves.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Employee Leaves</p>
                  <div className="space-y-2">
                    {selectedDayDetail.leaves.map((l: any, i: number) => (
                      <div key={i} className="bg-amber-50 border border-amber-100 p-3 rounded-2xl flex items-center gap-3">
                        <span className="text-xl">🌴</span>
                        <div>
                          <p className="text-sm font-bold text-amber-900">{l.employeeName}</p>
                          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{l.reason || 'Personal Leave'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Staff Present ({selectedDayDetail.attendance.length})</p>
                {selectedDayDetail.attendance.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDayDetail.attendance.map((a: any, i: number) => (
                      <div key={i} className="bg-emerald-50 p-2 rounded-xl text-[10px] font-bold text-emerald-800 text-center truncate">
                        {a.employeeName}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-300 font-bold italic text-center py-4 bg-slate-50 rounded-2xl">No check-ins recorded</p>
                )}
              </div>
            </div>

            <button 
              onClick={() => setSelectedDayDetail(null)}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
