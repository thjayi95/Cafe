
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
      setError("CAMERA ACCESS DENIED");
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
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        setPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const handleAction = async (type: RecordType) => {
    if (!selectedId || !photo) {
      setError("MISSING IDENTITY OR PHOTO");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const pos = await getCurrentPosition();
      const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, settings.officeLocation.lat, settings.officeLocation.lng);

      if (dist > 150) { // Slightly increased tolerance for stability
        throw new Error(`GEOFENCE ERROR: YOU ARE ${Math.round(dist)}m AWAY`);
      }

      const isFaceValid = await verifyFace(photo);
      if (!isFaceValid) throw new Error("FACE VERIFICATION FAILED");

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
      setError(err.message || "SYSTEM FAILURE");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 animate-in fade-in zoom-in duration-500">
        <div className="max-w-md w-full bg-white rounded-[48px] p-10 shadow-2xl text-center space-y-8 border border-slate-100">
          <div className="w-24 h-24 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-xl">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight uppercase">Success</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Record Timestamped</p>
          </div>
          <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 italic font-medium text-slate-600 leading-relaxed">
            "{successData.quote}"
          </div>
          <button 
            onClick={() => setSuccessData(null)}
            className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen p-6 flex flex-col justify-center space-y-8">
      <header className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-4xl font-black tracking-tighter text-slate-950">
            {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
        <div className="flex gap-2">
           <button onClick={onOpenCalendar} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all border border-slate-100 shadow-sm">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>
           </button>
           <button onClick={onOpenAdmin} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-950 transition-all border border-slate-100 shadow-sm">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
           </button>
        </div>
      </header>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Staff Identity</label>
          <select 
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-950 font-bold focus:ring-4 focus:ring-slate-100 outline-none appearance-none transition-all"
          >
            <option value="">WHO ARE YOU?</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="relative aspect-[4/5] bg-slate-50 rounded-[40px] overflow-hidden border border-slate-100 shadow-inner group">
          {photo ? (
            <img src={photo} alt="Identity" className="w-full h-full object-cover" />
          ) : isCapturing ? (
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
               <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Capture</p>
            </div>
          )}

          {!photo && (
            <button 
              onClick={isCapturing ? capturePhoto : startCamera}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 px-10 py-4 bg-slate-950 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              {isCapturing ? "Snap Selfie" : "Start Recognition"}
            </button>
          )}

          {photo && (
            <button onClick={() => setPhoto(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-950 text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button 
            disabled={isSubmitting || !selectedId || !photo}
            onClick={() => handleAction('check-in')}
            className={`py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${
              isSubmitting ? 'bg-slate-100 text-slate-300' : 'bg-slate-950 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 active:scale-95'
            }`}
          >
            {isSubmitting ? "Processing..." : "Clock In"}
          </button>
          <button 
            disabled={isSubmitting || !selectedId || !photo}
            onClick={() => handleAction('check-out')}
            className={`py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all border-2 border-slate-950 ${
              isSubmitting ? 'border-slate-100 text-slate-300' : 'text-slate-950 hover:bg-slate-50 active:scale-95'
            }`}
          >
            {isSubmitting ? "Processing..." : "Clock Out"}
          </button>
        </div>
      </div>
      
      <footer className="pt-4 text-center">
        <p className="text-[9px] font-black uppercase tracking-[0.5em] text-slate-300">Biometric Attendance v2.0</p>
      </footer>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default EmployeeView;
