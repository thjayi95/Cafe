
import React, { useMemo } from 'react';
import { Habit, CheckInLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StatsProps {
  habits: Habit[];
  logs: CheckInLog[];
}

const StatsView: React.FC<StatsProps> = ({ habits, logs }) => {
  const chartData = useMemo(() => {
    return habits.map(h => ({
      name: h.name,
      count: logs.filter(l => l.habitId === h.id).length,
      color: h.color.replace('bg-', '')
    }));
  }, [habits, logs]);

  const streakData = useMemo(() => {
    // Basic streak calculation
    const today = new Date().toISOString().split('T')[0];
    const totalLogs = logs.length;
    const completedHabitsCount = habits.length;
    const completionRate = totalLogs > 0 ? (totalLogs / (habits.length || 1) * 100) : 0;
    
    return {
      total: totalLogs,
      rate: Math.round(completionRate)
    };
  }, [habits, logs]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">数据分析</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">总计打卡</p>
          <p className="text-2xl font-bold text-blue-600">{streakData.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">完成指数</p>
          <p className="text-2xl font-bold text-emerald-500">{streakData.rate}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-6">各习惯完成情况</h3>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`#${entry.color === 'blue-500' ? '3b82f6' : '10b981'}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-700">成就勋章</h3>
        <div className="grid grid-cols-4 gap-4">
          {[1, 7, 30, 100].map(milestone => {
            const unlocked = logs.length >= milestone;
            return (
              <div key={milestone} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${unlocked ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                <div className={`text-2xl ${unlocked ? '' : 'grayscale'}`}>🏆</div>
                <p className={`text-[10px] font-bold ${unlocked ? 'text-amber-700' : 'text-slate-400'}`}>{milestone}次</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsView;
