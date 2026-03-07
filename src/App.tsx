import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Calendar, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  MoreVertical,
  ArrowLeft,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Award,
  Settings,
  Eye,
  EyeOff,
  GripVertical,
  Menu,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  DndContext, 
  useDraggable, 
  useDroppable, 
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  format, 
  differenceInDays, 
  isPast, 
  isToday, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { storage, type Goal, type Category, type Milestone } from './storage';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const uid = () => Math.random().toString(36).slice(2, 11);

const isValidDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

// --- Types ---
// Types are now imported from storage.ts

const PRIORITY_COLORS = {
  High: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

// --- Components ---

const DraggableMilestone = ({ milestone, goalTitle }: { milestone: Milestone, goalTitle: string, key?: React.Key }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: milestone.id,
    data: { milestone, goalTitle }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "p-2 md:p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-grab active:cursor-grabbing hover:border-white/10 transition-colors mb-2",
        isDragging && "opacity-50 border-emerald-500/50 bg-emerald-500/5 z-50"
      )}
    >
      <div className="flex items-center gap-1 md:gap-2">
        <GripVertical className="w-3 h-3 text-slate-600" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-xs font-bold text-white truncate">{milestone.title}</p>
          <p className="text-[8px] md:text-[10px] text-slate-500 truncate">{goalTitle}</p>
        </div>
      </div>
    </div>
  );
};

const DraggableCalendarMilestone = ({ milestone, goalTitle }: { milestone: Milestone, goalTitle: string, key?: React.Key }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: milestone.id,
    data: { milestone, goalTitle }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "px-1 md:px-2 py-0.5 md:py-1 rounded bg-emerald-500/10 border border-emerald-500/20 cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 border-emerald-500/50 bg-emerald-500/5 z-50"
      )}
    >
      <p className="text-[8px] md:text-[9px] font-bold text-emerald-500 truncate leading-tight">{milestone.title}</p>
    </div>
  );
};

const DroppableDay = ({ day, isCurrentMonth, milestones }: { day: Date, isCurrentMonth: boolean, milestones: any[], key?: React.Key }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] md:min-h-[140px] p-1.5 md:p-3 rounded-xl border transition-all duration-200 flex flex-col",
        !isCurrentMonth && "opacity-20",
        isOver ? "bg-emerald-500/10 border-emerald-500/50 scale-[1.02] z-10" : "bg-white/[0.02] border-white/5",
        isToday(day) && "border-emerald-500/30"
      )}
    >
      <div className="flex justify-between items-start mb-1 md:mb-2">
        <span className={cn("text-[10px] md:text-xs font-bold", isToday(day) ? "text-emerald-500" : "text-slate-500")}>
          {format(day, 'd')}
        </span>
        {milestones.length > 0 && (
          <span className="text-[8px] md:text-[10px] font-bold text-slate-600 px-1 md:px-1.5 py-0.5 bg-white/5 rounded">
            {milestones.length}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-1 md:space-y-1.5 overflow-hidden">
        {milestones.slice(0, 4).map(ms => (
          <DraggableCalendarMilestone key={ms.id} milestone={ms} goalTitle={ms.goalTitle} />
        ))}
        {milestones.length > 4 && (
          <p className="text-[8px] md:text-[9px] text-slate-600 font-bold text-center">+{milestones.length - 4} more</p>
        )}
      </div>
    </div>
  );
};

