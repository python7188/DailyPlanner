'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, Task, Goal, SubTask } from '@/lib/supabase';

// ============ PLACEHOLDER DATA ============
const TODAY = new Date().toISOString().split('T')[0];
const TOMORROW = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const DAY_AFTER = new Date(Date.now() + 172800000).toISOString().split('T')[0];
const IN_THREE = new Date(Date.now() + 259200000).toISOString().split('T')[0];
const IN_FOUR = new Date(Date.now() + 345600000).toISOString().split('T')[0];

const DEMO_TASKS: Task[] = [
  { id: 'd1', user_id: 'demo', title: 'Build 6-foot, 20mm DIY barbell for home gym', is_completed: false, target_date: TODAY, created_at: new Date().toISOString() },
  { id: 'd2', user_id: 'demo', title: 'Complete BITSAT previous year mock paper', is_completed: false, target_date: TODAY, created_at: new Date().toISOString(), time_target_minutes: 180 },
  { id: 'd3', user_id: 'demo', title: 'Review zero-order chemistry reactions', is_completed: false, target_date: TOMORROW, created_at: new Date().toISOString() },
  { id: 'd4', user_id: 'demo', title: 'Design product image layouts for nubie', is_completed: false, target_date: DAY_AFTER, created_at: new Date().toISOString() },
  { id: 'd5', user_id: 'demo', title: 'Review AP Sanskrit syllabus', is_completed: true, target_date: TODAY, created_at: new Date().toISOString() },
  { id: 'd6', user_id: 'demo', title: 'Update Spotify workout playlist', is_completed: false, target_date: IN_THREE, created_at: new Date().toISOString() },
  { id: 'd7', user_id: 'demo', title: 'Study integration by parts at 5pm', is_completed: false, target_date: IN_FOUR, created_at: new Date().toISOString() },
];

const DEMO_GOALS: Goal[] = [
  { id: 'g1', user_id: 'demo', title: 'Transform physique from 66kg to 75kg', start_value: 66, target_value: 75, current_value: 66, deadline: '2026-12-31', created_at: new Date().toISOString() },
  { id: 'g2', user_id: 'demo', title: 'Launch the nubie baby care brand website', start_value: 0, target_value: 100, current_value: 35, deadline: '2026-06-30', created_at: new Date().toISOString() },
  { id: 'g3', user_id: 'demo', title: 'Score top percentile in BITSAT 2026', start_value: 0, target_value: 100, current_value: 58, deadline: '2026-05-20', created_at: new Date().toISOString() },
];

const DEMO_SUBTASKS: SubTask[] = [
  { id: 's1', goal_id: 'g1', title: 'Hit 70kg milestone', achieved_value: 4, is_completed: false, created_at: new Date().toISOString() },
  { id: 's2', goal_id: 'g1', title: 'Hit 72kg milestone', achieved_value: 6, is_completed: false, created_at: new Date().toISOString() },
  { id: 's3', goal_id: 'g1', title: 'Hit 75kg milestone', achieved_value: 9, is_completed: false, created_at: new Date().toISOString() },
];

// ============ useTasks HOOK ============
export function useTasks(userId: string | undefined, isDemo: boolean) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setTasks(DEMO_TASKS);
      setIsLoading(false);
      return;
    }
    if (!userId) return;

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) { console.error(error); }
      else { setTasks(data || []); }
      setIsLoading(false);
    };

    fetchTasks();
  }, [userId, isDemo]);

  const addTask = useCallback(
    async (title: string, targetDate: string, timeTargetMinutes?: number) => {
      const newTask: Task = {
        id: crypto.randomUUID(),
        user_id: userId || 'demo',
        title,
        is_completed: false,
        target_date: targetDate,
        time_target_minutes: timeTargetMinutes || undefined,
        created_at: new Date().toISOString(),
        order_index: tasks.length,
      };

      // Optimistic update
      setTasks((prev) => [newTask, ...prev]);

      if (!isDemo && userId) {
        const { error } = await supabase.from('tasks').insert({
          id: newTask.id,
          user_id: userId,
          title,
          is_completed: false,
          target_date: targetDate,
          time_target_minutes: timeTargetMinutes || null,
        });
        if (error) {
          console.error(error);
          setTasks((prev) => prev.filter((t) => t.id !== newTask.id));
        }
      }
    },
    [userId, isDemo]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_completed: !t.is_completed } : t
        )
      );

      if (!isDemo) {
        const task = tasks.find((t) => t.id === id);
        if (task) {
          await supabase
            .from('tasks')
            .update({ is_completed: !task.is_completed })
            .eq('id', id);
        }
      }
    },
    [tasks, isDemo]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));

      if (!isDemo) {
        await supabase.from('tasks').delete().eq('id', id);
      }
    },
    [isDemo]
  );

  const updateTaskTitle = useCallback(
    async (id: string, newTitle: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
      );

      if (!isDemo) {
        await supabase.from('tasks').update({ title: newTitle }).eq('id', id);
      }
    },
    [isDemo]
  );

  const reorderTasks = useCallback((reorderedList: Task[]) => {
    // 1. Optimistic UI update
    
    // We only receive the subset of tasks for a specific date that were reordered, 
    // but the main state has ALL tasks.
    setTasks((prev) => {
      // Create a map to ensure we maintain all tasks
      const newTasks = [...prev];
      
      // Update the indices/positions of the reordered subset within the main list
      reorderedList.forEach((task, newIndex) => {
        const globalIndex = newTasks.findIndex(t => t.id === task.id);
        if (globalIndex !== -1) {
          newTasks[globalIndex] = { ...task, order_index: newIndex };
        }
      });
      // Sort the whole array just in case
      return newTasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    });

    if (!isDemo) {
      // 2. Background DB sync
      const updates = reorderedList.map((t) => ({
        id: t.id,
        user_id: t.user_id || userId,
        title: t.title,
        is_completed: t.is_completed,
        target_date: t.target_date,
        time_target_minutes: t.time_target_minutes
      }));
      
      supabase.from('tasks').upsert(updates).then(({ error }) => {
        if (error) console.error("Error reordering:", error);
      });
    }
  }, [isDemo, userId]);

  return { tasks, isLoading, addTask, toggleTask, deleteTask, updateTaskTitle, reorderTasks };
}

