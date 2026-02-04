
import React, { useState } from 'react';
import { Habit, CheckInLog, AIFeedback } from '../types';
import { ICONS, COLORS } from '../constants';

interface DashboardProps {
  habits: Habit[];
  logs: CheckInLog[];
  aiFeedback: AIFeedback;
  toggleCheckIn: (id: string) => void;
  addHabit: (name: string, icon: string, color: string) => void;
  deleteHabit: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ habits, logs, aiFeedback, toggleCheckIn, addHabit, deleteHabit }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter(h => logs.some(l => l.habitId === h.id && l.date === today)).length;
  const progress = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addHabit(newName, selectedIcon, selectedColor);
      setNewName('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-1">{Math.round(progress)}%</h2>
            <p className="text-blue-100 text-sm">今日打卡进度</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-semibold">{completedToday}/{habits.length}</p>
            <p className="text-blue-100 text-sm">已完成习惯</p>
          </div>
        </div>
        <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-700 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* AI Coach Feedback */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🤖</span>
            <h3 className="text-sm font-bold text-slate-800">AI 习惯教练</h3>
          </div>
          <p className="italic text-slate-600 text-sm mb-3">"{aiFeedback.quote}"</p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-xs leading-relaxed text-slate-500 font-medium">{aiFeedback.advice}</p>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-slate-700">我的习惯</h3>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            + 添加习惯
          </button>
        </div>
        
        {habits.map(habit => {
          const isDone = logs.some(l => l.habitId === habit.id && l.date === today);
          return (
            <div 
              key={habit.id}
              className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                isDone ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${habit.color} rounded-xl flex items-center justify-center text-2xl shadow-sm`}>
                  {habit.icon}
                </div>
                <div>
                  <h4 className={`font-semibold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                    {habit.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">每日打卡 1 次</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => deleteHabit(habit.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 md:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button 
                  onClick={() => toggleCheckIn(habit.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-slate-200 text-transparent hover:border-blue-400'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {habits.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl">
            <p className="text-slate-400 text-sm">还没有习惯？点击右上角添加一个吧！</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-6">创建新习惯</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">习惯名称</label>
                <input 
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：早起、看书、冥想..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 border-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">选择图标</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setSelectedIcon(icon)}
                      className={`h-12 rounded-xl text-xl flex items-center justify-center transition-all ${
                        selectedIcon === icon ? 'bg-blue-100 scale-110' : 'bg-slate-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">选择颜色</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full ${color} transition-all ${
                        selectedColor === color ? 'ring-4 ring-offset-2 ring-blue-400 scale-110' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-slate-500 font-bold bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl text-white font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
