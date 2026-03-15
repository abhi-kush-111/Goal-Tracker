import { 
  isSameDay, 
  isSameWeek, 
  isSameMonth, 
  parseISO, 
  startOfDay, 
  startOfWeek, 
  startOfMonth,
  eachDayOfInterval
} from 'date-fns';
import { supabase } from './lib/supabase';

export interface Habit {
  id: string;
  title: string;
  category: string;
  repeat: 'Daily' | 'Weekly' | 'Monthly';
  due_date?: string;
  created_at: string;
  completed_dates: string[];
  streak: number;
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  done: boolean;
  due_date?: string;
  note?: string;
  completed_at?: string;
  repeat?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  completed_dates?: string[];
  created_at?: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  deadline?: string;
  note?: string;
  progress: number;
  streak: number;
  milestones: Milestone[];
  created_at?: string;
  repeat?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
  completed_dates?: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function isDueOnDate(item: { created_at?: string, repeat?: string, due_date?: string, deadline?: string }, date: Date) {
  if (!item.repeat || item.repeat === 'None') {
    const dDate = item.due_date || item.deadline;
    if (dDate) return isSameDay(parseISO(dDate), date);
    return false;
  }
  
  const created = item.created_at ? parseISO(item.created_at) : new Date();
  if (startOfDay(date) < startOfDay(created)) return false;
  
  const dDate = item.due_date || item.deadline;
  if (dDate && startOfDay(date) > startOfDay(parseISO(dDate))) return false;
  
  if (item.repeat === 'Daily') return true;
  if (item.repeat === 'Weekly') return date.getDay() === created.getDay();
  if (item.repeat === 'Monthly') return date.getDate() === created.getDate();
  
  return false;
}

export function isCompletedOnDate(item: { repeat?: string, completed_dates?: string[], done?: boolean, completed_at?: string }, date: Date) {
  if (!item.repeat || item.repeat === 'None') {
    if (item.done && item.completed_at) {
      return isSameDay(parseISO(item.completed_at), date);
    }
    return false;
  }
  
  if (!item.completed_dates) return false;
  
  return item.completed_dates.some(d => {
    const dDate = parseISO(d);
    if (item.repeat === 'Daily') return isSameDay(dDate, date);
    if (item.repeat === 'Weekly') return isSameWeek(dDate, date);
    if (item.repeat === 'Monthly') return isSameMonth(dDate, date);
    return false;
  });
}

function countTotalOccurrences(item: { created_at?: string, repeat?: string, due_date?: string, deadline?: string }) {
  if (!item.repeat || item.repeat === 'None') return 1;
  const start = item.created_at ? parseISO(item.created_at) : new Date();
  const endStr = item.due_date || item.deadline;
  if (!endStr) return 1;
  const end = parseISO(endStr);
  
  if (startOfDay(end) < startOfDay(start)) return 1;
  
  let count = 0;
  try {
    const days = eachDayOfInterval({ start, end });
    for (const day of days) {
      if (isDueOnDate(item, day)) {
        count++;
      }
    }
  } catch (e) {
    return 1;
  }
  return count || 1;
}

function countCompletedOccurrences(item: { repeat?: string, completed_dates?: string[] }) {
  if (!item.repeat || item.repeat === 'None') return 0;
  if (!item.completed_dates) return 0;
  
  const uniquePeriods = new Set<number>();
  item.completed_dates.forEach(d => {
    const date = parseISO(d);
    if (item.repeat === 'Daily') {
      uniquePeriods.add(startOfDay(date).getTime());
    } else if (item.repeat === 'Weekly') {
      uniquePeriods.add(startOfWeek(date).getTime());
    } else if (item.repeat === 'Monthly') {
      uniquePeriods.add(startOfMonth(date).getTime());
    }
  });
  return uniquePeriods.size;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Health", color: "#10b981", icon: "🏃" },
  { id: "2", name: "Career", color: "#6366f1", icon: "💼" },
  { id: "3", name: "Learning", color: "#f59e0b", icon: "📖" },
  { id: "4", name: "Finance", color: "#0ea5e9", icon: "💰" },
  { id: "5", name: "Creative", color: "#ec4899", icon: "🎨" },
  { id: "6", name: "Personal", color: "#8b5cf6", icon: "🌱" },
  { id: "7", name: "Other", color: "#64748b", icon: "⚡" }
];

export const storage = {
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) console.error('Error getting user:', error);
    if (!user) console.warn('No user found in storage.getUser()');
    return user;
  },

  async getGoals(): Promise<Goal[]> {
    const user = await this.getUser();
    if (!user) {
      console.warn('getGoals: No user found, returning empty array');
      return [];
    }

    console.log('Fetching goals for user:', user.id);
    const { data: goalsData, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (goalsError) {
      console.error('Error fetching goals:', goalsError);
      return [];
    }

    console.log('Fetched goals count:', goalsData?.length || 0);

    const { data: milestonesData, error: milestonesError } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user.id);

    if (milestonesError) {
      console.error('Error fetching milestones:', milestonesError);
    }

    const goals: Goal[] = (goalsData || []).map(g => {
      const goalMilestones = (milestonesData || [])
        .filter(m => m.goal_id === g.id)
        .map(m => ({
          ...m,
          completed_dates: m.completed_dates || []
        }));

      return {
        ...g,
        completed_dates: g.completed_dates || [],
        milestones: goalMilestones
      };
    });

    return goals;
  },

  async addGoal(goal: Goal) {
    const user = await this.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('goals')
      .insert({
        id: goal.id,
        user_id: user.id,
        title: goal.title,
        category: goal.category,
        priority: goal.priority,
        deadline: goal.deadline || null,
        note: goal.note,
        progress: 0,
        streak: 0,
        repeat: goal.repeat || 'None',
        completed_dates: [],
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding goal:', error);
      alert('Failed to save goal: ' + error.message);
    }
  },

  async updateGoal(id: string, updates: Partial<Goal>) {
    const user = await this.getUser();
    if (!user) return;

    // Remove milestones from updates as they are in a separate table
    const { milestones, ...goalUpdates } = updates;

    const { error } = await supabase
      .from('goals')
      .update(goalUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error updating goal:', error);
  },

  async deleteGoal(id: string) {
    const user = await this.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error deleting goal:', error);
  },

  async addMilestone(milestone: Milestone) {
    const user = await this.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('milestones')
      .insert({
        id: milestone.id,
        user_id: user.id,
        goal_id: milestone.goal_id,
        title: milestone.title,
        done: false,
        due_date: milestone.due_date || null,
        note: milestone.note,
        repeat: milestone.repeat || 'None',
        completed_dates: [],
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding milestone:', error);
      alert('Failed to save milestone: ' + error.message);
    }
    
    // Update goal progress
    const goals = await this.getGoals();
    const goal = goals.find(g => g.id === milestone.goal_id);
    if (goal) {
      this.updateGoalProgress(goal);
      await this.updateGoal(goal.id, { progress: goal.progress });
    }
  },

  async toggleMilestone(id: string, date?: Date) {
    const user = await this.getUser();
    if (!user) return;

    const { data: milestone, error: fetchError } = await supabase
      .from('milestones')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !milestone) return;

    const updates: any = {};
    if (milestone.repeat && milestone.repeat !== 'None') {
      const targetDate = date || new Date();
      const isCompleted = isCompletedOnDate(milestone, targetDate);
      let completed_dates = milestone.completed_dates || [];
      
      if (isCompleted) {
        completed_dates = completed_dates.filter((d: string) => {
          const dDate = parseISO(d);
          if (milestone.repeat === 'Daily') return !isSameDay(dDate, targetDate);
          if (milestone.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
          if (milestone.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
          return true;
        });
      } else {
        completed_dates = [...completed_dates, targetDate.toISOString()];
      }
      updates.completed_dates = completed_dates;
    } else {
      updates.done = !milestone.done;
      updates.completed_at = updates.done ? new Date().toISOString() : null;
    }

    await supabase
      .from('milestones')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    // Update parent goal progress
    const goals = await this.getGoals();
    const goal = goals.find(g => g.id === milestone.goal_id);
    if (goal) {
      this.updateGoalProgress(goal);
      await this.updateGoal(goal.id, { progress: goal.progress });
    }
  },

  async toggleGoalCompletion(id: string, date?: Date) {
    const user = await this.getUser();
    if (!user) return;

    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !goal) return;

    if (goal.repeat && goal.repeat !== 'None') {
      const targetDate = date || new Date();
      const isCompleted = isCompletedOnDate(goal, targetDate);
      let completed_dates = goal.completed_dates || [];
      
      if (isCompleted) {
        completed_dates = completed_dates.filter((d: string) => {
          const dDate = parseISO(d);
          if (goal.repeat === 'Daily') return !isSameDay(dDate, targetDate);
          if (goal.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
          if (goal.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
          return true;
        });
      } else {
        completed_dates = [...completed_dates, targetDate.toISOString()];
      }
      
      await supabase
        .from('goals')
        .update({ completed_dates })
        .eq('id', id)
        .eq('user_id', user.id);
    }
  },

  async setMilestonesDone(ids: string[], done: boolean, date?: Date) {
    const user = await this.getUser();
    if (!user) return;

    for (const id of ids) {
      const { data: milestone } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!milestone) continue;

      const updates: any = {};
      if (milestone.repeat && milestone.repeat !== 'None') {
        const targetDate = date || new Date();
        const isCompleted = isCompletedOnDate(milestone, targetDate);
        let completed_dates = milestone.completed_dates || [];
        
        if (done && !isCompleted) {
          completed_dates = [...completed_dates, targetDate.toISOString()];
          updates.completed_dates = completed_dates;
        } else if (!done && isCompleted) {
          completed_dates = completed_dates.filter((d: string) => {
            const dDate = parseISO(d);
            if (milestone.repeat === 'Daily') return !isSameDay(dDate, targetDate);
            if (milestone.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
            if (milestone.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
            return true;
          });
          updates.completed_dates = completed_dates;
        }
      } else {
        if (milestone.done !== done) {
          updates.done = done;
          updates.completed_at = done ? new Date().toISOString() : null;
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('milestones')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id);
      }
    }

    // Refresh all goals to update progress
    const goals = await this.getGoals();
    for (const goal of goals) {
      this.updateGoalProgress(goal);
      await this.updateGoal(goal.id, { progress: goal.progress });
    }
  },

  async deleteMilestone(id: string) {
    const user = await this.getUser();
    if (!user) return;

    const { data: milestone } = await supabase
      .from('milestones')
      .select('goal_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const goalId = milestone?.goal_id;

    await supabase
      .from('milestones')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (goalId) {
      const goals = await this.getGoals();
      const goal = goals.find(g => g.id === goalId);
      if (goal) {
        this.updateGoalProgress(goal);
        await this.updateGoal(goal.id, { progress: goal.progress });
      }
    }
  },

  async updateMilestone(id: string, updates: Partial<Milestone>) {
    const user = await this.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('milestones')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) console.error('Error updating milestone:', error);

    // Update parent goal progress
    const { data: milestone } = await supabase
      .from('milestones')
      .select('goal_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (milestone?.goal_id) {
      const goals = await this.getGoals();
      const goal = goals.find(g => g.id === milestone.goal_id);
      if (goal) {
        this.updateGoalProgress(goal);
        await this.updateGoal(goal.id, { progress: goal.progress });
      }
    }
  },

  updateGoalProgress(goal: Goal) {
    if (!goal.milestones || goal.milestones.length === 0) {
      goal.progress = 0;
      return;
    }
    
    let totalProgress = 0;
    const milestoneShare = 100 / goal.milestones.length;
    
    goal.milestones.forEach(m => {
      if (m.repeat && m.repeat !== 'None') {
        const totalOccurrences = countTotalOccurrences(m);
        const completedOccurrences = countCompletedOccurrences(m);
        totalProgress += (Math.min(completedOccurrences, totalOccurrences) / totalOccurrences) * milestoneShare;
      } else {
        if (m.done) totalProgress += milestoneShare;
      }
    });
    
    goal.progress = Math.min(100, Math.round(totalProgress));
  },

  async getCategories(): Promise<Category[]> {
    const user = await this.getUser();
    if (!user) return DEFAULT_CATEGORIES;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching categories:', error);
      return DEFAULT_CATEGORIES;
    }

    if (!data || data.length === 0) {
      // Seed default categories if none exist
      for (const cat of DEFAULT_CATEGORIES) {
        await this.addCategory(cat);
      }
      return DEFAULT_CATEGORIES;
    }

    return data;
  },

  async addCategory(category: Category) {
    const user = await this.getUser();
    if (!user) return;

    await supabase
      .from('categories')
      .insert({
        id: category.id,
        user_id: user.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
        created_at: new Date().toISOString()
      });
  },

  async updateCategory(id: string, name: string, color: string, icon: string) {
    const user = await this.getUser();
    if (!user) return;

    await supabase
      .from('categories')
      .update({ name, color, icon })
      .eq('id', id)
      .eq('user_id', user.id);
  },

  async deleteCategory(id: string) {
    const user = await this.getUser();
    if (!user) return;

    await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
  },

  async getHabits(): Promise<Habit[]> {
    const user = await this.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching habits:', error);
      return [];
    }

    return (data || []).map(h => ({
      ...h,
      completed_dates: h.completed_dates || [],
      streak: this.calculateHabitStreak(h)
    }));
  },

  async addHabit(habit: Habit) {
    const user = await this.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('habits')
      .insert({
        id: habit.id,
        user_id: user.id,
        title: habit.title,
        category: habit.category,
        repeat: habit.repeat,
        due_date: habit.due_date || null,
        completed_dates: [],
        streak: 0,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding habit:', error);
      alert('Failed to save habit: ' + error.message);
    }
  },

  async updateHabit(id: string, updates: Partial<Habit>) {
    const user = await this.getUser();
    if (!user) return;

    await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);
  },

  async deleteHabit(id: string) {
    const user = await this.getUser();
    if (!user) return;

    await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
  },

  async toggleHabit(id: string, date?: Date) {
    const user = await this.getUser();
    if (!user) return;

    const { data: habit } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!habit) return;

    const targetDate = date || new Date();
    const isCompleted = isCompletedOnDate(habit, targetDate);
    let completed_dates = habit.completed_dates || [];
    
    if (isCompleted) {
      completed_dates = completed_dates.filter((d: string) => {
        const dDate = parseISO(d);
        if (habit.repeat === 'Daily') return !isSameDay(dDate, targetDate);
        if (habit.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
        if (habit.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
        return true;
      });
    } else {
      completed_dates = [...completed_dates, targetDate.toISOString()];
    }
    
    const streak = this.calculateHabitStreak({ ...habit, completed_dates });
    
    await supabase
      .from('habits')
      .update({ completed_dates, streak })
      .eq('id', id)
      .eq('user_id', user.id);
  },

  calculateHabitStreak(habit: Habit): number {
    if (!habit.completed_dates || habit.completed_dates.length === 0) return 0;
    if (habit.repeat !== 'Daily') return 0;

    const sortedDates = [...habit.completed_dates]
      .map(d => startOfDay(parseISO(d)).getTime())
      .sort((a, b) => b - a);
    
    const uniqueDates = Array.from(new Set(sortedDates));
    if (uniqueDates.length === 0) return 0;

    const today = startOfDay(new Date()).getTime();
    const yesterday = today - 86400000;

    if (uniqueDates[0] < yesterday) return 0;

    let streak = 0;
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        streak = 1;
        continue;
      }
      const prev = uniqueDates[i-1];
      const expected = prev - 86400000;
      if (uniqueDates[i] === expected) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
};
