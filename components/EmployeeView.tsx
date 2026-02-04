
import React, { useState, useRef, useEffect } from 'react';
import { Employee, AdminSettings, AttendanceRecord, RecordType } from '../types';
import { calculateDistance, getCurrentPosition } from '../services/locationService';
import { verifyFace, getMotivationalQuote } from '../services/aiService';

interface EmployeeViewProps {
  employees: Employee[];
  settings: AdminSettings;
  records: AttendanceRecord[];
  onRecordSubmit: (record: AttendanceRecord) => void;
  onOpenAdmin: () => void;
  onOpenCalendar: () => void;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ 
  employees, settings, records, onRecordSubmit, onOpenAdmin, onOpenCalendar 
}) => {
  const [selectedId, setSelectedId] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ type: RecordType, quote: string, status: string } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError("Unable to access camera. Please grant permission.");
      setIsCapturing(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleAction = async (type: RecordType) => {
    setError(null);
    if (!selectedId) return setError("Please select your name");
    if (!photo) return setError("Please take a selfie first");

    const today = new Date().toISOString().split('T')[0];
    const hasAlreadyDoneType = records.some(r => 
      r.employeeId === selectedId && 
      r.type === type && 
      new Date(r.timestamp).toISOString().split('T')[0] === today
    );

    if (hasAlreadyDoneType) {
      return setError(`You have already ${type === 'check-in' ? 'checked in' : 'checked out'} today.`);
    }

    setIsSubmitting(true);
    try {
      const pos = await getCurrentPosition();
      const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, settings.officeLocation.lat, settings.officeLocation.lng);

      if (dist > 100) {
        throw new Error(`Location Error: ${Math.round(dist)}m away. Limit is 100m.`);
      }

      const isFace = await verifyFace(photo);
      if (!isFace) throw new Error("Face verification failed. Please try again.");

      const employee = employees.find(e => e.id === selectedId)!;
      const now = new Date();
      let status: 'on-time' | 'late' | 'regular' = 'regular';

      if (type === 'check-in') {
        const [startH, startM] = settings.workStartTime.split(':').map(Number);
        const startLimit = new Date();
        startLimit.setHours(startH, startM, 0);
        status = now > startLimit ? 'late' : 'on-time';
      }

      const newRecord: AttendanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: selectedId,
        employeeName: employee.name,
        timestamp: now.getTime(),
        type,
        photo,
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        distance: dist,
        status
      };

      onRecordSubmit(newRecord);
      
      const quote = await getMotivationalQuote(type === 'check-out' ? 'check-out' : (status as 'on-time' | 'late'));
      setSuccessData({ type, quote, status: status.toUpperCase().replace('-', ' ') });
      
      setPhoto(null);
      setSelectedId('');
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full bg-white rounded-[40px] p-6 sm:p-10 shadow-2xl shadow-blue-100 text-center space-y-6 sm:space-y-8 border border-slate-100">
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto ring-8 ${successData.type === 'check-in' ? 'bg-emerald-50 text-emerald-500 ring-emerald-50/50' : 'bg-blue-50 text-blue-500 ring-blue-50/50'}`}>
            <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {successData.type === 'check-in' ? 'Good Morning!' : 'See You Tomorrow!'}
            </h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              {successData.type === 'check-in' ? 'Check-in Recorded' : 'Check-out Recorded'}
            </p>
          </div>

          <div className="relative px-2">
            <div className="absolute -top-6 -left-2 text-5xl text-slate-100 font-serif select-none">“</div>
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-100 relative z-10 max-h-[300px] overflow-y-auto no-scrollbar">
              <p className="text-base sm:text-lg italic text-slate-700 font-medium leading-relaxed break-words">
                {successData.quote}
              </p>
            </div>
            <div className="absolute -bottom-10 -right-2 text-5xl text-slate-100 font-serif rotate-180 select-none">“</div>
          </div>

          {successData.type === 'check-in' && (
            <div className="flex items-center justify-center gap-2">
              <span className={`px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-black tracking-widest uppercase ${successData.status === 'ON TIME' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {successData.status}
              </span>
            </div>
          )}

          <button 
            onClick={() => setSuccessData(null)}
            className="w-full py-4 sm:py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-xs sm:text-sm"
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase truncate">Clock Room</h1>
        <div className="flex gap-2 shrink-0">
          <button onClick={onOpenCalendar} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 transition-all active:scale-90" title="Calendar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button onClick={onOpenAdmin} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 transition-all active:scale-90" title="Admin">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xl shadow-blue-50/50 space-y-6 sm:space-y-8 border border-slate-100">
        <div className="text-center space-y-1">
          <p className="text-4xl sm:text-5xl font-mono font-black text-slate-900 tracking-tighter">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </p>
          <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-widest">
            {currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identity</label>
            <div className="relative">
              <select 
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 transition-all appearance-none text-sm pr-10 truncate"
              >
                <option value="">Select your name</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="truncate">
                    {emp.name} ({emp.position})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Face Recognition</label>
            <div className="relative aspect-square bg-slate-50 rounded-[32px] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center group">
              {photo ? (
                <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
              ) : isCapturing ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <button 
                  onClick={startCamera}
                  className="flex flex-col items-center text-slate-300 hover:text-blue-500 transition-colors p-4 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm group-hover:bg-blue-50 transition-colors shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">Click to start camera</span>
                </button>
              )}

              {isCapturing && (
                <button 
                  onClick={capturePhoto}
                  className="absolute bottom-6 bg-slate-900 text-white px-8 py-3 rounded-2xl shadow-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all whitespace-nowrap"
                >
                  Capture Selfie
                </button>
              )}
              
              {photo && (
                <button 
                  onClick={() => setPhoto(null)}
                  className="absolute top-4 right-4 bg-slate-900 text-white p-2 rounded-xl shadow-lg hover:bg-slate-800 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest p-3 rounded-2xl border border-rose-100 flex items-start gap-2 leading-relaxed">
             <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
             </svg>
             <span className="break-words">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <button 
            onClick={() => handleAction('check-in')}
            disabled={isSubmitting || isCapturing}
            className={`py-4 sm:py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl transition-all text-[10px] sm:text-xs ${
              isSubmitting ? 'bg-slate-200 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100 active:scale-95'
            }`}
          >
            {isSubmitting ? '...' : 'Check-in'}
          </button>
          <button 
            onClick={() => handleAction('check-out')}
            disabled={isSubmitting || isCapturing}
            className={`py-4 sm:py-5 rounded-2xl text-white font-black uppercase tracking-widest shadow-xl transition-all text-[10px] sm:text-xs ${
              isSubmitting ? 'bg-slate-200 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-100 active:scale-95'
            }`}
          >
            {isSubmitting ? '...' : 'Check-out'}
          </button>
        </div>
      </div>
      
      <p className="text-center text-[9px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] px-4">
        Verified Attendance System
      </p>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default EmployeeView;
