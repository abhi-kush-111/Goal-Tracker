const STORAGE_KEYS = {
  GOALS: 'goalforge_goals',
  CATEGORIES: 'goalforge_categories',
};

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  done: boolean;
  due_date?: string;
  note?: string;
  completed_at?: string;
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
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
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
    return data ? JSON.parse(data) : [];
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
    goals.unshift({ ...goal, progress: 0, streak: 0, milestones: [], created_at: new Date().toISOString() });
    this.saveGoals(goals);
  },

  updateGoal(id: string, updates: Partial<Goal>) {
    const goals = this.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updates };
      // Recalculate progress in case milestones changed (though they usually don't in this call)
      const doneCount = (goals[index].milestones || []).filter(m => m.done).length;
      const totalCount = (goals[index].milestones || []).length;
      goals[index].progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
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
      goal.milestones.push({ ...milestone, done: false });
      this.updateGoalProgress(goal);
      this.saveGoals(goals);
    }
  },

  toggleMilestone(id: string) {
    const goals = this.getGoals();
    for (const goal of goals) {
      const milestone = goal.milestones?.find(m => m.id === id);
      if (milestone) {
        milestone.done = !milestone.done;
        if (milestone.done) {
          milestone.completed_at = new Date().toISOString();
        } else {
          delete milestone.completed_at;
        }
        this.updateGoalProgress(goal);
        this.saveGoals(goals);
        break;
      }
    }
  },

  setMilestonesDone(ids: string[], done: boolean) {
    const goals = this.getGoals();
    let changed = false;
    for (const goal of goals) {
      if (!goal.milestones) continue;
      let goalChanged = false;
      for (const ms of goal.milestones) {
        if (ids.includes(ms.id) && ms.done !== done) {
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
    const doneCount = goal.milestones.filter(m => m.done).length;
    goal.progress = Math.round((doneCount / goal.milestones.length) * 100);
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
  }
};
