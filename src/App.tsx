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
  X,
  Sun,
  Moon,
  Activity,
  Zap,
  Trophy
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
import confetti from 'canvas-confetti';
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
  parseISO,
  startOfDay
} from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { storage, isDueOnDate, isCompletedOnDate, type Goal, type Category, type Milestone, type Habit } from './storage';
import { Logo, LogoFull } from './components/Logo';

// --- Utility ---
export function cn(...inputs: ClassValue[]) {
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
  High: 'dark:text-rose-400 text-rose-700 dark:bg-rose-400/10 bg-rose-50 dark:border-rose-400/20 border-rose-200',
  Medium: 'dark:text-amber-400 text-amber-700 dark:bg-amber-400/10 bg-amber-50 dark:border-amber-400/20 border-amber-200',
  Low: 'dark:text-emerald-400 text-emerald-700 dark:bg-emerald-400/10 bg-emerald-50 dark:border-emerald-400/20 border-emerald-200',
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
        "p-2 md:p-3 rounded-xl border dark:border-white/5 border-slate-200 dark:bg-white/[0.02] bg-slate-50 cursor-grab active:cursor-grabbing hover:dark:border-white/10 hover:border-slate-300 transition-colors mb-2",
        isDragging && "opacity-50 border-emerald-500/50 bg-emerald-500/5 z-50"
      )}
    >
      <div className="flex items-center gap-1 md:gap-2">
        <GripVertical className="w-3 h-3 dark:text-slate-500 text-slate-600" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] md:text-xs font-bold dark:text-white text-slate-900 truncate">{milestone.title}</p>
          <p className="text-[8px] md:text-[10px] dark:text-slate-500 text-slate-600 truncate">{goalTitle}</p>
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
        isOver ? "bg-emerald-500/10 border-emerald-500/50 scale-[1.02] z-10" : "dark:bg-white/[0.02] bg-slate-50 dark:border-white/5 border-slate-200",
        isToday(day) && "border-emerald-500/30"
      )}
    >
      <div className="flex justify-between items-start mb-1 md:mb-2">
        <span className={cn("text-[10px] md:text-xs font-bold", isToday(day) ? "text-emerald-500" : "dark:text-slate-500 text-slate-600")}>
          {format(day, 'd')}
        </span>
        {milestones.length > 0 && (
          <span className="text-[8px] md:text-[10px] font-bold dark:text-slate-500 text-slate-600 px-1 md:px-1.5 py-0.5 dark:bg-white/5 bg-slate-100 rounded">
            {milestones.length}
          </span>
        )}
      </div>
      <div className="flex-1 space-y-1 md:space-y-1.5 overflow-hidden">
        {milestones.slice(0, 4).map(ms => (
          <DraggableCalendarMilestone key={ms.id} milestone={ms} goalTitle={ms.goalTitle} />
        ))}
        {milestones.length > 4 && (
          <p className="text-[8px] md:text-[9px] dark:text-slate-500 text-slate-600 font-bold text-center">+{milestones.length - 4} more</p>
        )}
      </div>
    </div>
  );
};

const DroppableCalendarDay = ({ 
  day, 
  isCurrentMonth, 
  isSelected, 
  isTodayDay, 
  dayMilestones, 
  onClick 
}: { 
  day: Date, 
  isCurrentMonth: boolean, 
  isSelected: boolean, 
  isTodayDay: boolean, 
  dayMilestones: any[], 
  onClick: () => void,
  key?: React.Key
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: format(day, 'yyyy-MM-dd'),
  });

  const hasMilestones = dayMilestones.length > 0;
  const allDone = hasMilestones && dayMilestones.every(m => m.done);

  return (
    <motion.button
      ref={setNodeRef}
      key={day.toString()}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "aspect-square relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 group",
        !isCurrentMonth && "opacity-20",
        isSelected ? "bg-emerald-500 text-[#052e1a] shadow-lg shadow-emerald-500/20" : "hover:dark:bg-white/5 bg-slate-100 dark:text-slate-400 dark:text-slate-500 text-slate-600",
        isTodayDay && !isSelected && "border border-emerald-500/30 text-emerald-500",
        isOver && "ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#0c1020] ring-offset-white z-10"
      )}
    >
      <span className={cn("text-sm font-bold", isSelected ? "text-[#052e1a]" : "group-hover:dark:text-white text-slate-900")}>
        {format(day, 'd')}
      </span>
      {hasMilestones && (
        <div className={cn(
          "absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold shadow-sm",
          isSelected 
            ? "bg-[#052e1a] text-emerald-500" 
            : allDone 
              ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/20" 
              : "dark:bg-slate-800 bg-slate-200 dark:text-slate-200 text-slate-700 border dark:border-white/10 border-slate-300"
        )}>
          {dayMilestones.length}
        </div>
      )}
    </motion.button>
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
            <h2 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-1">Assign Tasks</h2>
            <p className="dark:text-slate-500 text-slate-600 text-xs md:text-sm">Drag unassigned milestones onto the calendar.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex items-center justify-between gap-4 dark:bg-white/5 bg-slate-100 p-1 rounded-xl border dark:border-white/5 border-slate-200">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 dark:text-slate-400 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 hover:dark:bg-white/5 bg-slate-100 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs md:text-sm font-bold dark:text-white text-slate-900 min-w-[120px] md:min-w-[140px] text-center uppercase tracking-widest">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 dark:text-slate-400 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 hover:dark:bg-white/5 bg-slate-100 rounded-lg transition-all"
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
            <div className="p-3 md:p-4 border-bottom dark:border-white/5 border-slate-200 dark:bg-white/[0.02] bg-slate-50">
              <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">Unassigned Milestones</h3>
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
                <div key={day} className="text-center text-[8px] md:text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 py-1 md:py-2">
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
            <p className="text-[10px] md:text-xs font-bold dark:text-white text-slate-900 truncate">{activeMilestone.title}</p>
            <p className="text-[8px] md:text-[10px] dark:text-slate-500 text-slate-600 truncate">{activeMilestone.goalTitle}</p>
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
    className={cn("dark:bg-[#111827] bg-white border dark:border-white/5 border-slate-200 rounded-2xl overflow-hidden", className)}
  >
    {children}
  </motion.div>
);

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border", className)}>
    {children}
  </span>
);

type WidgetId = 'stats' | 'progress' | 'categories' | 'focus' | 'goals' | 'trends' | 'repeatability';

interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  label: string;
}

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="dark:bg-slate-900 bg-white border dark:border-white/10 border-slate-200 p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-wider dark:text-slate-500 text-slate-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill }} />
            <p className="text-sm font-bold dark:text-white text-slate-900">
              {p.name}: {p.value}%
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="dark:bg-slate-900 bg-white border dark:border-white/10 border-slate-200 p-3 rounded-xl shadow-xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-wider dark:text-slate-500 text-slate-400 mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-sm font-bold dark:text-white text-slate-900">
            {payload[0].value} {payload[0].value === 1 ? 'Completion' : 'Completions'}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<'today' | 'dash' | 'detail' | 'categories' | 'calendar' | 'goals' | 'assign-tasks' | 'habits'>('today');
  const [isCustomizingLayout, setIsCustomizingLayout] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState<WidgetConfig[]>(() => {
    const defaultLayout: WidgetConfig[] = [
      { id: 'stats', visible: true, label: 'Quick Stats' },
      { id: 'progress', visible: true, label: 'Goal Progress' },
      { id: 'trends', visible: true, label: 'Historical Trends' },
      { id: 'repeatability', visible: true, label: 'Repeatability Track' },
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

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('forge_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('forge_theme', theme);
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [theme]);

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // New Today View States
  const [yesterdayScore, setYesterdayScore] = useState<number>(() => {
    const saved = localStorage.getItem('gf_yesterday_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [barPulse, setBarPulse] = useState(false);
  const [lastCompleted, setLastCompleted] = useState<string | null>(null);
  const [showBreather, setShowBreather] = useState(false);
  const [breatherMessage, setBreatherMessage] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [slidingOut, setSlidingOut] = useState<Set<string>>(new Set());
  const [floatingPoints, setFloatingPoints] = useState<{ id: string, points: number, x: number, y: number }[]>([]);
  const [crushedExpanded, setCrushedExpanded] = useState(false);
  const [showMomentumMobile, setShowMomentumMobile] = useState(false);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCustomizingNav, setIsCustomizingNav] = useState(false);
  const [activeCalendarDragId, setActiveCalendarDragId] = useState<string | null>(null);

  const unassignedMilestones = useMemo(() => {
    return goals.flatMap(g => 
      (g.milestones || [])
        .filter(m => !m.due_date && !m.done)
        .map(m => ({ ...m, goalTitle: g.title }))
    );
  }, [goals]);

  const activeCalendarMilestone = useMemo(() => {
    if (!activeCalendarDragId) return null;
    return unassignedMilestones.find(m => m.id === activeCalendarDragId);
  }, [activeCalendarDragId, unassignedMilestones]);

  const handleCalendarDragStart = (event: any) => {
    setActiveCalendarDragId(event.active.id);
  };

  const handleCalendarDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveCalendarDragId(null);
    
    if (over && active.id) {
      const milestoneId = active.id as string;
      const targetDate = over.id as string;
      
      storage.updateMilestone(milestoneId, { due_date: targetDate });
      fetchGoals();
    }
  };

  const [navOrder, setNavOrder] = useState<{id: string, label: string, icon: any}[]>(() => {
    const defaultNav = [
      { id: 'today', label: 'Today', icon: 'Sun' },
      { id: 'dash', label: 'Dashboard', icon: 'LayoutDashboard' },
      { id: 'habits', label: 'Habits', icon: 'Activity' },
      { id: 'goals', label: 'Goals', icon: 'Target' },
      { id: 'categories', label: 'Categories', icon: 'Filter' },
      { id: 'calendar', label: 'Calendar', icon: 'Calendar' }
    ];
    const saved = localStorage.getItem('forge_nav_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = [...parsed];
        defaultNav.forEach(def => {
          if (!merged.find(m => m.id === def.id)) merged.push(def);
        });
        return merged;
      } catch (e) {
        return defaultNav;
      }
    }
    return defaultNav;
  });

  useEffect(() => {
    localStorage.setItem('forge_nav_order', JSON.stringify(navOrder));
  }, [navOrder]);

  // Form states
  const [newGoal, setNewGoal] = useState({
    title: '',
    category: '',
    priority: 'Medium' as const,
    deadline: '',
    note: '',
    repeat: 'None' as 'None' | 'Daily' | 'Weekly' | 'Monthly'
  });
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    due_date: '',
    note: '',
    goal_id: '',
    repeat: 'None' as 'None' | 'Daily' | 'Weekly' | 'Monthly'
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

  const getTaskPoints = (task: any) => {
    return 10;
  };

  const allCalendarItems = useMemo(() => {
    const items: any[] = [];
    goals.forEach(g => {
      const cat = categories.find(c => c.name === g.category) || { color: '#64748b' };
      
      if (g.repeat && g.repeat !== 'None') {
        items.push({
          ...g,
          goalTitle: g.title,
          categoryColor: cat.color,
          goalId: g.id,
          isGoalAsMilestone: true,
        });
      } else {
        (g.milestones || []).forEach(m => {
          items.push({
            ...m,
            goalTitle: g.title,
            categoryColor: cat.color,
            goalId: g.id,
            isGoalAsMilestone: false,
          });
        });
      }
    });

    habits.forEach(h => {
      const cat = categories.find(c => c.name === h.category) || { color: '#64748b' };
      items.push({
        ...h,
        goalTitle: 'Habit',
        categoryColor: cat.color,
        isHabit: true,
      });
    });

    return items;
  }, [goals, habits, categories]);

  const trendData = useMemo(() => {
    // Generate last 7 days of data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const completionCounts = last7Days.map(date => {
      const items = allCalendarItems
        .filter(item => isDueOnDate(item, date))
        .map(item => ({
          ...item,
          done: isCompletedOnDate(item, date)
        }));
      
      const count = items.filter(m => m.done).length;
      return { name: format(date, 'MMM dd'), completions: count };
    });

    return completionCounts;
  }, [allCalendarItems]);

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

  const [newHabit, setNewHabit] = useState<Partial<Habit>>({
    title: '',
    category: 'Health',
    repeat: 'Daily',
    due_date: ''
  });

  const fetchGoals = () => {
    setGoals(storage.getGoals());
    setHabits(storage.getHabits());
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
        milestones: [],
        last_reset_at: new Date().toISOString()
      });
    }
    setIsAddingGoal(false);
    setNewGoal({ title: '', category: categories[0]?.name || 'Health', priority: 'Medium', deadline: '', note: '', repeat: 'None' });
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

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.title) return;

    if (editingHabit) {
      storage.updateHabit(editingHabit.id, newHabit);
      setEditingHabit(null);
    } else {
      storage.addHabit({
        id: uid() as string,
        title: newHabit.title as string,
        category: newHabit.category as string,
        repeat: newHabit.repeat as any,
        due_date: newHabit.due_date,
        created_at: new Date().toISOString(),
        completed_dates: [],
        streak: 0
      });
    }
    setIsAddingHabit(false);
    setNewHabit({ title: '', category: categories[0]?.name || 'Health', repeat: 'Daily', due_date: '' });
    fetchGoals();
  };

  const handleDeleteHabit = (id: string) => {
    if (!confirm("Are you sure you want to delete this habit?")) return;
    storage.deleteHabit(id);
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
    setNewMilestone({ title: '', due_date: '', note: '', goal_id: '', repeat: 'None' });
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

  const getItemsForDate = (date: Date) => {
    return allCalendarItems
      .filter(item => isDueOnDate(item, date))
      .map(item => ({
        ...item,
        done: isCompletedOnDate(item, date)
      }));
  };

  const milestonesForSelectedDate = useMemo(() => {
    return getItemsForDate(selectedDate);
  }, [allCalendarItems, selectedDate]);

  const todayMilestones = useMemo(() => {
    return getItemsForDate(new Date());
  }, [allCalendarItems]);

  const todayProgress = useMemo(() => {
    if (todayMilestones.length === 0) return 0;
    return (todayMilestones.filter(m => m.done).length / todayMilestones.length) * 100;
  }, [todayMilestones]);

  const todayScore = useMemo(() => {
    return todayMilestones.filter(m => m.done).reduce((acc, task) => acc + getTaskPoints(task), 0);
  }, [todayMilestones]);

  useEffect(() => {
    const lastDate = localStorage.getItem('gf_last_date');
    const todayStr = new Date().toDateString();
    
    if (lastDate && lastDate !== todayStr) {
      const lastScore = localStorage.getItem('gf_today_score') || '0';
      localStorage.setItem('gf_yesterday_score', lastScore);
      setYesterdayScore(parseInt(lastScore, 10));
    }
    localStorage.setItem('gf_last_date', todayStr);
  }, []);

  useEffect(() => {
    localStorage.setItem('gf_today_score', todayScore.toString());
  }, [todayScore]);

  const getHeroTheme = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return { label: "FRESH START", bg: "linear-gradient(135deg, #0f766e 0%, #064e3b 100%)", msg: "Today is yours." };
    if (h >= 12 && h < 17) return { label: "STAY FOCUSED", bg: "linear-gradient(135deg, #4338ca 0%, #312e81 100%)", msg: "You're in the zone. Keep pushing." };
    if (h >= 17 && h < 22) return { label: "FINISH STRONG", bg: "linear-gradient(135deg, #b45309 0%, #78350f 100%)", msg: "The day isn't over yet. Finish strong." };
    return { label: "ONE LAST PUSH", bg: "linear-gradient(135deg, #991b1b 0%, #450a0a 100%)", msg: "Don't carry this to tomorrow." };
  };

  const getBarColor = (progress: number) => {
    if (progress <= 33) return '#EF4444';
    if (progress <= 66) return '#F59E0B';
    if (progress < 100) return '#22C55E';
    return '#C8F55A';
  };

  const handleToggleToday = (ms: any) => {
    if (ms.isHabit) {
      storage.toggleHabit(ms.id, new Date());
    } else if (ms.isGoalAsMilestone) {
      storage.toggleGoalCompletion(ms.id, new Date());
    } else {
      storage.toggleMilestone(ms.id, new Date());
    }
    fetchGoals();
    
    // Check if this was the last task
    const isCompleting = !ms.done;
    const doneCount = todayMilestones.filter(m => m.done).length;
    if (isCompleting && doneCount + 1 === todayMilestones.length && todayMilestones.length > 0) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
    }
  };

  const handleArenaComplete = (task: any, e?: React.MouseEvent | TouchEvent | PointerEvent) => {
    if (!task.done) {
      setBarPulse(true);
      setTimeout(() => setBarPulse(false), 300);

      const points = getTaskPoints(task);
      let x = window.innerWidth / 2;
      let y = window.innerHeight / 2;
      
      if (e && e.currentTarget instanceof HTMLElement) {
        const rect = e.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top;
      }

      const newPoint = { id: uid(), points, x, y };
      setFloatingPoints(prev => [...prev, newPoint]);
      setTimeout(() => {
        setFloatingPoints(prev => prev.filter(p => p.id !== newPoint.id));
      }, 1000);

      const messages = ["One down. You're moving.", "That's the momentum. Next.", "Streak intact. Keep going.", "Clean. Next challenge.", "Locked in. What's next?"];
      setBreatherMessage(messages[Math.floor(Math.random() * messages.length)]);
      setLastCompleted(task.title);
      setShowBreather(true);

      setTimeout(() => {
        handleToggleToday(task);
        setShowBreather(false);
      }, 1000);
    } else {
      handleToggleToday(task);
    }
  };

  const CircularProgress = ({ progress, size = 160, strokeWidth = 12 }: { progress: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-200 dark:text-white/5"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "circOut" }}
            className="text-emerald-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={cn("font-bold dark:text-white text-slate-900", size < 120 ? "text-2xl" : "text-3xl")}>{Math.round(progress)}%</span>
          <span className="text-[9px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-400">Complete</span>
        </div>
      </div>
    );
  };

  const repeatabilityData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return last7Days.map(day => {
      const dayStr = format(day, 'MMM dd');
      let completed = 0;
      let missed = 0;

      allCalendarItems.forEach(item => {
        if (item.repeat && item.repeat !== 'None') {
          if (isDueOnDate(item, day)) {
            if (isCompletedOnDate(item, day)) {
              completed++;
            } else {
              if (startOfDay(day) <= startOfDay(new Date())) {
                missed++;
              }
            }
          }
        }
      });

      return { name: dayStr, Completed: completed, Missed: missed };
    });
  }, [allCalendarItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-[#0c1020] bg-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen dark:bg-[#0c1020] bg-white font-sans selection:bg-emerald-500/30">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 w-64 border-r dark:border-white/5 border-slate-200 dark:bg-[#0a0e1a] bg-slate-50 flex flex-col h-screen z-50 transition-transform duration-300",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-bottom dark:border-white/5 border-slate-200 flex justify-between items-center">
          <LogoFull />
          <button 
            className="lg:hidden dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {isCustomizingNav ? (
            <Reorder.Group axis="y" values={navOrder} onReorder={setNavOrder} className="space-y-1">
              {navOrder.map((item) => {
                const Icon = { Sun, LayoutDashboard, Target, Filter, Calendar }[item.icon] || LayoutDashboard;
                return (
                  <Reorder.Item key={item.id} value={item} className="flex items-center gap-3 px-3 py-2.5 rounded-xl dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4 dark:text-slate-500 text-slate-600" />
                    <Icon className="w-4 h-4 dark:text-slate-400 dark:text-slate-500 text-slate-600" />
                    <span className="text-sm font-semibold dark:text-slate-200 text-slate-800">{item.label}</span>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          ) : (
            navOrder.map((item) => {
              const Icon = { Sun, LayoutDashboard, Target, Filter, Calendar }[item.icon] || LayoutDashboard;
              return (
                <button 
                  key={item.id}
                  onClick={() => { setView(item.id as any); setActiveGoalId(null); setIsMobileMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                    view === item.id 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : "dark:text-slate-500 text-slate-600 hover:dark:bg-white/5 hover:bg-slate-100 dark:hover:text-slate-200 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </button>
              );
            })
          )}
          
          <div className="pt-6 pb-2 px-3 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">My Goals</p>
            <button 
              onClick={() => setIsCustomizingNav(!isCustomizingNav)}
              className="dark:text-slate-500 text-slate-600 hover:dark:text-slate-300 text-slate-700"
            >
              <Settings className="w-3 h-3" />
            </button>
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
                  isActive 
                    ? "dark:bg-white/5 bg-slate-100 dark:text-white text-slate-900" 
                    : "dark:text-slate-500 text-slate-600 hover:dark:bg-white/5 hover:bg-slate-100 dark:hover:text-slate-200 hover:text-slate-900"
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl dark:text-slate-500 text-slate-600 hover:bg-emerald-500/5 hover:text-emerald-500 transition-all duration-200 mt-4 border border-dashed dark:border-white/5 border-slate-200 hover:border-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-semibold">New Goal</span>
          </button>
        </nav>

        <div className="p-6 border-t dark:border-white/5 border-slate-200 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold dark:text-slate-500 text-slate-600">Theme</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg dark:bg-white/5 bg-slate-100 hover:dark:bg-white/10 bg-slate-200 dark:text-slate-300 text-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <div className="dark:bg-emerald-500/5 bg-emerald-50/50 border dark:border-emerald-500/10 border-emerald-500/10 rounded-2xl p-4">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/60">Overall</span>
              <span className="text-sm font-bold text-emerald-500">{stats.avgProgress}%</span>
            </div>
            <div className="h-1.5 dark:bg-white/5 bg-slate-100 rounded-full overflow-hidden">
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
        <div className="lg:hidden flex items-center justify-between p-4 border-b dark:border-white/5 border-slate-200 dark:bg-[#0a0e1a] bg-slate-50 sticky top-0 z-30">
          <LogoFull />
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 dark:text-slate-400 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 dark:bg-white/5 bg-slate-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {view === 'today' ? (
            <motion.div 
              key="today"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-6xl mx-auto w-full"
            >
              <AnimatePresence>
                {isFocusMode && todayMilestones.some(m => !m.done) ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center p-8"
                  >
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full animate-pulse" />
                    </div>
                    
                    <button 
                      onClick={() => setIsFocusMode(false)}
                      className="absolute top-8 right-8 p-4 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    <div className="relative text-center max-w-2xl w-full">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-500/5">
                        <Zap className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                      </div>
                      
                      <p className="text-emerald-500 font-bold uppercase tracking-[0.2em] text-xs mb-4">Current Protocol</p>
                      
                      {(() => {
                        const mainTask = todayMilestones.find(m => !m.done);
                        return (
                          <>
                            <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
                              {mainTask?.title}
                            </h2>
                            <p className="text-white/50 text-lg font-medium mb-12 uppercase tracking-widest flex items-center justify-center gap-2">
                              {mainTask?.goalTitle} <span className="w-1.5 h-1.5 rounded-full bg-white/20" /> {mainTask?.category}
                            </p>
                            
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                              <button 
                                onClick={() => {
                                  handleToggleToday(mainTask);
                                  if (todayMilestones.filter(m => !m.done).length <= 1) {
                                    setIsFocusMode(false);
                                  }
                                }}
                                className="w-full md:w-auto px-10 py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                              >
                                Task Complete
                              </button>
                              <button 
                                onClick={() => setIsFocusMode(false)}
                                className="w-full md:w-auto px-10 py-5 bg-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all active:scale-95"
                              >
                                Exit Focus
                              </button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {todayMilestones.length === 0 ? (
                <div className="space-y-6 md:space-y-8">
                  {/* Desktop Hero */}
                  <div className="hidden md:block relative overflow-hidden rounded-[1.5rem] p-8 text-white" style={{ background: getHeroTheme().bg }}>
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">{getHeroTheme().label}</p>
                        <h2 className="text-4xl font-extrabold tracking-tight mb-2">Daily Mission</h2>
                        <p className="text-white/60 text-sm">Your schedule is clear — assign tasks from the Calendar</p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-extrabold">{todayScore}</div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest">pts today</div>
                        {todayScore !== yesterdayScore && (
                          <div className={cn("text-xs mt-1", todayScore > yesterdayScore ? "text-green-400" : "text-red-400")}>
                            {todayScore > yesterdayScore ? '↑' : '↓'} vs yesterday
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="h-5 rounded-full bg-white/10 relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000" style={{ width: '0%', backgroundColor: getBarColor(0) }} />
                    </div>
                  </div>

                  {/* Mobile Hero & Streak (Compact) */}
                  <div className="md:hidden flex items-center justify-between bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-2xl p-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200 dark:text-white/10"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            strokeWidth="3"
                            strokeDasharray={`0, 100`}
                            strokeLinecap="round"
                            stroke={getBarColor(0)}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">0%</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{todayScore} <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">pts</span></div>
                        <div className="text-[10px] font-medium text-slate-500">
                          Schedule is clear
                        </div>
                      </div>
                    </div>
                    {todayScore !== yesterdayScore && (
                      <div className={cn("text-[10px] font-bold px-2 py-1 rounded-full", todayScore > yesterdayScore ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>
                        {todayScore > yesterdayScore ? '↑' : '↓'} vs yday
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5">
                    <div className="text-6xl mb-6">📅</div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your Arena Awaits</h3>
                    <p className="text-slate-500 mb-8 text-center max-w-md">No tasks assigned for today. Head to the Calendar to schedule your milestones.</p>
                    <div className="flex gap-4">
                      <button onClick={() => setView('calendar')} className="px-6 py-3 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">Go to Calendar</button>
                      <button onClick={() => setIsAddingMilestone(true)} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors">Add Milestone</button>
                    </div>
                  </div>
                </div>
              ) : todayProgress === 100 ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] rounded-[2rem] bg-[var(--sidebar)] relative overflow-hidden border border-emerald-500/20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_70%)] opacity-5" />
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-8xl mb-8">🏆</motion.div>
                  <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4">Day Conquered</h2>
                  <p className="text-xl text-white/60 mb-12">{format(new Date(), 'EEEE, MMMM d')}</p>
                  
                  <div className="text-center mb-12">
                    <div className="text-7xl font-black text-[var(--accent)] mb-2">{todayScore}</div>
                    <div className="text-sm font-bold uppercase tracking-widest text-white/40">points</div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4 mb-12">
                    <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium">{todayMilestones.length} tasks done</div>
                    <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium">{Math.max(0, ...goals.map(g => g.streak))} day streak</div>
                    <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium">100% progress</div>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    <button onClick={() => {
                      navigator.clipboard.writeText(`✅ GoalForge Daily Summary — ${format(new Date(), 'MMM d')}\n${todayScore} points\n${todayMilestones.length} tasks completed\nStreak: ${Math.max(0, ...goals.map(g => g.streak))} days`);
                    }} className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-colors">Copy Summary</button>
                    <button onClick={() => setView('calendar')} className="px-8 py-4 bg-[var(--accent)] text-black rounded-2xl font-bold hover:opacity-90 transition-opacity">Plan Tomorrow →</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 relative">
                  {floatingPoints.map(fp => (
                    <motion.div
                      key={fp.id}
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -30 }}
                      transition={{ duration: 0.6 }}
                      className="fixed z-50 font-black text-emerald-500 text-lg pointer-events-none"
                      style={{ left: fp.x, top: fp.y }}
                    >
                      +{fp.points}
                    </motion.div>
                  ))}

                  <div className="space-y-6 md:space-y-8">
                  {/* Desktop Hero */}
                  <div className="hidden md:block relative overflow-hidden rounded-[1.5rem] p-8 text-white" style={{ background: getHeroTheme().bg }}>
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">{getHeroTheme().label}</p>
                        <h2 className="text-4xl font-extrabold tracking-tight mb-2">Daily Mission</h2>
                        <p className="text-white/60 text-sm">
                          {getHeroTheme().msg} {todayMilestones.length - todayMilestones.filter(m => m.done).length} challenge{todayMilestones.length - todayMilestones.filter(m => m.done).length !== 1 ? 's' : ''} standing.
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-extrabold">{todayScore}</div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest">pts today</div>
                        {todayScore !== yesterdayScore && (
                          <div className={cn("text-xs mt-1", todayScore > yesterdayScore ? "text-green-400" : "text-red-400")}>
                            {todayScore > yesterdayScore ? '↑' : '↓'} vs yesterday
                          </div>
                        )}
                      </div>
                    </div>
                    <motion.div 
                      animate={barPulse ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="h-5 rounded-full bg-white/10 relative overflow-hidden"
                    >
                      <div 
                        className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-end pr-2", todayProgress === 100 && "animate-pulse")}
                        style={{ width: `${todayProgress}%`, backgroundColor: getBarColor(todayProgress) }}
                      >
                        {todayProgress > 5 && <span className="text-[10px] font-bold text-white/90">{Math.round(todayProgress)}%</span>}
                      </div>
                    </motion.div>
                  </div>

                  {/* Mobile Hero & Streak (Compact) */}
                  <div className="md:hidden flex items-center justify-between bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-2xl p-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-200 dark:text-white/10"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            strokeWidth="3"
                            strokeDasharray={`${todayProgress}, 100`}
                            strokeLinecap="round"
                            stroke={getBarColor(todayProgress)}
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white">{Math.round(todayProgress)}%</span>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{todayScore} <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">pts</span></div>
                        {(() => {
                          const highestStreak = Math.max(0, ...goals.map(g => g.streak));
                          if (highestStreak > 0) {
                            return (
                              <div className="text-[10px] font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1">
                                <Flame className="w-3 h-3" /> {highestStreak} day streak
                              </div>
                            );
                          }
                          return (
                            <div className="text-[10px] font-medium text-slate-500">
                              {todayMilestones.length - todayMilestones.filter(m => m.done).length} tasks left
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {todayScore !== yesterdayScore && (
                      <div className={cn("text-[10px] font-bold px-2 py-1 rounded-full", todayScore > yesterdayScore ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400")}>
                        {todayScore > yesterdayScore ? '↑' : '↓'} vs yday
                      </div>
                    )}
                  </div>

                  <div className="hidden md:block">
                    {(() => {
                      const highestStreak = Math.max(0, ...goals.map(g => g.streak));
                      if (highestStreak > 0) {
                        const hoursLeft = 24 - new Date().getHours();
                        const isUrgent = new Date().getHours() >= 18;
                        const incompleteCount = todayMilestones.length - todayMilestones.filter(m => m.done).length;
                        
                        return (
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500 text-sm font-medium">
                            {isUrgent ? (
                              <>⚡ {incompleteCount} tasks left — {hoursLeft} hours to protect your {highestStreak}-day streak</>
                            ) : (
                              <>🔥 {highestStreak} day streak active — complete today's tasks to keep it alive</>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      {(() => {
                        const incompleteTasks = todayMilestones.filter(m => !m.done);
                        if (incompleteTasks.length === 0 && !showBreather) return null;
                        
                        // Sort tasks: High priority first
                        const sortedTasks = [...incompleteTasks].sort((a, b) => {
                          const pA = a.priority === 'High' ? 3 : a.priority === 'Medium' ? 2 : 1;
                          const pB = b.priority === 'High' ? 3 : b.priority === 'Medium' ? 2 : 1;
                          return pB - pA;
                        });

                        const currentTask = sortedTasks[carouselIndex % sortedTasks.length];
                        const catColor = currentTask?.categoryColor || '#10b981';
                        
                        return (
                          <div className="flex flex-col items-center">
                            <div className="relative w-full max-w-md aspect-square rounded-[2rem] overflow-hidden bg-white dark:bg-[#1a1a1a] shadow-2xl shadow-black/10 dark:shadow-black/40 border border-slate-100 dark:border-white/5">
                              <AnimatePresence mode="wait">
                                {showBreather ? (
                                  <motion.div 
                                    key="breather"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-emerald-500 text-white"
                                  >
                                    <motion.div 
                                      initial={{ scale: 0 }} 
                                      animate={{ scale: 1 }} 
                                      transition={{ type: 'spring', bounce: 0.6, delay: 0.1 }}
                                      className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-6"
                                    >
                                      <CheckCircle2 className="w-10 h-10" />
                                    </motion.div>
                                    <h3 className="text-2xl font-black tracking-tight mb-2">{breatherMessage}</h3>
                                    <p className="text-emerald-100 font-medium">{lastCompleted}</p>
                                  </motion.div>
                                ) : (
                                  <motion.div 
                                    key={currentTask?.id}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={1}
                                    onDragEnd={(e, { offset, velocity }) => {
                                      const swipe = Math.abs(offset.x) * velocity.x;
                                      if (swipe < -10000) {
                                        setCarouselIndex(prev => prev + 1);
                                      } else if (swipe > 10000) {
                                        setCarouselIndex(prev => prev > 0 ? prev - 1 : sortedTasks.length - 1);
                                      }
                                    }}
                                    className="absolute inset-0 flex flex-col p-8 cursor-grab active:cursor-grabbing"
                                  >
                                    <div className="flex justify-between items-start mb-auto">
                                      <div className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ backgroundColor: `${catColor}15`, color: catColor }}>
                                        {currentTask?.category}
                                      </div>
                                      {currentTask?.priority === 'High' && (
                                        <div className="flex items-center gap-1 text-rose-500 text-[10px] font-bold uppercase tracking-widest">
                                          <Flame className="w-3 h-3" /> Hardest First
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col justify-center items-center text-center">
                                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tight mb-4">
                                        {currentTask?.title}
                                      </h2>
                                      <p className="text-sm font-medium text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                                        {currentTask?.goalTitle}
                                      </p>
                                    </div>
                                    
                                    <div className="mt-auto pt-8">
                                      <button 
                                        onClick={(e) => handleArenaComplete(currentTask, e)}
                                        className="w-full py-4 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                                        style={{ backgroundColor: catColor, color: '#fff', boxShadow: `0 10px 25px -5px ${catColor}40` }}
                                      >
                                        <CheckCircle2 className="w-5 h-5" /> MARK COMPLETE
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            
                            {!showBreather && sortedTasks.length > 1 && (
                              <div className="flex items-center gap-4 mt-8">
                                <button 
                                  onClick={() => setCarouselIndex(prev => prev > 0 ? prev - 1 : sortedTasks.length - 1)}
                                  className="hidden md:flex w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                  <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>
                                <div className="flex gap-2">
                                  {sortedTasks.map((_, idx) => (
                                    <div 
                                      key={idx} 
                                      className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        idx === (carouselIndex % sortedTasks.length) ? "bg-slate-800 dark:bg-white w-4" : "bg-slate-300 dark:bg-white/20"
                                      )}
                                    />
                                  ))}
                                </div>
                                <button 
                                  onClick={() => setCarouselIndex(prev => prev + 1)}
                                  className="hidden md:flex w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {todayMilestones.filter(m => m.done).length > 0 && (
                        <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden">
                          <button 
                            onClick={() => setCrushedExpanded(!crushedExpanded)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Trophy className="w-4 h-4 text-emerald-500" />
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Crushed Today</span>
                              <motion.span 
                                key={todayMilestones.filter(m => m.done).length}
                                initial={{ scale: 1.5 }}
                                animate={{ scale: 1 }}
                                className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                              >
                                {todayMilestones.filter(m => m.done).length}
                              </motion.span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", crushedExpanded && "rotate-180")} />
                          </button>
                          <AnimatePresence>
                            {crushedExpanded && (
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4 space-y-2 bg-white dark:bg-transparent">
                                  {todayMilestones.filter(m => m.done).map(task => (
                                    <div key={task.id} className="flex items-center gap-3 opacity-60">
                                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-sm text-slate-600 dark:text-slate-400 line-through truncate">{task.title}</h4>
                                        <p className="text-[10px] text-slate-400">{task.goalTitle}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-1">
                      <div className="lg:hidden mb-4">
                        <button 
                          onClick={() => setShowMomentumMobile(!showMomentumMobile)}
                          className="w-full py-3 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2"
                        >
                          {showMomentumMobile ? 'Hide Momentum' : 'Show Momentum'}
                          <ChevronDown className={cn("w-4 h-4 transition-transform", showMomentumMobile && "rotate-180")} />
                        </button>
                      </div>
                      
                      <div className={cn("space-y-6", !showMomentumMobile && "hidden lg:block")}>
                        <div className="p-6 rounded-[1.5rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Flame className="w-5 h-5 text-orange-500" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Daily Streak</span>
                          </div>
                          {Math.max(0, ...goals.map(g => g.streak)) > 0 ? (
                            <>
                              <div className="text-5xl font-black text-slate-900 dark:text-white mb-1">
                                {Math.max(0, ...goals.map(g => g.streak))}
                              </div>
                              <p className="text-xs text-slate-500">
                                {goals.reduce((prev, current) => (prev.streak > current.streak) ? prev : current).title} — {Math.max(0, ...goals.map(g => g.streak))} days
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-slate-500 italic mt-4">Start your streak today</p>
                          )}
                        </div>

                        <div className="p-6 rounded-[1.5rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Goal Progress</span>
                            <button onClick={() => setView('goals')} className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600">see all →</button>
                          </div>
                          <div className="space-y-4">
                            {goals.slice(0, 4).map(goal => {
                              const cat = categories.find(c => c.name === goal.category);
                              return (
                                <div key={goal.id} className="space-y-1.5">
                                  <div className="flex justify-between text-xs">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{goal.title}</span>
                                    <span className="font-bold" style={{ color: cat?.color || '#10b981' }}>{Math.round(goal.progress)}%</span>
                                  </div>
                                  <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${goal.progress}%`, backgroundColor: cat?.color || '#10b981' }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="p-6 rounded-[1.5rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 block">Score Breakdown</span>
                          <div className="space-y-2 mb-4">
                            {todayMilestones.filter(m => m.done).map(task => (
                              <div key={task.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                <span className="truncate max-w-[150px]">{task.title}</span>
                                <span>+{getTaskPoints(task)}</span>
                              </div>
                            ))}
                            {todayMilestones.filter(m => m.done).length === 0 && (
                              <div className="text-xs text-slate-500 italic">No points earned yet</div>
                            )}
                          </div>
                          <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-end">
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Total</span>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">{todayScore}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 italic">
                            {todayScore > 100 ? "Exceptional." : todayScore > 50 ? "Strong day." : todayScore === 0 ? "Start now — every point counts." : "Keep building."}
                          </p>
                        </div>

                        <div className="p-6 rounded-[1.5rem] bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                          <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                            {todayProgress === 100 
                              ? "100% complete. Your consistency is compounding."
                              : todayProgress > 50 
                                ? "Past halfway. The hardest part is behind you."
                                : new Date().getHours() < 12 && todayProgress === 0
                                  ? "The best time to start is right now."
                                  : "Don't let the day close without finishing."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </motion.div>
          ) : view === 'dash' ? (
            <motion.div 
              key="dash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-6xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-2">Dashboard</h2>
                  <p className="dark:text-slate-400 dark:text-slate-500 text-slate-600 text-sm">Welcome back. You have <span className="text-emerald-500 font-bold">{goals.filter(g => g.progress < 100).length}</span> active goals.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                  <button 
                    onClick={() => setIsCustomizingLayout(true)}
                    className="p-2 dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 rounded-xl dark:text-slate-400 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 transition-colors"
                    title="Customize Layout"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <div className="px-4 py-2 dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 rounded-xl flex items-center gap-3">
                    <Calendar className="w-4 h-4 dark:text-slate-500 text-slate-600" />
                    <span className="text-sm font-medium dark:text-slate-300 text-slate-700">{format(currentDate, 'EEEE, MMM do')}</span>
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
                              <p className="dark:text-slate-500 text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                              <h3 className="text-2xl font-extrabold dark:text-white text-slate-900 font-mono">{stat.value}</h3>
                            </Card>
                          ))}
                        </div>
                      );
                    case 'progress':
                      return (
                        <Card key="progress" className="lg:col-span-2 p-8 mb-8" delay={0.2}>
                          <div className="flex justify-between items-center mb-8">
                            <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">Goal Progress</h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold dark:text-slate-400 dark:text-slate-500 text-slate-600 uppercase">Percentage</span>
                            </div>
                          </div>
                          <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid 
                                  strokeDasharray="3 3" 
                                  vertical={false} 
                                  stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
                                />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                  dy={10}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10 }}
                                  allowDecimals={false}
                                  dx={-10}
                                />
                                <Tooltip cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} content={<CustomBarTooltip />} />
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
                    case 'repeatability':
                      return (
                        <Card key="repeatability" className="lg:col-span-3 p-8 mb-8" delay={0.25}>
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">Repeatability Track</h3>
                              <p className="text-xs dark:text-slate-400 dark:text-slate-500 text-slate-600 mt-1">Completed vs Missed repeating goals over the last 7 days</p>
                            </div>
                          </div>
                          <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={repeatabilityData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid 
                                  strokeDasharray="3 3" 
                                  vertical={false} 
                                  stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
                                />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 600 }}
                                  dy={10}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10 }}
                                  allowDecimals={false}
                                  dx={-10}
                                />
                                <Tooltip cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} content={<CustomBarTooltip />} />
                                <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={32} />
                                <Bar dataKey="Missed" stackId="a" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={32} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      );
                    case 'categories':
                      return (
                        <Card key="categories" className="lg:col-span-1 p-8 mb-8" delay={0.25}>
                          <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-8">Categories</h3>
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
                              <span className="text-2xl font-bold dark:text-white text-slate-900">{stats.total}</span>
                              <span className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase">Total</span>
                            </div>
                          </div>
                          <div className="mt-6 space-y-2">
                            {categoryData.map((cat) => (
                              <div key={cat.name} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                  <span className="text-xs font-medium dark:text-slate-400 dark:text-slate-500 text-slate-600">{cat.name}</span>
                                </div>
                                <span className="text-xs font-bold dark:text-white text-slate-900">{cat.value}</span>
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
                              <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">Historical Trends</h3>
                              <p className="text-xs dark:text-slate-400 dark:text-slate-500 text-slate-600 mt-1">Milestone completion over the last 7 days</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-bold">+{productivityInsights.total} this week</span>
                            </div>
                          </div>
                          
                          <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid 
                                  strokeDasharray="3 3" 
                                  stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
                                  vertical={false} 
                                />
                                <XAxis 
                                  dataKey="name" 
                                  stroke={theme === 'dark' ? "#64748b" : "#94a3b8"} 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false}
                                  dy={10}
                                />
                                <YAxis 
                                  stroke={theme === 'dark' ? "#64748b" : "#94a3b8"} 
                                  fontSize={10} 
                                  tickLine={false} 
                                  axisLine={false}
                                  allowDecimals={false}
                                  dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                  type="monotone" 
                                  dataKey="completions" 
                                  stroke="#10b981" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#colorCompletions)" 
                                  animationDuration={1500}
                                  activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t dark:border-white/5 border-slate-200">
                            <div className="p-4 rounded-2xl dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200">
                              <p className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-1">Peak Performance</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold dark:text-white text-slate-900">{productivityInsights.peak}</span>
                                <span className="text-xs text-emerald-400">{productivityInsights.peakValue} completions</span>
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200">
                              <p className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-1">Daily Average</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold dark:text-white text-slate-900">{productivityInsights.avg}</span>
                                <span className="text-xs dark:text-slate-400 dark:text-slate-500 text-slate-600">milestones/day</span>
                              </div>
                            </div>
                            <div className="p-4 rounded-2xl dark:bg-emerald-500/10 bg-emerald-50 border dark:border-emerald-500/20 border-emerald-500/10 col-span-full md:col-span-1">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-1">Productivity Insight</p>
                              <p className="text-xs dark:text-emerald-300 text-emerald-700 leading-relaxed font-medium">
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
                            <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">Today's Focus</h3>
                            <button 
                              onClick={() => { setView('calendar'); setSelectedDate(new Date()); setActiveGoalId(null); }}
                              className="text-[10px] font-bold text-emerald-500 hover:underline uppercase tracking-widest"
                            >
                              Calendar
                            </button>
                          </div>
                          <div className="space-y-4">
                            {todayMilestones.length === 0 ? (
                              <div className="py-10 text-center border border-dashed dark:border-white/5 border-slate-200 rounded-2xl">
                                <p className="text-slate-600 text-xs italic">No milestones for today.</p>
                              </div>
                            ) : (
                              todayMilestones.map(ms => (
                                <div key={ms.id} className="flex items-center gap-3 group">
                                  <button 
                                    onClick={() => {
                                      if (ms.isHabit) {
                                        storage.toggleHabit(ms.id, new Date());
                                        fetchGoals();
                                      } else if (ms.isGoalAsMilestone) {
                                        storage.toggleGoalCompletion(ms.id, new Date());
                                        fetchGoals();
                                      } else {
                                        toggleMilestone(ms.id);
                                      }
                                    }}
                                    className={cn(
                                      "w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200",
                                      ms.done ? "bg-emerald-500 text-[#052e1a]" : "border-2 dark:border-slate-700 border-slate-300 hover:dark:border-slate-500 hover:border-slate-400"
                                    )}
                                  >
                                    {ms.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={cn("text-xs font-bold truncate", ms.done ? "text-slate-600 line-through" : "dark:text-slate-200 text-slate-800")}>
                                      {ms.title}
                                    </p>
                                    <p className="text-[10px] dark:text-slate-500 text-slate-600 uppercase font-bold truncate">{ms.goalTitle}</p>
                                  </div>
                                </div>
                              ))
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
                  <h2 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-2">Manage Goals</h2>
                  <p className="dark:text-slate-400 dark:text-slate-500 text-slate-600 text-sm">You have <span className="text-emerald-500 font-bold">{goals.length}</span> goals in total.</p>
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
                <div className="py-32 text-center border border-dashed dark:border-white/5 border-slate-200 rounded-[40px] dark:bg-white/[0.01] bg-slate-50">
                  <div className="w-20 h-20 dark:bg-white/5 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-10 h-10 dark:text-slate-500 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2">No goals found</h3>
                  <p className="dark:text-slate-500 text-slate-600 text-sm mb-8 max-w-xs mx-auto">Start by creating your first goal to track your progress and achieve your dreams.</p>
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
                        className="group dark:bg-[#111827] bg-white border dark:border-white/5 border-slate-200 rounded-[32px] p-6 flex flex-col hover:dark:bg-white/[0.03] hover:bg-slate-100 hover:dark:border-white/10 hover:border-slate-300 transition-all duration-300 relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl dark:bg-white/5 bg-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                              {cat.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={PRIORITY_COLORS[goal.priority]}>{goal.priority}</Badge>
                                <span className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase tracking-widest">{goal.category}</span>
                                {goal.repeat && goal.repeat !== 'None' && (
                                  <Badge className="text-blue-400 bg-blue-400/10 border-blue-400/20 flex items-center gap-1">
                                    <Clock className="w-2 h-2" />
                                    {goal.repeat}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="text-lg font-bold dark:text-white text-slate-900 truncate max-w-[200px]">{goal.title}</h4>
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
                                  note: goal.note || '',
                                  repeat: goal.repeat || 'None'
                                });
                                setIsAddingGoal(true);
                              }}
                              className="p-2 dark:text-slate-500 text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"
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
                              className="p-2 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 hover:dark:bg-white/5 bg-slate-100 rounded-xl transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGoal(goal.id);
                              }}
                              className="p-2 dark:text-slate-500 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                              title="Delete Goal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <div className="text-2xl font-black dark:text-white text-slate-900 font-mono leading-none">{goal.progress}%</div>
                              <div className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase tracking-widest mt-1">Progress</div>
                            </div>
                            <div className="text-right">
                              {goal.repeat && goal.repeat !== 'None' ? (
                                <>
                                  <div className="text-xs font-bold dark:text-slate-300 text-slate-700">
                                    {goal.completed_dates?.length || 0}
                                  </div>
                                  <div className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase tracking-widest">Completions</div>
                                </>
                              ) : (
                                <>
                                  <div className="text-xs font-bold dark:text-slate-300 text-slate-700">
                                    {(goal.milestones || []).filter(m => m.done).length}/{(goal.milestones || []).length}
                                  </div>
                                  <div className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase tracking-widest">Milestones</div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="h-2 dark:bg-white/5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${goal.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full rounded-full" 
                              style={{ backgroundColor: cat.color, boxShadow: `0 0 10px ${cat.color}40` }} 
                            />
                          </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-6 border-t dark:border-white/5 border-slate-200">
                          <div className="flex items-center gap-2 text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase">
                            <Calendar className="w-3 h-3" />
                            {isValidDate(goal.deadline) ? format(new Date(goal.deadline!), 'MMM d, yyyy') : 'No deadline'}
                          </div>
                          {(!goal.repeat || goal.repeat === 'None') && (
                            <button 
                              onClick={() => {
                                setActiveGoalId(goal.id);
                                setView('detail');
                              }}
                              className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:underline"
                            >
                              Manage Milestones
                            </button>
                          )}
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
                    className="flex items-center gap-2 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 transition-colors mb-6 md:mb-8 group"
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
                        <h2 className="text-4xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-4">{activeGoal.title}</h2>
                        {activeGoal.note && <p className="dark:text-slate-400 text-slate-600 text-lg leading-relaxed italic border-l-2 dark:border-white/10 border-slate-300 pl-6">{activeGoal.note}</p>}
                      </header>

                      <div className="space-y-8">
                        {(!activeGoal.repeat || activeGoal.repeat === 'None') && (
                          <div>
                            <div className="flex justify-between items-center mb-6">
                              <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">Milestones</h3>
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
                                <div className="py-12 text-center dark:bg-white/[0.02] bg-slate-50 border border-dashed dark:border-white/5 border-slate-200 rounded-2xl">
                                  <p className="dark:text-slate-500 text-slate-600 text-sm">No milestones yet. Break down your goal into smaller steps.</p>
                                </div>
                              ) : (
                                (activeGoal.milestones || []).map((ms) => {
                                  const isDone = (ms.repeat && ms.repeat !== 'None') 
                                    ? isCompletedOnDate(ms, new Date())
                                    : (ms.done === 1 || ms.done === true);
                                  
                                  return (
                                    <div 
                                      key={ms.id}
                                      className={cn(
                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200",
                                        isDone
                                          ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" 
                                          : "dark:bg-white/[0.02] bg-slate-50 dark:border-white/5 border-slate-200 hover:dark:border-white/10 hover:border-slate-300"
                                      )}
                                    >
                                      <button 
                                        onClick={() => toggleMilestone(ms.id)}
                                        className={cn(
                                          "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200",
                                          isDone ? "bg-emerald-500 text-[#052e1a]" : "border-2 dark:border-slate-700 border-slate-300 hover:dark:border-slate-500 hover:border-slate-400"
                                        )}
                                      >
                                        {isDone && <CheckCircle2 className="w-4 h-4" />}
                                      </button>
                                      <div className="flex-1 min-w-0">
                                        <h5 className={cn("text-sm font-bold truncate", isDone ? "dark:text-slate-400 dark:text-slate-500 text-slate-600 line-through" : "dark:text-white text-slate-900")}>
                                          {ms.title}
                                        </h5>
                                        <div className="flex items-center gap-2 mt-1">
                                          {ms.due_date && isValidDate(ms.due_date) && (
                                            <p className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase">Due {format(new Date(ms.due_date), 'MMM d')}</p>
                                          )}
                                          {ms.repeat && ms.repeat !== 'None' && (
                                            <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1 rounded">Repeats {ms.repeat}</span>
                                          )}
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => deleteMilestone(ms.id)}
                                        className="p-2 dark:text-slate-500 text-slate-600 hover:text-rose-400 transition-colors"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
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
                              className="dark:text-white text-slate-900/5"
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
                            <span className="text-3xl font-black dark:text-white text-slate-900 font-mono">{activeGoal.progress}%</span>
                            <span className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase">Done</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between text-xs">
                            <span className="dark:text-slate-500 text-slate-600 font-bold uppercase tracking-widest">Status</span>
                            <span className={cn("font-bold", activeGoal.progress === 100 ? "text-emerald-500" : "text-amber-400")}>
                              {activeGoal.progress === 100 ? 'Completed' : 'In Progress'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="dark:text-slate-500 text-slate-600 font-bold uppercase tracking-widest">Deadline</span>
                            <span className="dark:text-white text-slate-900 font-bold">
                              {isValidDate(activeGoal.deadline) ? format(new Date(activeGoal.deadline!), 'MMM d, yyyy') : 'None'}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="dark:text-slate-500 text-slate-600 font-bold uppercase tracking-widest">Streak</span>
                            <span className="text-orange-400 font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {activeGoal.streak} Days
                            </span>
                          </div>
                        </div>
                        <div className="mt-8 pt-8 border-t dark:border-white/5 border-slate-200">
                          <button 
                            onClick={() => handleDeleteGoal(activeGoal.id)}
                            className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest hover:bg-rose-500/10 transition-colors"
                          >
                            Delete Goal
                          </button>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-4">Insights</h4>
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-xs font-bold dark:text-white text-slate-900 mb-0.5">Momentum</p>
                              <p className="text-[10px] dark:text-slate-500 text-slate-600 leading-relaxed">
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
                                <p className="text-[10px] dark:text-slate-500 text-slate-600 leading-relaxed">The target date has passed. Consider adjusting your timeline.</p>
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
                  <p className="dark:text-slate-500 text-slate-600">Goal not found.</p>
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
                  <h2 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-2">Categories</h2>
                  <p className="dark:text-slate-400 dark:text-slate-500 text-slate-600 text-sm">Manage your goal categories.</p>
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
                      <h4 className="dark:text-white text-slate-900 font-bold text-lg">{cat.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs dark:text-slate-400 dark:text-slate-500 text-slate-600 uppercase tracking-wider font-mono">{cat.color}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingCategory(cat)}
                        className="p-2 dark:text-slate-400 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 dark:bg-white/5 bg-slate-100 hover:dark:bg-white/10 bg-slate-200 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 text-rose-400 hover:dark:text-white text-slate-900 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ) : view === 'habits' ? (
            <motion.div 
              key="habits"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 md:p-8 max-w-5xl mx-auto w-full"
            >
              <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-2">Habits</h2>
                  <p className="dark:text-slate-500 text-slate-600 font-medium">Build consistency with daily rituals.</p>
                </div>
                <button 
                  onClick={() => setIsAddingHabit(true)}
                  className="w-full md:w-auto px-6 py-3 bg-emerald-500 text-[#052e1a] rounded-2xl font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  New Habit
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {habits.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Activity className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2">No habits yet</h3>
                    <p className="dark:text-slate-500 text-slate-600 mb-8">Start small. Consistency is the key to mastery.</p>
                    <button 
                      onClick={() => setIsAddingHabit(true)}
                      className="px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-sm hover:bg-emerald-500/20 transition-colors"
                    >
                      Create your first habit
                    </button>
                  </div>
                ) : (
                  habits.map(habit => {
                    const cat = categories.find(c => c.name === habit.category) || { color: '#64748b', icon: '🎯' };
                    const isDoneToday = isCompletedOnDate(habit, new Date());
                    
                    return (
                      <Card key={habit.id} className="p-6 group hover:dark:border-white/10 hover:border-slate-300 transition-all duration-300">
                        <div className="flex justify-between items-start mb-6">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            {cat.icon}
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => {
                                setEditingHabit(habit);
                                setNewHabit(habit);
                                setIsAddingHabit(true);
                              }}
                              className="p-2 dark:text-slate-500 text-slate-400 hover:dark:text-white hover:text-slate-900 transition-colors"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="p-2 dark:text-slate-500 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-lg font-bold dark:text-white text-slate-900 mb-1 group-hover:text-emerald-500 transition-colors">{habit.title}</h4>
                        <p className="text-xs dark:text-slate-500 text-slate-600 mb-6 uppercase tracking-widest font-bold">{habit.repeat} • {habit.category}</p>

                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                              <Flame className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold dark:text-slate-500 text-slate-600 uppercase tracking-tighter">Streak</p>
                              <p className="text-xl font-black dark:text-white text-slate-900">{habit.streak} Days</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              storage.toggleHabit(habit.id);
                              fetchGoals();
                            }}
                            className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg",
                              isDoneToday 
                                ? "bg-emerald-500 text-[#052e1a] shadow-emerald-500/20" 
                                : "dark:bg-white/5 bg-slate-100 dark:text-slate-500 text-slate-400 hover:dark:bg-white/10 hover:bg-slate-200"
                            )}
                          >
                            {isDoneToday ? <CheckCircle2 className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                          </button>
                        </div>

                        {habit.due_date && (
                          <div className="pt-4 border-t dark:border-white/5 border-slate-200">
                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">
                              <span>Target Date</span>
                              <span>{format(parseISO(habit.due_date), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })
                )}
              </div>
            </motion.div>
          ) : view === 'calendar' ? (
            <DndContext onDragStart={handleCalendarDragStart} onDragEnd={handleCalendarDragEnd}>
              <motion.div 
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 md:p-8 max-w-6xl mx-auto w-full"
              >
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-10 gap-4">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-2">Calendar</h2>
                    <p className="dark:text-slate-500 text-slate-600 font-medium">Track your daily milestones and achievements.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setView('assign-tasks')}
                      className="w-full sm:w-auto justify-center px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-sm hover:bg-emerald-500/20 transition-colors flex items-center gap-2 border border-emerald-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      Assign Tasks
                    </button>
                    <div className="flex items-center justify-between gap-4 dark:bg-white/5 bg-slate-100 p-1 rounded-xl border dark:border-white/5 border-slate-200">
                      <button 
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 dark:text-slate-400 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 hover:dark:bg-white/5 bg-slate-100 rounded-lg transition-all"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-bold dark:text-white text-slate-900 min-w-[120px] text-center uppercase tracking-widest">
                        {format(currentMonth, 'MMMM yyyy')}
                      </span>
                      <button 
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 dark:text-slate-400 dark:text-slate-500 text-slate-600 hover:dark:text-white text-slate-900 hover:dark:bg-white/5 bg-slate-100 rounded-lg transition-all"
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
                        <div key={day} className="text-center text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 py-2">
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
                          const dayMilestones = getItemsForDate(day);

                          return (
                            <DroppableCalendarDay
                              key={day.toString()}
                              day={day}
                              isCurrentMonth={isCurrentMonth}
                              isSelected={isSelected}
                              isTodayDay={isTodayDay}
                              dayMilestones={dayMilestones}
                              onClick={() => setSelectedDate(day)}
                            />
                          );
                        });
                      })()}
                    </div>
                  </Card>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Day Details */}
                    <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">
                          {isToday(selectedDate) ? "Today's Schedule" : format(selectedDate, 'MMMM d, yyyy')}
                        </h3>
                        <p className="text-xs dark:text-slate-500 text-slate-600 mt-1">{milestonesForSelectedDate.length} Milestones</p>
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
                          <div className="py-12 text-center border border-dashed dark:border-white/5 border-slate-200 rounded-2xl">
                            <p className="dark:text-slate-500 text-slate-600 text-xs italic">No milestones scheduled for this day.</p>
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
                                ms.done ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "dark:bg-white/[0.02] bg-slate-50 dark:border-white/5 border-slate-200 hover:dark:border-white/10 hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <button 
                                  onClick={() => {
                                    if (ms.isHabit) {
                                      storage.toggleHabit(ms.id, selectedDate);
                                      fetchGoals();
                                    } else if (ms.isGoalAsMilestone) {
                                      storage.toggleGoalCompletion(ms.id, selectedDate);
                                      fetchGoals();
                                    } else {
                                      storage.toggleMilestone(ms.id, selectedDate);
                                      fetchGoals();
                                    }
                                  }}
                                  className={cn(
                                    "mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-200",
                                    ms.done ? "bg-emerald-500 text-[#052e1a]" : "border-2 dark:border-slate-700 border-slate-300 hover:dark:border-slate-500 hover:border-slate-400"
                                  )}
                                >
                                  {ms.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn("text-sm font-bold truncate", ms.done ? "dark:text-slate-500 text-slate-600 line-through" : "dark:text-white text-slate-900")}>
                                    {ms.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ms.categoryColor }} />
                                    <span className="text-[10px] font-bold dark:text-slate-500 text-slate-600 uppercase truncate">{ms.goalTitle}</span>
                                    {ms.isGoalAsMilestone && (
                                      <span className="text-[10px] text-blue-400 bg-blue-400/10 px-1 rounded ml-1">Repeating Goal</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </Card>

                  {/* Unassigned Milestones Sidebar */}
                  <Card className="p-6 flex flex-col h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600">Unassigned</h3>
                      <Badge className="dark:bg-emerald-500/10 bg-emerald-50 text-emerald-500 border-emerald-500/20">
                        {unassignedMilestones.length}
                      </Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                      {unassignedMilestones.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500/20 mb-2" />
                          <p className="dark:text-slate-500 text-slate-600 text-xs italic">All milestones are assigned!</p>
                        </div>
                      ) : (
                        unassignedMilestones.map(ms => (
                          <DraggableMilestone key={ms.id} milestone={ms} goalTitle={ms.goalTitle} />
                        ))
                      )}
                    </div>
                    <p className="text-[10px] dark:text-slate-500 text-slate-600 mt-4 text-center italic">
                      Drag and drop onto the calendar to assign a due date.
                    </p>
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
                          {todayMilestones.map(ms => (
                            <div key={ms.id} className="flex items-center gap-2">
                              <div className={cn("w-1 h-1 rounded-full", ms.done ? "bg-emerald-500" : "bg-slate-700")} />
                              <span className={cn("text-xs truncate", ms.done ? "dark:text-slate-500 text-slate-600 line-through" : "dark:text-slate-300 text-slate-700")}>
                                {ms.title}
                              </span>
                            </div>
                          ))}
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
              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.5',
                    },
                  },
                }),
              }}>
                {activeCalendarDragId && activeCalendarMilestone ? (
                  <div className="p-3 rounded-xl border border-emerald-500/50 bg-emerald-500/10 shadow-xl shadow-emerald-500/20 pointer-events-none backdrop-blur-md">
                    <p className="text-xs font-bold dark:text-white text-slate-900 truncate">{activeCalendarMilestone.title}</p>
                    <p className="text-[10px] dark:text-slate-500 text-slate-600 truncate">{activeCalendarMilestone.goalTitle}</p>
                  </div>
                ) : null}
                </DragOverlay>
              </motion.div>
            </DndContext>
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
              className="relative w-full max-w-md dark:bg-[#0f172a] bg-slate-50 border dark:border-white/10 border-slate-300 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-2">Customize Dashboard</h3>
                <p className="dark:text-slate-500 text-slate-600 text-sm mb-8">Drag to reorder widgets and toggle visibility.</p>
                
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
                      className="flex items-center gap-4 p-4 dark:bg-white/5 bg-slate-100 border dark:border-white/5 border-slate-200 rounded-2xl cursor-grab active:cursor-grabbing group"
                    >
                      <GripVertical className="w-4 h-4 dark:text-slate-500 text-slate-600 group-hover:dark:text-slate-400 transition-colors" />
                      <span className="flex-1 text-sm font-bold dark:text-slate-200 text-slate-800">{widget.label}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDashboardLayout(prev => prev.map(w => 
                            w.id === widget.id ? { ...w, visible: !w.visible } : w
                          ));
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          widget.visible ? "text-emerald-500 bg-emerald-500/10" : "text-slate-600 dark:bg-white/5 bg-slate-100"
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
                        { id: 'repeatability', visible: true, label: 'Repeatability Track' },
                        { id: 'categories', visible: true, label: 'Category Breakdown' },
                        { id: 'focus', visible: true, label: "Today's Focus" },
                      ];
                      setDashboardLayout(defaultLayout);
                    }}
                    className="w-full py-4 rounded-2xl dark:bg-white/5 bg-slate-100 dark:text-slate-400 dark:text-slate-500 text-slate-600 font-bold text-sm hover:dark:bg-white/10 bg-slate-200 transition-colors"
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
              className="relative w-full max-w-lg dark:bg-[#111827] bg-white border dark:border-white/10 border-slate-300 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-8">{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
                <form onSubmit={handleAddGoal} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Goal Title</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="What do you want to achieve?"
                      className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={newGoal.title}
                      onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Category</label>
                      <div className="relative">
                        <select 
                          className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newGoal.category}
                          onChange={e => setNewGoal({...newGoal, category: e.target.value})}
                        >
                          {categories.map(cat => <option key={cat.id} value={cat.name} className="dark:bg-[#111827] bg-white">{cat.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Priority</label>
                      <div className="relative">
                        <select 
                          className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newGoal.priority}
                          onChange={e => setNewGoal({...newGoal, priority: e.target.value as any})}
                        >
                          <option value="High" className="dark:bg-[#111827] bg-white">High</option>
                          <option value="Medium" className="dark:bg-[#111827] bg-white">Medium</option>
                          <option value="Low" className="dark:bg-[#111827] bg-white">Low</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Deadline</label>
                      <input 
                        type="date" 
                        className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                        value={newGoal.deadline}
                        onChange={e => setNewGoal({...newGoal, deadline: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Repeat</label>
                      <div className="relative">
                        <select 
                          className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newGoal.repeat}
                          onChange={e => setNewGoal({...newGoal, repeat: e.target.value as any})}
                        >
                          <option value="None" className="dark:bg-[#111827] bg-white">No Repeat</option>
                          <option value="Daily" className="dark:bg-[#111827] bg-white">Daily</option>
                          <option value="Weekly" className="dark:bg-[#111827] bg-white">Weekly</option>
                          <option value="Monthly" className="dark:bg-[#111827] bg-white">Monthly</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Note (Optional)</label>
                    <textarea 
                      placeholder="Add some context or motivation..."
                      className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors h-24 resize-none"
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
                        setNewGoal({ title: '', category: categories[0]?.name || 'Health', priority: 'Medium', deadline: '', note: '', repeat: 'None' });
                      }}
                      className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-slate-100 dark:text-slate-400 dark:text-slate-500 text-slate-600 font-bold text-sm hover:dark:bg-white/10 bg-slate-200 transition-colors"
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
        {isAddingHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingHabit(false);
                setEditingHabit(null);
                setNewHabit({ title: '', category: categories[0]?.name || 'Health', repeat: 'Daily', due_date: '' });
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg dark:bg-[#111827] bg-white border dark:border-white/10 border-slate-300 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-2xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-8">{editingHabit ? 'Edit Habit' : 'New Habit'}</h3>
                <form onSubmit={handleAddHabit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Habit Title</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="What habit do you want to build?"
                      className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={newHabit.title}
                      onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Category</label>
                      <div className="relative">
                        <select 
                          className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newHabit.category}
                          onChange={e => setNewHabit({...newHabit, category: e.target.value})}
                        >
                          {categories.map(cat => <option key={cat.id} value={cat.name} className="dark:bg-[#111827] bg-white">{cat.name}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Repeat</label>
                      <div className="relative">
                        <select 
                          className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newHabit.repeat}
                          onChange={e => setNewHabit({...newHabit, repeat: e.target.value as any})}
                        >
                          <option value="Daily" className="dark:bg-[#111827] bg-white">Daily</option>
                          <option value="Weekly" className="dark:bg-[#111827] bg-white">Weekly</option>
                          <option value="Monthly" className="dark:bg-[#111827] bg-white">Monthly</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Target End Date (Optional)</label>
                    <input 
                      type="date" 
                      className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                      onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                      value={newHabit.due_date}
                      onChange={e => setNewHabit({...newHabit, due_date: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsAddingHabit(false);
                        setEditingHabit(null);
                        setNewHabit({ title: '', category: categories[0]?.name || 'Health', repeat: 'Daily', due_date: '' });
                      }}
                      className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-slate-100 dark:text-slate-400 dark:text-slate-500 text-slate-600 font-bold text-sm hover:dark:bg-white/10 bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 rounded-xl bg-emerald-500 text-[#052e1a] font-bold text-sm hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                      {editingHabit ? 'Save Changes' : 'Create Habit'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}

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
              className="relative w-full max-w-md dark:bg-[#111827] bg-white border dark:border-white/10 border-slate-300 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-6">Add Milestone</h3>
                <form onSubmit={handleAddMilestone} className="space-y-5">
                  {!activeGoalId && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Select Goal</label>
                      <div className="relative">
                        <select 
                          required
                          className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none cursor-pointer pr-10"
                          value={newMilestone.goal_id}
                          onChange={e => setNewMilestone({...newMilestone, goal_id: e.target.value})}
                        >
                          <option value="" disabled className="dark:bg-[#111827] bg-white">Choose a goal...</option>
                          {goals.map(g => (
                            <option key={g.id} value={g.id} className="dark:bg-[#111827] bg-white">{g.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Milestone Title</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="e.g. Complete first draft"
                      className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={newMilestone.title}
                      onChange={e => setNewMilestone({...newMilestone, title: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">
                        Due Date {newMilestone.repeat !== 'None' ? '(Required for Recurring)' : '(Optional)'}
                      </label>
                      <input 
                        type="date" 
                        required={newMilestone.repeat !== 'None'}
                        className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors cursor-pointer"
                        onClick={(e) => (e.target as HTMLInputElement).showPicker()}
                        value={newMilestone.due_date}
                        onChange={e => setNewMilestone({...newMilestone, due_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Repeat</label>
                      <div className="relative">
                        <select 
                          className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 focus:outline-none focus:border-emerald-500/50 transition-colors appearance-none pr-10"
                          value={newMilestone.repeat}
                          onChange={e => setNewMilestone({...newMilestone, repeat: e.target.value as any})}
                        >
                          <option value="None" className="dark:bg-[#111827] bg-white">No Repeat</option>
                          <option value="Daily" className="dark:bg-[#111827] bg-white">Daily</option>
                          <option value="Weekly" className="dark:bg-[#111827] bg-white">Weekly</option>
                          <option value="Monthly" className="dark:bg-[#111827] bg-white">Monthly</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-600 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsAddingMilestone(false)}
                      className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-slate-100 dark:text-slate-400 dark:text-slate-500 text-slate-600 font-bold text-sm hover:dark:bg-white/10 bg-slate-200 transition-colors"
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
              className="relative w-full max-w-md dark:bg-[#111827] bg-white border dark:border-white/10 border-slate-300 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-extrabold dark:text-white text-slate-900 tracking-tight mb-6">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <form onSubmit={editingCategory ? handleEditCategory : handleAddCategory} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Name</label>
                    <input 
                      autoFocus
                      required
                      type="text" 
                      placeholder="e.g. Travel"
                      className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                      value={editingCategory ? editingCategory.name : newCategory.name}
                      onChange={e => editingCategory 
                        ? setEditingCategory({...editingCategory, name: e.target.value})
                        : setNewCategory({...newCategory, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Color</label>
                      <input 
                        type="color" 
                        className="w-full h-12 dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-2 py-1 cursor-pointer"
                        value={editingCategory ? editingCategory.color : newCategory.color}
                        onChange={e => editingCategory 
                          ? setEditingCategory({...editingCategory, color: e.target.value})
                          : setNewCategory({...newCategory, color: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest dark:text-slate-500 text-slate-600 mb-2">Icon (Emoji)</label>
                      <input 
                        required
                        type="text" 
                        maxLength={2}
                        className="w-full dark:bg-white/5 bg-slate-100 border dark:border-white/10 border-slate-300 rounded-xl px-4 py-3 dark:text-white text-slate-900 text-center text-xl focus:outline-none focus:border-emerald-500/50 transition-colors"
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
                      className="flex-1 py-3 rounded-xl dark:bg-white/5 bg-slate-100 dark:text-slate-400 dark:text-slate-500 text-slate-600 font-bold text-sm hover:dark:bg-white/10 bg-slate-200 transition-colors"
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
