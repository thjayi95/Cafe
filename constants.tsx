
import React from 'react';
// Import the Habit type and Frequency enum to ensure proper typing of constants
import { Habit, Frequency } from './types';

export const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
  'bg-purple-500', 'bg-sky-500', 'bg-indigo-500', 'bg-orange-500'
];

export const ICONS = [
  '🔥', '💧', '🏃', '📚', '🍎', '🧘', '💻', '🎨', '🎸', '🌱', '💤', '✍️'
];

// Explicitly type INITIAL_HABITS as Habit[] and use the Frequency enum to fix the type mismatch error
export const INITIAL_HABITS: Habit[] = [
  { id: '1', name: '晨跑', icon: '🏃', color: 'bg-orange-500', frequency: Frequency.DAILY, createdAt: Date.now(), goalCount: 1 },
  { id: '2', name: '多喝水', icon: '💧', color: 'bg-blue-500', frequency: Frequency.DAILY, createdAt: Date.now(), goalCount: 1 },
  { id: '3', name: '阅读 30 分钟', icon: '📚', color: 'bg-indigo-500', frequency: Frequency.DAILY, createdAt: Date.now(), goalCount: 1 },
];