// ============ useGoals HOOK ============
export function useGoals(userId: string | undefined, isDemo: boolean) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  useEffect(() => {
    if (isDemo) {
      setGoals(DEMO_GOALS);
      setSubTasks(DEMO_SUBTASKS);
      return;
    }
    if (!userId) return;

    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) { console.error(error); }
      else { setGoals(data || []); }
      
      const { data: subData, error: subError } = await supabase
        .from('sub_tasks')
        .select('*, goals!inner(user_id)') // Join to ensure user ownership indirectly if needed, or RLS handles it
        .order('created_at', { ascending: true });

      if (subError) { console.error(subError); }
      else { setSubTasks(subData || []); }
    };

    fetchGoals();
  }, [userId, isDemo]);

  const addGoal = useCallback(
    async (title: string, startValue: number, targetValue: number) => {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        user_id: userId || 'demo',
        title,
        start_value: startValue,
        target_value: targetValue,
        current_value: startValue,
        deadline: '',
        created_at: new Date().toISOString(),
      };

      setGoals((prev) => [...prev, newGoal]);

      if (!isDemo && userId) {
        await supabase.from('goals').insert({
          id: newGoal.id,
          user_id: userId,
          title,
          start_value: startValue,
          target_value: targetValue,
          current_value: startValue,
        });
      }
    },
    [userId, isDemo]
  );

  const updateGoalProgress = useCallback(
    async (id: string, currentValue: number) => {
      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, current_value: currentValue } : g))
      );

      if (!isDemo) {
        await supabase.from('goals').update({ current_value: currentValue }).eq('id', id);
      }
    },
    [isDemo]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      if (!isDemo) {
        await supabase.from('goals').delete().eq('id', id);
      }
    },
    [isDemo]
  );

  const addSubTask = useCallback(
    async (goalId: string, title: string, achievedValue: number) => {
      const newSub: SubTask = {
        id: crypto.randomUUID(),
        goal_id: goalId,
        title,
        achieved_value: achievedValue,
        is_completed: false,
        created_at: new Date().toISOString()
      };
      setSubTasks((prev) => [...prev, newSub]);

      if (!isDemo) {
        await supabase.from('sub_tasks').insert({
          id: newSub.id,
          goal_id: goalId,
          title,
          achieved_value: achievedValue,
          is_completed: false
        });
      }
    },
    [isDemo]
  );

  const toggleSubTask = useCallback(
    async (id: string) => {
      setSubTasks((prev) => 
        prev.map((st) => (st.id === id ? { ...st, is_completed: !st.is_completed } : st))
      );

      if (!isDemo) {
        const target = subTasks.find(s => s.id === id);
        if (target) {
          await supabase.from('sub_tasks').update({ is_completed: !target.is_completed }).eq('id', id);
        }
      }
    },
    [isDemo, subTasks]
  );

  const deleteSubTask = useCallback(
    async (id: string) => {
      setSubTasks((prev) => prev.filter((s) => s.id !== id));
      if (!isDemo) {
        await supabase.from('sub_tasks').delete().eq('id', id);
      }
    },
    [isDemo]
  );

  return { goals, subTasks, addGoal, updateGoalProgress, deleteGoal, addSubTask, toggleSubTask, deleteSubTask };
}
