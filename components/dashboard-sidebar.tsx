'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';
import { getSupabaseClient } from '@/lib/supabase';

export default function DashboardSidebar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('finguard_theme') || 'dark';
    setTheme(saved as 'dark' | 'light');
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('finguard_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLogout = async () => {
    // Sign out from Supabase
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    // Clear localStorage bridge
    localStorage.removeItem('finguard_currentUser');
    router.push('/');
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(activeTab === tab ? 'home' : tab);
  };

  return (
    <div className="w-20 bg-card border-r border-border flex flex-col items-center py-6 space-y-8">
      <Link
        href="/dashboard"
        className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-foreground font-bold text-lg hover:shadow-lg hover:shadow-primary/50 transition"
        onClick={() => setActiveTab('home')}
      >
        F
      </Link>

      <nav className="flex-1 flex flex-col items-center space-y-6">
        <SidebarButton icon="home" label="Dashboard" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <SidebarButton icon="profile" label="Profile" active={activeTab === 'profile'} onClick={() => handleTabClick('profile')} />
        <SidebarButton icon="calendar" label="Calendar" active={activeTab === 'calendar'} onClick={() => handleTabClick('calendar')} />
        <SidebarButton icon="insights" label="Insights" active={activeTab === 'insights'} onClick={() => handleTabClick('insights')} />
      </nav>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-12 h-12 flex items-center justify-center rounded-lg text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-all hover:scale-110"
        title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 000-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>
        )}
      </button>

      <button
        onClick={handleLogout}
        className="w-12 h-12 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all hover:scale-110"
        title="Logout"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
        </svg>
      </button>

      {/* Profile / Calendar side panel */}
      {(activeTab === 'profile' || activeTab === 'calendar') && (
        <div className="fixed left-20 top-0 bottom-0 w-80 bg-card border-r border-border overflow-y-auto z-40 shadow-xl">
          <button
            onClick={() => setActiveTab('home')}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-primary/10 transition"
          >
            x
          </button>
          {activeTab === 'profile' && <ProfilePanel />}
          {activeTab === 'calendar' && <CalendarPanel />}
        </div>
      )}

      {/* Insights FULL OVERLAY */}
      {activeTab === 'insights' && (
        <InsightsOverlay onClose={() => setActiveTab('home')} />
      )}
    </div>
  );
}

function SidebarButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  const icons: Record<string, string> = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    profile: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
    calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
    insights: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
  };

  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all hover:scale-110 ${
        active
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/50'
          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
      }`}
      title={label}
    >
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d={icons[icon]} />
      </svg>
    </button>
  );
}

function ProfilePanel() {
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { setLoading(false); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (data) {
        const p = {
          monthlyIncome: String(data.monthly_income),
          monthlyBudget: String(data.monthly_budget),
          weeklyLimit: String(data.weekly_limit),
          savingsGoal: data.savings_goal || 'emergency',
          savingsTarget: String(data.savings_target),
        };
        setProfile(p);
        setEditForm(p);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsEditing(false);
    setProfile(editForm);

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { error } = await supabase.from('profiles').upsert({
          user_id: session.user.id,
          monthly_income: parseFloat(editForm.monthlyIncome) || 50000,
          monthly_budget: parseFloat(editForm.monthlyBudget) || 30000,
          savings_goal: editForm.savingsGoal || 'emergency',
          savings_target: parseFloat(editForm.savingsTarget) || 100000,
        }, { onConflict: 'user_id' });
        if (error) console.error('Failed to save profile to Supabase:', error);
      }
    } catch (err) {
      console.error('Error saving profile to Supabase:', err);
    }

    window.location.reload();
  };

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground text-sm">Loading profile...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Profile</h2>
        <p className="text-muted-foreground text-xs">Your financial profile</p>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {[
            { label: 'Monthly Income', key: 'monthlyIncome', type: 'number' },
            { label: 'Monthly Budget', key: 'monthlyBudget', type: 'number' },
            { label: 'Weekly Limit', key: 'weeklyLimit', type: 'number' },
            { label: 'Savings Target (Rs.)', key: 'savingsTarget', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-semibold mb-1">{label}</label>
              <input
                type={type}
                value={editForm[key] || ''}
                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold mb-1">Savings Goal</label>
            <select
              value={editForm.savingsGoal || 'emergency'}
              onChange={(e) => setEditForm({ ...editForm, savingsGoal: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            >
              <option value="emergency">Emergency Fund</option>
              <option value="vacation">Vacation</option>
              <option value="investment">Investment</option>
              <option value="education">Education</option>
              <option value="gadget">Gadget</option>
              <option value="vehicle">Vehicle</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="flex-1 py-2 px-3 bg-card border border-border rounded-lg text-sm font-semibold hover:bg-primary/10 transition">Cancel</button>
            <button onClick={handleSave} className="flex-1 py-2 px-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:shadow-lg transition">Save</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {[
            { label: 'Monthly Income', value: profile.monthlyIncome },
            { label: 'Monthly Budget', value: profile.monthlyBudget },
            { label: 'Weekly Limit', value: profile.weeklyLimit },
            { label: 'Savings Goal', value: profile.savingsGoal },
            { label: 'Savings Target', value: profile.savingsTarget },
          ].map(({ label, value }) => (
            <div key={label} className="bg-background rounded-lg p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
              <p className="text-lg font-bold mt-1">{value ? (label === 'Savings Goal' ? value : `Rs.${parseInt(value).toLocaleString()}`) : 'Not set'}</p>
            </div>
          ))}
          <button
            onClick={() => { setEditForm(profile); setIsEditing(true); }}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:shadow-lg transition"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarPanel() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDayExpenses, setSelectedDayExpenses] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Load expenses from Supabase
  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });
      if (data) setAllExpenses(data.map(e => ({ id: e.id, amount: Number(e.amount), category: e.category, description: e.description || '', date: e.date })));
    };
    load();
  }, []);

  const getExpensesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allExpenses.filter((exp: any) => new Date(exp.date).toISOString().split('T')[0] === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
    setSelectedDayExpenses(getExpensesForDay(day));
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Expense Calendar</h2>
        <p className="text-muted-foreground text-xs">Tap a date to see expenses</p>
      </div>

      <div className="bg-background rounded-xl p-4">
        <p className="text-center font-semibold text-sm mb-3">
          {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>

        <div className="grid grid-cols-7 gap-1">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
            <div key={`h-${i}`} className="text-center text-xs font-bold text-muted-foreground py-1.5">{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = day === now.getDate();
            const isSelected = selectedDate === dateStr;
            const hasExpenses = getExpensesForDay(day).length > 0;

            return (
              <button
                key={`d-${day}`}
                onClick={() => handleDateClick(day)}
                className={`aspect-square text-xs rounded-lg transition-all flex flex-col items-center justify-center relative ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold'
                    : isToday
                    ? 'bg-primary/20 text-primary font-bold ring-1 ring-primary/40'
                    : 'hover:bg-primary/10 text-foreground'
                }`}
              >
                {day}
                {hasExpenses && !isSelected && (
                  <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            {selectedDate}
          </p>
          {selectedDayExpenses.length > 0 ? (
            selectedDayExpenses.map((exp: any) => (
              <div key={exp.id} className="bg-background rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold capitalize">{exp.category}</p>
                  {exp.description && <p className="text-xs text-muted-foreground">{exp.description}</p>}
                </div>
                <p className="text-sm font-bold text-primary">Rs.{exp.amount}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No expenses on this date</p>
          )}
        </div>
      )}
    </div>
  );
}

function InsightsOverlay({ onClose }: { onClose: () => void }) {
  const [gemmaAnalysis, setGemmaAnalysis] = useState<any>(null);
  const [gemmaLoading, setGemmaLoading] = useState(true);
  const [data, setData] = useState<{ expenses: any[]; profile: any } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Load profile + expenses from Supabase
  useEffect(() => {
    const loadData = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) { setDataLoading(false); return; }

      const [profileRes, expensesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', session.user.id).single(),
        supabase.from('expenses').select('*').eq('user_id', session.user.id).order('date', { ascending: false }),
      ]);

      const profile = profileRes.data ? {
        monthlyIncome: String(profileRes.data.monthly_income),
        monthlyBudget: String(profileRes.data.monthly_budget),
        weeklyLimit: String(profileRes.data.weekly_limit),
        savingsGoal: profileRes.data.savings_goal || 'emergency',
        savingsTarget: String(profileRes.data.savings_target),
      } : {};

      const expenses = (expensesRes.data || []).map((e: any) => ({
        id: e.id, amount: Number(e.amount), category: e.category, description: e.description || '', date: e.date,
      }));

      setData({ expenses, profile });
      setDataLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (dataLoading) return;
    if (!data || data.expenses.length === 0) { setGemmaLoading(false); return; }
    const { expenses: exps, profile: prof } = data;
    const inc = parseInt(prof.monthlyIncome || '50000');
    const bud = parseInt(prof.monthlyBudget || '30000');
    const n = new Date();
    const mExps = exps.filter((e: any) => { const d = new Date(e.date); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); });
    const mTot = mExps.reduce((s: number, e: any) => s + e.amount, 0);
    const dim = new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate();
    const de = Math.max(n.getDate(), 1);
    const cats: Record<string, number> = {};
    mExps.forEach((e: any) => { cats[e.category] = (cats[e.category] || 0) + e.amount; });
    fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monthly_income: inc, monthly_budget: bud, month_total: mTot, category_breakdown: cats, days_elapsed: de, days_in_month: dim, savings_goal: prof.savingsGoal || 'emergency', savings_target: parseInt(prof.savingsTarget || '100000'), transaction_count: mExps.length }),
    }).then(r => r.json()).then(r => setGemmaAnalysis(r)).catch(() => {}).finally(() => setGemmaLoading(false));
  }, [data, dataLoading]);

  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md text-center shadow-2xl">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.expenses.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">No Data Yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Log some expenses to see charts and behavioral insights.</p>
          <button onClick={onClose} className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:shadow-lg transition">
            Got it
          </button>
        </div>
      </div>
    );
  }

  const { expenses, profile } = data;
  const monthlyBudget = parseInt(profile.monthlyBudget || '30000');
  const monthlyIncome = parseInt(profile.monthlyIncome || '50000');

  const now = new Date();

  // Current month expenses
  const monthExpenses = expenses.filter((e: any) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = monthExpenses.reduce((s: number, e: any) => s + e.amount, 0);

  // Category breakdown for pie chart
  const catTotals: Record<string, number> = {};
  monthExpenses.forEach((e: any) => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const COLORS = ['#10b981', '#fbbf24', '#3b82f6', '#8b5cf6', '#ef4444', '#6b7280'];
  const catNames: Record<string, string> = { food: 'Food', transport: 'Transport', shopping: 'Shopping', entertainment: 'Entertainment', utilities: 'Utilities', other: 'Other' };
  const pieData = Object.entries(catTotals).map(([cat, val]) => ({ name: catNames[cat] || cat, value: val })).sort((a, b) => b.value - a.value);

  // Daily spending for area chart (last 14 days)
  const dailyData: { day: string; amount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayTotal = expenses.filter((e: any) => new Date(e.date).toISOString().split('T')[0] === dateStr).reduce((s: number, e: any) => s + e.amount, 0);
    dailyData.push({ day: dayLabel, amount: dayTotal });
  }

  // FIXED: Weekly bar chart (last 4 weeks) - now includes today's expenses
  const weeklyData: { week: string; amount: number }[] = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    weekEnd.setHours(23, 59, 59, 999);
    const weekTotal = expenses.filter((e: any) => {
      const d = new Date(e.date);
      return d >= weekStart && d <= weekEnd;
    }).reduce((s: number, e: any) => s + e.amount, 0);
    weeklyData.push({ week: `Week ${4 - w}`, amount: weekTotal });
  }

  // FIXED: Time of day analysis for bar chart - corrected overnight logic
  const hourBuckets = [
    { label: '6am-12pm', min: 6, max: 12 },
    { label: '12pm-5pm', min: 12, max: 17 },
    { label: '5pm-9pm', min: 17, max: 21 },
    { label: '9pm-6am', min: 21, max: 6 }, // Changed max from 30 to 6
  ];
  const timeData = hourBuckets.map(({ label, min, max }) => {
    const total = expenses.filter((e: any) => {
      const h = new Date(e.date).getHours();
      // FIXED: Proper overnight logic
      if (label === '9pm-6am') {
        return (h >= 21 && h <= 23) || (h >= 0 && h < 6);
      }
      return h >= min && h < max;
    }).reduce((s: number, e: any) => s + e.amount, 0);
    return { time: label, amount: total };
  });

  // Savings tracker — project full month using actual spending pace
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = Math.max(now.getDate(), 1);
  
  // FIXED: Added safeguard for early month projections (require at least 3 days)
  const projectedMonthSpending = daysElapsed >= 3 
    ? (monthTotal / daysElapsed) * daysInMonth 
    : monthTotal; // Use actual spending if less than 3 days
  
  const projectedMonthlySavings = Math.max(monthlyIncome - projectedMonthSpending, 0);
  const savingsTarget = parseInt(profile.savingsTarget || '100000');
  const savingsGoal = profile.savingsGoal || 'emergency';
  const projectedAnnual = projectedMonthlySavings * 12;
  const monthsToGoal = projectedMonthlySavings > 0 ? Math.ceil(savingsTarget / projectedMonthlySavings) : Infinity;
  const savingsRate = monthlyIncome > 0 ? ((projectedMonthlySavings / monthlyIncome) * 100) : 0;
  const budgetRemaining = Math.max(monthlyBudget - monthTotal, 0);
  const budgetUsedPct = monthlyBudget > 0 ? ((monthTotal / monthlyBudget) * 100) : 0;

  // Behavioral insights
  const insights: string[] = [];
  const topCat = pieData[0];
  if (topCat) insights.push(`Highest category: ${topCat.name} at Rs.${topCat.value.toFixed(0)} — ${((topCat.value / monthTotal) * 100).toFixed(0)}% of your spending.`);

  const peakTime = [...timeData].sort((a, b) => b.amount - a.amount)[0];
  if (peakTime && peakTime.amount > 0) insights.push(`Peak spending window: ${peakTime.time}. Be extra mindful during this period.`);

  if (projectedMonthSpending > monthlyBudget) {
    insights.push(`At current pace, projected: Rs.${Math.round(projectedMonthSpending).toLocaleString()} — over budget by Rs.${Math.round(projectedMonthSpending - monthlyBudget).toLocaleString()}.`);
  } else {
    insights.push(`On track: Rs.${Math.round(projectedMonthSpending).toLocaleString()} projected vs Rs.${monthlyBudget.toLocaleString()} budget — Rs.${Math.round(monthlyBudget - projectedMonthSpending).toLocaleString()} under.`);
  }

  if (savingsRate < 10) insights.push(`Projected savings rate: ${savingsRate.toFixed(0)}%. Aim for 20%+ for financial health.`);
  else if (savingsRate >= 30) insights.push(`Strong ${savingsRate.toFixed(0)}% projected savings rate. You're building wealth.`);

  const tooltipStyle = { background: '#111827', border: '1px solid #374151', borderRadius: '12px', fontSize: '12px', color: '#f0f4f8', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', padding: '10px 14px' };
  const tLbl = { color: '#94a3b8', fontWeight: 600 as const, fontSize: '11px', marginBottom: '4px' };
  const tItm = { color: '#f0f4f8', fontSize: '13px', fontWeight: 700 as const };

  // Format Rs. amounts: use L for lakhs, K for thousands, or plain number
  const fmtRs = (v: number) => {
    const abs = Math.abs(Math.round(v));
    if (abs >= 100000) return `${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}K`;
    return abs.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-start justify-center overflow-y-auto">
      <div className="w-full max-w-4xl mx-4 my-8 space-y-5 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground">Behavioral Analytics</h1>
            <p className="text-sm text-muted-foreground mt-1">Pattern analysis and savings tracking</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-primary/10 transition"
          >
            x
          </button>
        </div>

        {/* Row 1: Pie chart + Savings Tracker */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Category breakdown */}
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Spending by Category</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tLbl} itemStyle={tItm} formatter={(val: number) => [`Rs.${val.toFixed(0)}`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Savings Tracker */}
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Savings Tracker</h3>
            <div className="space-y-4">
              <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Total remaining</span>
                  <span className={`text-xl font-black ${budgetRemaining > 0 ? 'text-primary' : 'text-destructive'}`}>
                    Rs.{Math.round(budgetRemaining).toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-card rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all ${budgetRemaining > 0 ? 'bg-gradient-to-r from-primary to-accent' : 'bg-destructive'}`}
                    style={{ width: `${Math.min(Math.max(100 - budgetUsedPct, 0), 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{(100 - budgetUsedPct).toFixed(0)}% of budget remaining</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/50 rounded-xl p-3 border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Goal</p>
                  <p className="text-sm font-bold capitalize">{savingsGoal}</p>
                  <p className="text-xs text-primary font-semibold">Rs.{fmtRs(savingsTarget)}</p>
                </div>
                <div className="bg-background/50 rounded-xl p-3 border border-border/30 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Est. ETA</p>
                  <p className="text-sm font-bold">{monthsToGoal === Infinity ? '--' : monthsToGoal > 12 ? `~${(monthsToGoal / 12).toFixed(1)} yr` : `~${monthsToGoal} mo`}</p>
                  <p className="text-xs text-muted-foreground">based on spending pace</p>
                </div>
              </div>

              <div className="bg-background/50 rounded-xl p-3 border border-border/30 space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Est. monthly saving</span>
                  <span className={`font-bold ${projectedMonthlySavings > 0 ? 'text-primary' : 'text-destructive'}`}>~Rs.{Math.round(projectedMonthlySavings).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Monthly income</span>
                  <span className="font-bold text-foreground">Rs.{monthlyIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Monthly budget remaining</span>
                  <span className={`font-bold ${budgetRemaining <= 0 ? 'text-destructive' : 'text-foreground'}`}>Rs.{Math.round(budgetRemaining).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Projected month-end spending</span>
                  <span className={`font-bold ${projectedMonthSpending > monthlyBudget ? 'text-destructive' : 'text-primary'}`}>~Rs.{Math.round(projectedMonthSpending).toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-muted-foreground/60 pt-1 italic">*Estimates based on your spending pace so far this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Daily trend + Weekly bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">14-Day Spending Trend</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tLbl} itemStyle={tItm} formatter={(val: number) => [`Rs.${val.toFixed(0)}`, 'Spent']} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Weekly Comparison</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tLbl} itemStyle={tItm} formatter={(val: number) => [`Rs.${val.toFixed(0)}`, 'Spent']} />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 4: Time pattern + Behavioral insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Spending by Time of Day</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={tLbl} itemStyle={tItm} formatter={(val: number) => [`Rs.${val.toFixed(0)}`, 'Spent']} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {timeData.map((_, i) => <Cell key={i} fill={['#fbbf24', '#3b82f6', '#8b5cf6', '#6b7280'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {gemmaAnalysis?.source === 'gemma-3-27b' ? 'Gemma AI Analysis' : 'Behavioral Insights'}
              </h3>
              {gemmaAnalysis?.source === 'gemma-3-27b' && (
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">GEMMA 3 27B</span>
              )}
            </div>
            {gemmaLoading ? (
              <div className="flex items-center gap-3 py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Gemma is analyzing your spending patterns...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(gemmaAnalysis?.insights || insights).map((insight: string, i: number) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{insight}</p>
                  </div>
                ))}
                {gemmaAnalysis?.monthEndForecast && (
                  <div className="mt-3 pt-3 border-t border-border/20">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Month-End Forecast</p>
                    <p className="text-sm text-foreground/80">{gemmaAnalysis.monthEndForecast}</p>
                  </div>
                )}
                {gemmaAnalysis?.savingsAdvice && (
                  <div className="mt-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Savings Advice</p>
                    <p className="text-sm text-primary/90 font-medium">{gemmaAnalysis.savingsAdvice}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Intervention Score</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-foreground">
                  {monthTotal <= monthlyBudget * 0.5 ? 'A+' : monthTotal <= monthlyBudget * 0.7 ? 'A' : monthTotal <= monthlyBudget * 0.85 ? 'B' : monthTotal <= monthlyBudget ? 'C' : 'D'}
                </span>
                <span className="text-xs text-muted-foreground mb-1">
                  {monthTotal <= monthlyBudget * 0.5 ? 'Exceptional discipline' : monthTotal <= monthlyBudget * 0.7 ? 'Great control' : monthTotal <= monthlyBudget * 0.85 ? 'Good, room to improve' : monthTotal <= monthlyBudget ? 'Watch closely' : 'Needs intervention'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
