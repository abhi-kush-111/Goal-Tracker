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

const STORAGE_KEYS = {
  GOALS: 'goalforge_goals',
  CATEGORIES: 'goalforge_categories',
  HABITS: 'goalforge_habits',
};

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
  getGoals(): Goal[] {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    let goals: Goal[] = data ? JSON.parse(data) : [];
    
    // Ensure arrays exist
    goals = goals.map(g => ({
      ...g,
      completed_dates: g.completed_dates || [],
      milestones: (g.milestones || []).map(m => ({
        ...m,
        completed_dates: m.completed_dates || []
      }))
    }));

    return goals;
  },

  saveGoals(goals: Goal[]) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  getCategories(): Category[] {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!data) {
      this.saveCategories(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    return JSON.parse(data);
  },

  saveCategories(categories: Category[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  addGoal(goal: Goal) {
    const goals = this.getGoals();
    goals.unshift({ ...goal, progress: 0, streak: 0, milestones: [], created_at: new Date().toISOString(), completed_dates: [] });
    this.saveGoals(goals);
  },

  updateGoal(id: string, updates: Partial<Goal>) {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      this.updateGoalProgress(goals[index]);
      this.saveGoals(goals);
    }
  },

  deleteGoal(id: string) {
    const goals = this.getGoals().filter(g => g.id !== id);
    this.saveGoals(goals);
  },

  addMilestone(milestone: Milestone) {
    const goals = this.getGoals();
    const goal = goals.find(g => g.id === milestone.goal_id);
    if (goal) {
      if (!goal.milestones) goal.milestones = [];
      goal.milestones.push({ ...milestone, done: false, created_at: new Date().toISOString(), completed_dates: [] });
      this.updateGoalProgress(goal);
      this.saveGoals(goals);
    }
  },

  toggleMilestone(id: string, date?: Date) {
    const goals = this.getGoals();
    for (const goal of goals) {
      const milestone = goal.milestones?.find(m => m.id === id);
      if (milestone) {
        if (milestone.repeat && milestone.repeat !== 'None') {
          const targetDate = date || new Date();
          const isCompleted = isCompletedOnDate(milestone, targetDate);
          if (isCompleted) {
            milestone.completed_dates = (milestone.completed_dates || []).filter(d => {
              const dDate = parseISO(d);
              if (milestone.repeat === 'Daily') return !isSameDay(dDate, targetDate);
              if (milestone.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
              if (milestone.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
              return true;
            });
          } else {
            milestone.completed_dates = [...(milestone.completed_dates || []), targetDate.toISOString()];
          }
        } else {
          milestone.done = !milestone.done;
          if (milestone.done) {
            milestone.completed_at = new Date().toISOString();
          } else {
            delete milestone.completed_at;
          }
        }
        this.updateGoalProgress(goal);
        this.saveGoals(goals);
        break;
      }
    }
  },

  toggleGoalCompletion(id: string, date?: Date) {
    const goals = this.getGoals();
    const goal = goals.find(g => g.id === id);
    if (goal && goal.repeat && goal.repeat !== 'None') {
      const targetDate = date || new Date();
      const isCompleted = isCompletedOnDate(goal, targetDate);
      if (isCompleted) {
        goal.completed_dates = (goal.completed_dates || []).filter(d => {
          const dDate = parseISO(d);
          if (goal.repeat === 'Daily') return !isSameDay(dDate, targetDate);
          if (goal.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
          if (goal.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
          return true;
        });
      } else {
        goal.completed_dates = [...(goal.completed_dates || []), targetDate.toISOString()];
      }
      this.saveGoals(goals);
    }
  },

  setMilestonesDone(ids: string[], done: boolean, date?: Date) {
    const goals = this.getGoals();
    let changed = false;
    for (const goal of goals) {
      if (!goal.milestones) continue;
      let goalChanged = false;
      for (const ms of goal.milestones) {
        if (ids.includes(ms.id)) {
          if (ms.repeat && ms.repeat !== 'None') {
            const targetDate = date || new Date();
            const isCompleted = isCompletedOnDate(ms, targetDate);
            if (done && !isCompleted) {
              ms.completed_dates = [...(ms.completed_dates || []), targetDate.toISOString()];
              goalChanged = true;
              changed = true;
            } else if (!done && isCompleted) {
              ms.completed_dates = (ms.completed_dates || []).filter(d => {
                const dDate = parseISO(d);
                if (ms.repeat === 'Daily') return !isSameDay(dDate, targetDate);
                if (ms.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
                if (ms.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
                return true;
              });
              goalChanged = true;
              changed = true;
            }
          } else {
            if (ms.done !== done) {
              ms.done = done;
              if (done) {
                ms.completed_at = new Date().toISOString();
              } else {
                delete ms.completed_at;
              }
              goalChanged = true;
              changed = true;
            }
          }
        }
      }
      if (goalChanged) {
        this.updateGoalProgress(goal);
      }
    }
    if (changed) {
      this.saveGoals(goals);
    }
  },

  deleteMilestone(id: string) {
    const goals = this.getGoals();
    for (const goal of goals) {
      const index = goal.milestones?.findIndex(m => m.id === id);
      if (index !== undefined && index !== -1) {
        goal.milestones.splice(index, 1);
        this.updateGoalProgress(goal);
        this.saveGoals(goals);
        break;
      }
    }
  },

  updateMilestone(id: string, updates: Partial<Milestone>) {
    const goals = this.getGoals();
    for (const goal of goals) {
      const milestone = goal.milestones?.find(m => m.id === id);
      if (milestone) {
        Object.assign(milestone, updates);
        this.updateGoalProgress(goal);
        this.saveGoals(goals);
        break;
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
        // Progress for this milestone is (completed / total) * its share of the goal
        totalProgress += (Math.min(completedOccurrences, totalOccurrences) / totalOccurrences) * milestoneShare;
      } else {
        if (m.done) totalProgress += milestoneShare;
      }
    });
    
    goal.progress = Math.min(100, Math.round(totalProgress));
  },

  addCategory(category: Category) {
    const categories = this.getCategories();
    categories.push(category);
    this.saveCategories(categories);
  },

  updateCategory(id: string, name: string, color: string, icon: string) {
    const categories = this.getCategories();
    const cat = categories.find(c => c.id === id);
    if (cat) {
      const oldName = cat.name;
      cat.name = name;
      cat.color = color;
      cat.icon = icon;
      this.saveCategories(categories);

      // Update goals that use this category
      if (oldName !== name) {
        const goals = this.getGoals();
        goals.forEach(g => {
          if (g.category === oldName) g.category = name;
        });
        this.saveGoals(goals);
      }
    }
  },

  deleteCategory(id: string) {
    const categories = this.getCategories().filter(c => c.id !== id);
    this.saveCategories(categories);
  },

  // --- Habits ---
  getHabits(): Habit[] {
    const data = localStorage.getItem(STORAGE_KEYS.HABITS);
    let habits: Habit[] = data ? JSON.parse(data) : [];
    return habits.map(h => ({
      ...h,
      completed_dates: h.completed_dates || [],
      streak: this.calculateHabitStreak(h)
    }));
  },

  saveHabits(habits: Habit[]) {
    localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(habits));
  },

  addHabit(habit: Habit) {
    const habits = this.getHabits();
    habits.unshift({ 
      ...habit, 
      created_at: new Date().toISOString(), 
      completed_dates: [],
      streak: 0 
    });
    this.saveHabits(habits);
  },

  updateHabit(id: string, updates: Partial<Habit>) {
    const habits = this.getHabits();
    const index = habits.findIndex(h => h.id === id);
    if (index !== -1) {
      habits[index] = { ...habits[index], ...updates };
      this.saveHabits(habits);
    }
  },

  deleteHabit(id: string) {
    const habits = this.getHabits().filter(h => h.id !== id);
    this.saveHabits(habits);
  },

  toggleHabit(id: string, date?: Date) {
    const habits = this.getHabits();
    const habit = habits.find(h => h.id === id);
    if (habit) {
      const targetDate = date || new Date();
      const isCompleted = isCompletedOnDate(habit, targetDate);
      if (isCompleted) {
        habit.completed_dates = (habit.completed_dates || []).filter(d => {
          const dDate = parseISO(d);
          if (habit.repeat === 'Daily') return !isSameDay(dDate, targetDate);
          if (habit.repeat === 'Weekly') return !isSameWeek(dDate, targetDate);
          if (habit.repeat === 'Monthly') return !isSameMonth(dDate, targetDate);
          return true;
        });
      } else {
        habit.completed_dates = [...(habit.completed_dates || []), targetDate.toISOString()];
      }
      habit.streak = this.calculateHabitStreak(habit);
      this.saveHabits(habits);
    }
  },

  calculateHabitStreak(habit: Habit): number {
    if (!habit.completed_dates || habit.completed_dates.length === 0) return 0;
    if (habit.repeat !== 'Daily') return 0; // Streak only for daily for now

    const sortedDates = [...habit.completed_dates]
      .map(d => startOfDay(parseISO(d)).getTime())
      .sort((a, b) => b - a);
    
    const uniqueDates = Array.from(new Set(sortedDates));
    if (uniqueDates.length === 0) return 0;

    const today = startOfDay(new Date()).getTime();
    const yesterday = today - 86400000;

    // If not completed today or yesterday, streak is broken
    if (uniqueDates[0] < yesterday) return 0;

    let streak = 0;
    let current = uniqueDates[0];

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