const AssignTasksView = ({ goals, onClose }: { goals: Goal[], onClose: () => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [localGoals, setLocalGoals] = useState(goals);
  const [activeId, setActiveId] = useState<string | null>(null);

  const allUnassignedMilestones = useMemo(() => {
    return localGoals.flatMap(g => 
      (g.milestones || [])
        .filter(m => !m.due_date && !m.done)
        .map(m => ({ ...m, goalTitle: g.title }))
    );
  }, [localGoals]);

  const allAssignedMilestones = useMemo(() => {
    return localGoals.flatMap(g => 
      (g.milestones || [])
        .filter(m => m.due_date)
        .map(m => ({ ...m, goalTitle: g.title }))
    );
  }, [localGoals]);

  const activeMilestone = useMemo(() => {
    if (!activeId) return null;
    return allUnassignedMilestones.find(m => m.id === activeId) || allAssignedMilestones.find(m => m.id === activeId);
  }, [activeId, allUnassignedMilestones, allAssignedMilestones]);

  const handleDragStart = (event: { active: { id: string } }) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id) {
      const milestoneId = active.id as string;
      const targetId = over.id as string;
      
      let newDate: string | null = null;
      if (targetId !== 'unassigned') {
        newDate = targetId;
      }
      
      // Update storage
      storage.updateMilestone(milestoneId, { due_date: newDate });
      
      // Update local state for immediate feedback
      setLocalGoals(prev => prev.map(g => ({
        ...g,
        milestones: g.milestones.map(m => 
          m.id === milestoneId ? { ...m, due_date: newDate } : m
        )
      })));
    }
  };

  const { isOver: isUnassignedOver, setNodeRef: setUnassignedNodeRef } = useDroppable({
    id: 'unassigned',
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="p-2 md:p-6 w-full max-w-[100vw] lg:max-w-[98vw] mx-auto h-[calc(100vh-60px)] md:h-[calc(100vh-40px)] flex flex-col"
      >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-1">Assign Tasks</h2>
            <p className="text-slate-500 text-xs md:text-sm">Drag unassigned milestones onto the calendar.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex items-center justify-between gap-4 bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs md:text-sm font-bold text-white min-w-[120px] md:min-w-[140px] text-center uppercase tracking-widest">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="px-4 md:px-8 py-2 md:py-2.5 bg-emerald-500 text-[#052e1a] rounded-xl font-bold text-xs md:text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 text-center"
            >
              Save & Close
            </button>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6 min-h-0">
          {/* Sidebar: Unassigned Tasks */}
          <Card className={cn("lg:col-span-1 flex flex-col h-[200px] lg:h-auto min-h-0 transition-colors", isUnassignedOver && "bg-white/[0.05] border-white/20")}>
            <div className="p-3 md:p-4 border-bottom border-white/5 bg-white/[0.02]">
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Unassigned Milestones</h3>
            </div>
            <div ref={setUnassignedNodeRef} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3 custom-scrollbar">
              {allUnassignedMilestones.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-emerald-500/20 mb-2" />
                  <p className="text-slate-600 text-[10px] md:text-xs italic">All milestones are assigned or completed!</p>
                </div>
              ) : (
                allUnassignedMilestones.map(ms => (
                  <DraggableMilestone key={ms.id} milestone={ms} goalTitle={ms.goalTitle} />
                ))
              )}
            </div>
          </Card>

          {/* Main: Calendar Grid */}
          <Card className="lg:col-span-4 p-2 md:p-6 flex flex-col min-h-0 overflow-hidden">
            <div className="grid grid-cols-7 mb-2 md:mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-slate-500 py-1 md:py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 md:pr-2">
              <div className="grid grid-cols-7 gap-1 md:gap-3">
                {calendarDays.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayMilestones = allAssignedMilestones.filter(m => m.due_date === dayStr);
                  return (
                    <DroppableDay 
                      key={dayStr} 
                      day={day} 
                      isCurrentMonth={isSameMonth(day, monthStart)} 
                      milestones={dayMilestones}
                    />
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId && activeMilestone ? (
          <div className="p-2 md:p-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 shadow-xl shadow-emerald-500/20 pointer-events-none">
            <p className="text-[10px] md:text-xs font-bold text-white truncate">{activeMilestone.title}</p>
            <p className="text-[8px] md:text-[10px] text-slate-500 truncate">{activeMilestone.goalTitle}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const Card = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number, key?: React.Key }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={cn("bg-[#111827] border border-white/5 rounded-2xl overflow-hidden", className)}
  >
    {children}
  </motion.div>
);

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", className)}>
    {children}
  </span>
);

type WidgetId = 'stats' | 'progress' | 'categories' | 'focus' | 'goals' | 'trends';

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  label: string;
}

export default function App() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<'dash' | 'detail' | 'categories' | 'calendar' | 'goals' | 'assign-tasks'>('dash');
  const [isCustomizingLayout, setIsCustomizingLayout] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState<WidgetConfig[]>(() => {
    const defaultLayout: WidgetConfig[] = [
      { id: 'stats', visible: true, label: 'Quick Stats' },
      { id: 'progress', visible: true, label: 'Goal Progress' },
      { id: 'trends', visible: true, label: 'Historical Trends' },
      { id: 'categories', visible: true, label: 'Category Breakdown' },
      { id: 'focus', visible: true, label: "Today's Focus" },
    ];

    const saved = localStorage.getItem('forge_dashboard_layout');
    if (saved) {
      try {
        const parsed: WidgetConfig[] = JSON.parse(saved);
        // Merge saved with default to ensure new widgets are added
        const merged = [...parsed];
        defaultLayout.forEach(def => {
          if (!merged.find(m => m.id === def.id)) {
            merged.push(def);
          }
        });
        return merged;
      } catch (e) {
        return defaultLayout;
      }
    }
    return defaultLayout;
  });

  useEffect(() => {
    localStorage.setItem('forge_dashboard_layout', JSON.stringify(dashboardLayout));
  }, [dashboardLayout]);

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form states
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: '',
    priority: 'Medium' as const,
    deadline: '',
    note: ''
  });
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    due_date: '',
    note: '',
    goal_id: ''
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#10b981', icon: '🎯' });

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchCategories();
    setLoading(false);
  }, []);

  const trendData = useMemo(() => {
    // Generate last 7 days of data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return format(d, 'MMM dd');
    });

    const completionCounts = last7Days.map(day => {
      const count = goals.reduce((acc, goal) => {
        const completedMilestones = goal.milestones?.filter(m => 
          m.done && m.completed_at && format(parseISO(m.completed_at), 'MMM dd') === day
        ).length || 0;
        return acc + completedMilestones;
      }, 0);
      
      return { name: day, completions: count };
    });

    return completionCounts;
  }, [goals]);

  const productivityInsights = useMemo(() => {
    const totalCompletions = trendData.reduce((sum, d) => sum + d.completions, 0);
    const avgCompletions = totalCompletions / trendData.length;
    const peakDay = [...trendData].sort((a, b) => b.completions - a.completions)[0];
    
    let insight = "Keep pushing! Completing milestones consistently builds momentum.";
    if (totalCompletions > 5) insight = "You're on a roll! Your productivity is trending upwards.";
    if (avgCompletions > 1) insight = "Great consistency! You're averaging more than one milestone per day.";
    
    return {
      total: totalCompletions,
      avg: avgCompletions.toFixed(1),
      peak: peakDay.name,
      peakValue: peakDay.completions,
      message: insight
    };
  }, [trendData]);

  const fetchGoals = () => {
    const data = storage.getGoals();
    setGoals(data);
  };

  const fetchCategories = () => {
    const data = storage.getCategories();
    setCategories(data);
    if (data.length > 0) {
      setNewGoal(prev => ({ ...prev, category: prev.category || data[0].name }));
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    storage.addCategory({ ...newCategory, id: uid() });
    setIsAddingCategory(false);
    setNewCategory({ name: '', color: '#10b981', icon: '🎯' });
    fetchCategories();
  };

  const handleEditCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    storage.updateCategory(editingCategory.id, editingCategory.name, editingCategory.color, editingCategory.icon);
    setEditingCategory(null);
    fetchCategories();
    fetchGoals(); // Goals might have updated category names
  };

  const handleDeleteCategory = (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Goals using it will remain but won't have a valid category.")) return;
    storage.deleteCategory(id);
    fetchCategories();
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;

    if (editingGoal) {
      storage.updateGoal(editingGoal.id, newGoal);
      setEditingGoal(null);
    } else {
      const id = uid();
      storage.addGoal({ 
        ...newGoal, 
        id, 
        progress: 0, 
        streak: 0, 
        milestones: [] 
      });
    }
    setIsAddingGoal(false);
    setNewGoal({ title: '', category: categories[0]?.name || 'Health', priority: 'Medium', deadline: '', note: '' });
    fetchGoals();
  };

  const handleDeleteGoal = (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    storage.deleteGoal(id);
    if (activeGoalId === id) {
      setView('goals');
      setActiveGoalId(null);
    }
    fetchGoals();
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const targetGoalId = activeGoalId || newMilestone.goal_id;
    if (!newMilestone.title || !targetGoalId) return;

    storage.addMilestone({ 
      ...newMilestone, 
      goal_id: targetGoalId, 
      id: uid(), 
      done: false 
    });
    setIsAddingMilestone(false);
    setNewMilestone({ title: '', due_date: '', note: '', goal_id: '' });
    fetchGoals();
  };

  const toggleMilestone = (id: string) => {
    storage.toggleMilestone(id);
    fetchGoals();
  };

  const handleMarkAllDone = (ids: string[]) => {
    storage.setMilestonesDone(ids, true);
    fetchGoals();
  };

  const deleteMilestone = (id: string) => {
    storage.deleteMilestone(id);
    fetchGoals();
  };

  const activeGoal = useMemo(() => goals.find(g => g.id === activeGoalId), [goals, activeGoalId]);

  const stats = useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(g => g.progress === 100).length;
    const avgProgress = total ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / total) : 0;
    const totalMilestones = goals.reduce((acc, g) => acc + (g.milestones || []).length, 0);
    const completedMilestones = goals.reduce((acc, g) => acc + (g.milestones || []).filter(m => m.done === 1 || m.done === true).length, 0);
    
    return { total, completed, avgProgress, totalMilestones, completedMilestones };
  }, [goals]);

  const chartData = useMemo(() => {
    return goals.map(g => ({
      name: g.title.length > 15 ? g.title.substring(0, 12) + '...' : g.title,
      progress: g.progress,
      color: (categories.find(c => c.name === g.category) || { color: '#64748b' }).color
    })).slice(0, 8);
  }, [goals]);

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    goals.forEach(g => {
      counts[g.category] = (counts[g.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: (categories.find(c => c.name === name) || { color: '#64748b' }).color
    }));
  }, [goals]);

  const allMilestones = useMemo(() => {
    const ms: (Milestone & { goalTitle: string, categoryColor: string, goalId: string })[] = [];
    goals.forEach(g => {
      const cat = categories.find(c => c.name === g.category) || { color: '#64748b' };
      (g.milestones || []).forEach(m => {
        ms.push({ ...m, goalTitle: g.title, categoryColor: cat.color, goalId: g.id });
      });
    });
    return ms;
  }, [goals, categories]);

  const milestonesForSelectedDate = useMemo(() => {
    return allMilestones.filter(m => m.due_date && isSameDay(parseISO(m.due_date), selectedDate));
  }, [allMilestones, selectedDate]);

  const todayMilestones = useMemo(() => {
    return allMilestones.filter(m => m.due_date && isToday(parseISO(m.due_date)));
  }, [allMilestones]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1020]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0c1020] font-sans selection:bg-emerald-500/30">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 border-r border-white/5 bg-[#0a0e1a] flex flex-col h-screen z-50 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-bottom border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Target className="text-[#052e1a] w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Goal<span className="text-emerald-500">Forge</span>
            </h1>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => { setView('dash'); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              view === 'dash' ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm font-semibold">Dashboard</span>
          </button>
          <button 
            onClick={() => { setView('goals'); setActiveGoalId(null); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              view === 'goals' ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <Target className="w-4 h-4" />
            <span className="text-sm font-semibold">Goals</span>
          </button>
          <button 
            onClick={() => { setView('categories'); setActiveGoalId(null); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              view === 'categories' ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-semibold">Categories</span>
          </button>
          <button 
            onClick={() => { setView('calendar'); setActiveGoalId(null); setIsMobileMenuOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
              view === 'calendar' ? "bg-emerald-500/10 text-emerald-500" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold">Calendar</span>
          </button>
          
          <div className="pt-6 pb-2 px-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">My Goals</p>
          </div>

          {goals.map((goal) => {
            const cat = categories.find(c => c.name === goal.category) || { color: '#64748b', icon: '⚡' };
            const isActive = activeGoalId === goal.id && view === 'detail';
            
            return (
              <button 
                key={goal.id}
                onClick={() => {
                  setActiveGoalId(goal.id);
                  setView('detail');
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                  isActive ? "bg-white/5 text-white" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium truncate flex-1 text-left">{goal.title}</span>
                <span className="text-[10px] font-mono opacity-50">{goal.progress}%</span>
                {isActive && <motion.div layoutId="active-pill" className="absolute left-0 w-1 h-4 bg-emerald-500 rounded-full" />}
              </button>
            );
          })}

          <button 
            onClick={() => { setIsAddingGoal(true); setIsMobileMenuOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-emerald-500/5 hover:text-emerald-500 transition-all duration-200 mt-4 border border-dashed border-white/5 hover:border-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold">New Goal</span>
          </button>
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/60">Overall</span>
              <span className="text-sm font-bold text-emerald-500">{stats.avgProgress}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${stats.avgProgress}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen custom-scrollbar flex flex-col relative w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0e1a] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Target className="text-[#052e1a] w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Goal<span className="text-emerald-500">Forge</span>
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {view === 'dash' ? (
            <motion.div 
              key="dash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-6xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">Dashboard</h2>
                  <p className="text-slate-400 text-sm">Welcome back. You have <span className="text-emerald-500 font-bold">{goals.filter(g => g.progress < 100).length}</span> active goals.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <button 
                    onClick={() => setIsCustomizingLayout(true)}
                    className="p-2 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors"
                    title="Customize Layout"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <div className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-300">{format(currentDate, 'EEEE, MMM do')}</span>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-2">
                {dashboardLayout.filter(w => w.visible).map((widget) => {
                  switch (widget.id) {
                    case 'stats':
                      return (
                        <div key="stats" className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                          {[
                            { label: 'Total Goals', value: stats.total, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                            { label: 'Completed', value: stats.completed, icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                            { label: 'Avg Progress', value: stats.avgProgress + '%', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                            { label: 'Milestones', value: `${stats.completedMilestones}/${stats.totalMilestones}`, icon: CheckCircle2, color: 'text-sky-400', bg: 'bg-sky-400/10' },
                          ].map((stat, i) => (
                            <Card key={stat.label} delay={i * 0.05} className="p-6">
                              <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                              </div>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                              <h3 className="text-2xl font-extrabold text-white font-mono">{stat.value}</h3>
                            </Card>
                          ))}
                        </div>
                      );
                    case 'progress':
                      return (
                        <Card key="progress" className="lg:col-span-2 p-8 mb-8" delay={0.2}>
                          <div className="flex justify-between items-center mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Goal Progress</h3>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Percentage</span>
                            </div>
                          </div>
                          <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600 }}
                                  dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                  contentStyle={{ 
                                    backgroundColor: '#1f2937', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: '#fff'
                                  }}
                                />
                                <Bar dataKey="progress" radius={[6, 6, 0, 0]} barSize={32}>
                                  {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      );
                    case 'categories':
                      return (
                        <Card key="categories" className="lg:col-span-1 p-8 mb-8" delay={0.25}>
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8">Categories</h3>
                          <div className="h-[200px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={categoryData}
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={8}
                                  dataKey="value"
                                >
                                  {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-2xl font-bold text-white">{stats.total}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Total</span>
                            </div>
                          </div>
                          <div className="mt-6 space-y-2">
                            {categoryData.map((cat) => (
                              <div key={cat.name} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span className="text-xs font-medium text-slate-400">{cat.name}</span>
                                </div>
                                <span className="text-xs font-bold text-white">{cat.value}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      );
                    case 'trends':
                      return (
                        <Card key="trends" className="lg:col-span-2 p-8 mb-8" delay={0.2}>
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Historical Trends</h3>
                              <p className="text-xs text-slate-400 mt-1">Milestone completion over the last 7 days</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-bold">+{productivityInsights.total} this week</span>
                            </div>
                          </div>
                          
                          <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={trendData}>
                                <defs>
                                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis 
                                  dataKey="name" 
                                  stroke="#64748b" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false}
                                  dy={10}
                                />
                                <YAxis 
                                  stroke="#64748b" 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false}
                                  allowDecimals={false}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: '#111827', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                  }}
                                  itemStyle={{ color: '#10b981' }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="completions" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  fillOpacity={1} 
                                  fill="url(#colorCompletions)" 
                                  animationDuration={1500}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-white/5">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Peak Performance</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-white">{productivityInsights.peak}</span>
                                <span className="text-xs text-emerald-400">{productivityInsights.peakValue} completions</span>
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Daily Average</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-white">{productivityInsights.avg}</span>
                                <span className="text-xs text-slate-400">milestones/day</span>
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 col-span-full md:col-span-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1">Productivity Insight</p>
                              <p className="text-xs text-emerald-200 leading-relaxed">
                                {productivityInsights.message}
                              </p>
                            </div>
                          </div>
                        </Card>
                      );
                    case 'focus':
                      return (
                        <Card key="focus" className="lg:col-span-1 p-8 mb-8" delay={0.3}>
                          <div className="flex justify-between items-center mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Today's Focus</h3>
                            <button 
                              onClick={() => { setView('calendar'); setSelectedDate(new Date()); setActiveGoalId(null); }}
                              className="text-[10px] font-bold text-emerald-500 hover:underline uppercase tracking-widest"
                            >
                              Calendar
                            </button>
                          </div>
                          <div className="space-y-4">
                            {todayMilestones.length === 0 ? (
                              <div className="py-10 text-center border border-dashed border-white/5 rounded-2xl">
                                <p className="text-slate-600 text-xs italic">No milestones for today.</p>
                              </div>
                            ) : (
                              todayMilestones.slice(0, 4).map(ms => (
                                <div key={ms.id} className="flex items-center gap-3 group">
                                  <button 
                                    onClick={() => toggleMilestone(ms.id)}
                                    className={cn(
                                      "w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200",
                                      ms.done ? "bg-emerald-500 text-[#052e1a]" : "border-2 border-slate-700 hover:border-slate-500"
                                    )}
                                  >
                                    {ms.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-xs font-bold truncate", ms.done ? "text-slate-600 line-through" : "text-slate-200")}>
                                      {ms.title}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold truncate">{ms.goalTitle}</p>
                                  </div>
                                </div>
                              ))
                            )}
                            {todayMilestones.length > 4 && (
                              <p className="text-[10px] text-slate-500 font-bold italic text-center">+{todayMilestones.length - 4} more today</p>
                            )}
                          </div>
                        </Card>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            </motion.div>
          ) : view === 'goals' ? (
            <motion.div 
              key="goals"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-6xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">Manage Goals</h2>
                  <p className="text-slate-400 text-sm">You have <span className="text-emerald-500 font-bold">{goals.length}</span> goals in total.</p>
                </div>
                <button 
                  onClick={() => setIsAddingGoal(true)}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-[#052e1a] rounded-2xl font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Create New Goal
                </button>
              </header>

              {goals.length === 0 ? (
                <div className="py-32 text-center border border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No goals found</h3>
                  <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">Start by creating your first goal to track your progress and achieve your dreams.</p>
                  <button 
                    onClick={() => setIsAddingGoal(true)}
                    className="px-8 py-3 bg-emerald-500 text-[#052e1a] rounded-2xl font-bold text-sm hover:bg-emerald-400 transition-colors"
                  >
                    Create First Goal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {goals.map((goal, i) => {
                    const cat = categories.find(c => c.name === goal.category) || { color: '#64748b', icon: '⚡' };
                    return (
                      <motion.div 
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group bg-[#111827] border border-white/5 rounded-[32px] p-6 flex flex-col hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                              {cat.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={PRIORITY_COLORS[goal.priority]}>{goal.priority}</Badge>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{goal.category}</span>
                              </div>
                              <h4 className="text-lg font-bold text-white truncate max-w-[200px]">{goal.title}</h4>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGoal(goal);
                                setNewGoal({
                                  title: goal.title,
                                  category: goal.category,
                                  priority: goal.priority,
                                  deadline: goal.deadline || '',
                                  note: goal.note || ''
                                });
                                setIsAddingGoal(true);
                              }}
                              className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
                              title="Edit Goal"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveGoalId(goal.id);
                                setView('detail');
                              }}
                              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGoal(goal.id);
                              }}
                              className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <div className="text-2xl font-black text-white font-mono leading-none">{goal.progress}%</div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Progress</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-slate-300">
                                {(goal.milestones || []).filter(m => m.done).length}/{(goal.milestones || []).length}
                              </div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Milestones</div>
                            </div>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${goal.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full" 
                              style={{ backgroundColor: cat.color, boxShadow: `0 0 10px ${cat.color}40` }} 
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-6 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                            <Calendar className="w-3 h-3" />
                            {isValidDate(goal.deadline) ? format(new Date(goal.deadline!), 'MMM d, yyyy') : 'No deadline'}
                          </div>
                          <button 
                            onClick={() => {
                              setActiveGoalId(goal.id);
                              setView('detail');
                            }}
                            className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline"
                          >
                            Manage Milestones
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : view === 'detail' ? (
            <motion.div 
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-5xl mx-auto w-full"
            >
              {activeGoal ? (
                <>
                  <button 
                    onClick={() => setView('goals')}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 md:mb-8 group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Goals</span>
                  </button>

                  <div className="flex flex-col lg:flex-row gap-10">
                    <div className="flex-1">
                      <header className="mb-10">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-4xl">{categories.find(c => c.name === activeGoal.category)?.icon || '🎯'}</span>
                          <Badge className={PRIORITY_COLORS[activeGoal.priority]}>{activeGoal.priority} Priority</Badge>
                          <Badge className="text-emerald-400 bg-emerald-400/10 border-emerald-400/20">{activeGoal.category}</Badge>
                        </div>
                        <h2 className="text-4xl font-extrabold text-white tracking-tight mb-4">{activeGoal.title}</h2>
                        {activeGoal.note && <p className="text-slate-400 text-lg leading-relaxed italic border-l-2 border-white/10 pl-6">{activeGoal.note}</p>}
                      </header>

                      <div className="space-y-8">
                        <div>
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Milestones</h3>
                            <button 
                              onClick={() => setIsAddingMilestone(true)}
                              className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Add Milestone
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(activeGoal.milestones || []).length === 0 ? (
                              <div className="py-12 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                                <p className="text-slate-500 text-sm">No milestones yet. Break down your goal into smaller steps.</p>
                              </div>
                            ) : (
                              (activeGoal.milestones || []).map((ms) => (
                                <div 
                                  key={ms.id}
                                  className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                                    ms.done === 1 || ms.done === true 
                                      ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                                      : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                  )}
                                >
                                  <button 
                                    onClick={() => toggleMilestone(ms.id)}
                                    className={cn(
                                      "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200",
                                      ms.done === 1 || ms.done === true ? "bg-emerald-500 text-[#052e1a]" : "border-2 border-slate-700 hover:border-slate-500"
                                    )}
                                  >
                                    {(ms.done === 1 || ms.done === true) && <CheckCircle2 className="w-4 h-4" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <h5 className={cn("text-sm font-bold truncate", (ms.done === 1 || ms.done === true) ? "text-slate-400 line-through" : "text-white")}>
                                      {ms.title}
                                    </h5>
                                    {ms.due_date && isValidDate(ms.due_date) && (
                                      <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Due {format(new Date(ms.due_date), 'MMM d')}</p>
                                    )}
                                  </div>
                                  <button 
                                    onClick={() => deleteMilestone(ms.id)}
                                    className="p-2 text-slate-600 hover:text-rose-400 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full lg:w-80 space-y-6">
                      <Card className="p-8 text-center">
                        <div className="relative inline-block mb-6">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle
                              cx="64"
                              cy="64"
                              r="58"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              className="text-white/5"
                            />
                            <motion.circle
                              cx="64"
                              cy="64"
                              r="58"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={364.4}
                              initial={{ strokeDashoffset: 364.4 }}
                              animate={{ strokeDashoffset: 364.4 - (364.4 * activeGoal.progress) / 100 }}
                              className="text-emerald-500"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-white font-mono">{activeGoal.progress}%</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Done</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Status</span>
                            <span className={cn("font-bold", activeGoal.progress === 100 ? "text-emerald-500" : "text-amber-400")}>
                              {activeGoal.progress === 100 ? 'Completed' : 'In Progress'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Deadline</span>
                            <span className="text-white font-bold">
                              {isValidDate(activeGoal.deadline) ? format(new Date(activeGoal.deadline!), 'MMM d, yyyy') : 'None'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Streak</span>
                            <span className="text-orange-400 font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {activeGoal.streak} Days
                            </span>
                          </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5">
                          <button 
                            onClick={() => handleDeleteGoal(activeGoal.id)}
                            className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/10 transition-colors"
                          >
                            Delete Goal
                          </button>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Insights</h4>
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white mb-0.5">Momentum</p>
                              <p className="text-[10px] text-slate-500 leading-relaxed">
                                {activeGoal.progress > 50 ? "You're past the halfway mark! Keep the momentum going." : "Early stages. Consistency is key right now."}
                              </p>
                            </div>
                          </div>
                          {isValidDate(activeGoal.deadline) && isPast(new Date(activeGoal.deadline!)) && activeGoal.progress < 100 && (
                            <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5 text-rose-400" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-rose-400 mb-0.5">Overdue</p>
                                <p className="text-[10px] text-slate-500 leading-relaxed">The target date has passed. Consider adjusting your timeline.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-slate-500">Goal not found.</p>
                </div>
              )}
            </motion.div>
          ) : view === 'categories' ? (
            <motion.div 
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-4xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">Categories</h2>
                  <p className="text-slate-400 text-sm">Manage your goal categories.</p>
                </div>
                <button 
                  onClick={() => setIsAddingCategory(true)}
                  className="w-full md:w-auto px-4 py-2 bg-emerald-500 text-[#052e1a] rounded-xl font-bold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Category
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(cat => (
                  <Card key={cat.id} className="p-6 flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-bold text-lg">{cat.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">{cat.color}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingCategory(cat)}
                        className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : view === 'calendar' ? (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-6xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">Calendar</h2>
                  <p className="text-slate-500 font-medium">Track your daily milestones and achievements.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                  <button 
                    onClick={() => setView('assign-tasks')}
                    className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-sm hover:bg-emerald-500/20 transition-colors flex items-center gap-2 border border-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Assign Tasks
                  </button>
                  <div className="flex items-center justify-between gap-4 bg-white/5 p-1 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-white min-w-[120px] text-center uppercase tracking-widest">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar Grid */}
                <Card className="lg:col-span-2 p-6">
                  <div className="grid grid-cols-7 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = startOfMonth(currentMonth);
                      const monthEnd = endOfMonth(monthStart);
                      const startDate = startOfWeek(monthStart);
                      const endDate = endOfWeek(monthEnd);
                      const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

                      return calendarDays.map((day, i) => {
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isSelected = isSameDay(day, selectedDate);
                        const isTodayDay = isToday(day);
                        const dayMilestones = allMilestones.filter(m => m.due_date && isSameDay(parseISO(m.due_date), day));
                        const hasMilestones = dayMilestones.length > 0;
                        const allDone = hasMilestones && dayMilestones.every(m => m.done);

                        return (
                          <motion.button
                            key={day.toString()}
                            onClick={() => setSelectedDate(day)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "aspect-square relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 group",
                              !isCurrentMonth && "opacity-20",
                              isSelected ? "bg-emerald-500 text-[#052e1a] shadow-lg shadow-emerald-500/20" : "hover:bg-white/5 text-slate-400",
                              isTodayDay && !isSelected && "border border-emerald-500/30 text-emerald-500"
                            )}
                          >
                            <span className={cn("text-sm font-bold", isSelected ? "text-[#052e1a]" : "group-hover:text-white")}>
                              {format(day, 'd')}
                            </span>
                            {hasMilestones && (
                              <div className={cn(
                                "absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold shadow-sm",
                                isSelected 
                                  ? "bg-[#052e1a] text-emerald-500" 
                                  : allDone 
                                    ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20" 
                                    : "bg-slate-800 text-slate-300 border border-white/5"
                              )}>
                                {dayMilestones.length}
                              </div>
                            )}
                          </motion.button>
                        );
                      });
                    })()}
                  </div>
                </Card>

                {/* Day Details */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                          {isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, 'MMMM d, yyyy')}
                        </h3>
                        <p className="text-xs text-slate-600 mt-1">{milestonesForSelectedDate.length} Milestones</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {milestonesForSelectedDate.some(m => !m.done) && (
                          <button
                            onClick={() => handleMarkAllDone(milestonesForSelectedDate.filter(m => !m.done).map(m => m.id))}
                            className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-emerald-500/20 transition-colors"
                          >
                            Mark All Done
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setNewMilestone({ ...newMilestone, due_date: format(selectedDate, 'yyyy-MM-dd') });
                            setIsAddingMilestone(true);
                          }}
                          className="w-9 h-9 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                          title="Add milestone to this day"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={selectedDate.toString()}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        {milestonesForSelectedDate.length === 0 ? (
                          <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
                            <p className="text-slate-500 text-xs italic">No milestones scheduled for this day.</p>
                          </div>
                        ) : (
                          milestonesForSelectedDate.map((ms, index) => (
                            <motion.div 
                              key={ms.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                "p-4 rounded-2xl border transition-all duration-200 group",
                                ms.done ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <button 
                                  onClick={() => toggleMilestone(ms.id)}
                                  className={cn(
                                    "mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200",
                                    ms.done ? "bg-emerald-500 text-[#052e1a]" : "border-2 border-slate-700 hover:border-slate-500"
                                  )}
                                >
                                  {ms.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn("text-sm font-bold truncate", ms.done ? "text-slate-500 line-through" : "text-white")}>
                                    {ms.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ms.categoryColor }} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{ms.goalTitle}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </Card>

                  {/* Today's Summary Widget */}
                  {!isToday(selectedDate) && todayMilestones.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="p-6 border-emerald-500/20 bg-emerald-500/[0.02]">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500">Today's Focus</h3>
                        </div>
                        <div className="space-y-2">
                          {todayMilestones.slice(0, 2).map(ms => (
                            <div key={ms.id} className="flex items-center gap-2">
                              <div className={cn("w-1 h-1 rounded-full", ms.done ? "bg-emerald-500" : "bg-slate-700")} />
                              <span className={cn("text-xs truncate", ms.done ? "text-slate-500 line-through" : "text-slate-300")}>
                                {ms.title}
                              </span>
                            </div>
                          ))}
                          {todayMilestones.length > 2 && (
                            <p className="text-[10px] text-slate-500 font-bold italic">+{todayMilestones.length - 2} more today</p>
                          )}
                        </div>
                        <button 
                          onClick={() => setSelectedDate(new Date())}
                          className="w-full mt-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                        >
                          View Today
                        </button>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : view === 'assign-tasks' ? (
            <AssignTasksView 
              goals={goals} 
              onClose={() => {
                fetchGoals();
                setView('calendar');
              }} 
            />
          ) : null}
        </AnimatePresence>
      </main>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isCustomizingLayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomizingLayout(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-extrabold text-white tracking-tight mb-2">Customize Dashboard</h3>
                <p className="text-slate-500 text-sm mb-8">Drag to reorder widgets and toggle visibility.</p>
                
                <Reorder.Group 
                  axis="y" 
                  values={dashboardLayout} 
                  onReorder={setDashboardLayout}
                  className="space-y-3"
                >
                  {dashboardLayout.map((widget) => (
                    <Reorder.Item 
                      key={widget.id} 
                      value={widget}
                      className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl cursor-grab active:cursor-grabbing group"
                    >
                      <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      <span className="flex-1 text-sm font-bold text-slate-200">{widget.label}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDashboardLayout(prev => prev.map(w => 
                            w.id === widget.id ? { ...w, visible: !w.visible } : w
                          ));
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          widget.visible ? "text-emerald-500 bg-emerald-500/10" : "text-slate-600 bg-white/5"
                        )}
                      >
                        {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                <div className="mt-10 space-y-3">
                  <button 
                    onClick={() => setIsCustomizingLayout(false)}
                    className="w-full py-4 rounded-2xl bg-emerald-500 text-[#052e1a] font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    Done
                  </button>
                  <button 
                    onClick={() => {
                      const defaultLayout: WidgetConfig[] = [
                        { id: 'stats', visible: true, label: 'Quick Stats' },
                        { id: 'progress', visible: true, label: 'Goal Progress' },
                        { id: 'trends', visible: true, label: 'Historical Trends' },
                        { id: 'categories', visible: true, label: 'Category Breakdown' },
                        { id: 'focus', visible: true, label: "Today's Focus" },
                      ];
                      setDashboardLayout(defaultLayout);
                    }}
                    className="w-full py-4 rounded-2xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingGoal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-extrabold text-white tracking-tight mb-8">{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
                <form onSubmit={handleAddGoal} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Goal Title</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="What do you want to achieve?"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={newGoal.title}
                      onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Category</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newGoal.category}
                          onChange={e => setNewGoal({...newGoal, category: e.target.value})}
                        >
                          {categories.map(cat => <option key={cat.id} value={cat.name} className="bg-[#111827]">{cat.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Priority</label>
                      <div className="relative">
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newGoal.priority}
                          onChange={e => setNewGoal({...newGoal, priority: e.target.value as any})}
                        >
                          <option value="High" className="bg-[#111827]">High</option>
                          <option value="Medium" className="bg-[#111827]">Medium</option>
                          <option value="Low" className="bg-[#111827]">Low</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Deadline</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      value={newGoal.deadline}
                      onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Note (Optional)</label>
                    <textarea 
                      placeholder="Add some context or motivation..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors h-24 resize-none"
                      value={newGoal.note}
                      onChange={e => setNewGoal({...newGoal, note: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingGoal(false);
                        setEditingGoal(null);
                        setNewGoal({ title: '', category: categories[0]?.name || 'Health', priority: 'Medium', deadline: '', note: '' });
                      }}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-[#052e1a] font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      {editingGoal ? 'Save Changes' : 'Create Goal'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Milestone Modal */}
      <AnimatePresence>
        {isAddingMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingMilestone(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-extrabold text-white tracking-tight mb-6">Add Milestone</h3>
                <form onSubmit={handleAddMilestone} className="space-y-5">
                  {!activeGoalId && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Select Goal</label>
                      <div className="relative">
                        <select 
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer pr-10"
                          value={newMilestone.goal_id}
                          onChange={e => setNewMilestone({...newMilestone, goal_id: e.target.value})}
                        >
                          <option value="" disabled className="bg-[#111827]">Choose a goal...</option>
                          {goals.map(g => (
                            <option key={g.id} value={g.id} className="bg-[#111827]">{g.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Milestone Title</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="e.g. Complete first draft"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={newMilestone.title}
                      onChange={e => setNewMilestone({...newMilestone, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Due Date (Optional)</label>
                    <input 
                      type="date" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      value={newMilestone.due_date}
                      onChange={e => setNewMilestone({...newMilestone, due_date: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAddingMilestone(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-[#052e1a] font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Category Modal */}
      <AnimatePresence>
        {(isAddingCategory || editingCategory) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#111827] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-extrabold text-white tracking-tight mb-6">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Name</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="e.g. Travel"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={editingCategory ? editingCategory.name : newCategory.name}
                      onChange={e => editingCategory 
                        ? setEditingCategory({...editingCategory, name: e.target.value})
                        : setNewCategory({...newCategory, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Color</label>
                      <input 
                        type="color" 
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-2 py-1 cursor-pointer"
                        value={editingCategory ? editingCategory.color : newCategory.color}
                        onChange={e => editingCategory 
                          ? setEditingCategory({...editingCategory, color: e.target.value})
                          : setNewCategory({...newCategory, color: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Icon (Emoji)</label>
                      <input 
                        required
                        type="text" 
                        maxLength={2}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl focus:outline-none focus:border-emerald-500/50 transition-colors"
                        value={editingCategory ? editingCategory.icon : newCategory.icon}
                        onChange={e => editingCategory 
                          ? setEditingCategory({...editingCategory, icon: e.target.value})
                          : setNewCategory({...newCategory, icon: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-bold text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-[#052e1a] font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      {editingCategory ? 'Save' : 'Add'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
