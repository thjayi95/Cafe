
import React, { useState } from 'react';

interface AdminGateProps {
  correctPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const AdminGate: React.FC<AdminGateProps> = ({ correctPin, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleInput = (val: string) => {
    if (pin.length < 6) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 6) {
        if (newPin === correctPin) {
          onSuccess();
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 1000);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-white">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-2">Security Verification</h2>
        <p className="text-slate-400 text-sm">Please enter the 6-digit admin PIN</p>
      </div>

      <div className="flex gap-4 mb-16">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              error ? 'border-rose-500 bg-rose-500 scale-125' : 
              pin.length > i ? 'border-blue-500 bg-blue-500' : 'border-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Cancel', 0, '←'].map((btn) => (
          <button
            key={btn}
            onClick={() => {
              if (btn === 'Cancel') onCancel();
              else if (btn === '←') setPin(pin.slice(0, -1));
              else handleInput(btn.toString());
            }}
            className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold transition-all active:bg-slate-700 ${
              typeof btn === 'number' ? 'bg-slate-800' : 'text-slate-400 text-sm'
            }`}
          >
            {btn}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminGate;
