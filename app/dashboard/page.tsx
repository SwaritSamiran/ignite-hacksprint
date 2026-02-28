'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GemmaCharacter } from '@/components/gemma-character';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { getSupabaseClient } from '@/lib/supabase';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface Intervention {
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: 'proceed' | 'caution' | 'stop';
  pattern?: string | null;
  budgetAfter?: string;
  source?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [monthlyBudget, setMonthlyBudget] = useState(30000);
  const [spendingPercentage, setSpendingPercentage] = useState(0);

  // Modal states
  const [modalStep, setModalStep] = useState<'closed' | 'input' | 'loading' | 'intervention'>('closed');
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'food', description: '' });
  const [intervention, setIntervention] = useState<Intervention | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/auth/login');
        return;
      }

      const userEmail = session.user.email!;
      const uid = session.user.id;

      setCurrentUser(userEmail);
      setUserId(uid);
      setIsLoggedIn(true);

      // --- Load profile from Supabase (single source of truth) ---
      let budget = 30000;
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (profileData) {
        budget = Number(profileData.monthly_budget);
        setMonthlyBudget(budget);
      }

      // --- Load expenses from Supabase (single source of truth) ---
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false });

      const loadedExpenses: Expense[] = (expensesData || []).map(e => ({
        id: e.id,
        amount: Number(e.amount),
        category: e.category,
        description: e.description || '',
        date: e.date,
      }));

      setExpenses(loadedExpenses);

      const now = new Date();
      const monthlyTotal = loadedExpenses
        .filter((exp) => {
          const d = new Date(exp.date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, exp) => sum + exp.amount, 0);

      setMonthlySpending(monthlyTotal);
      setSpendingPercentage((monthlyTotal / budget) * 100);
    };

    checkAuth();
  }, [router]);

  // --- THE INTERVENTION FLOW ---
  // Step 1: User enters expense details
  // Step 2: We call Gemma to get an intervention
  // Step 3: User sees Gemma's advice and decides to proceed or cancel

  const requestIntervention = async () => {
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return;

    setModalStep('loading');

    try {
      const res = await fetch('/api/intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category,
          description: expenseForm.description,
          monthly_budget: monthlyBudget,
          monthly_spending: monthlySpending,
          recent_expenses: expenses.slice(-20).map(e => ({
            amount: e.amount,
            category: e.category,
            description: e.description || '',
            date: e.date,
          })),
        }),
      });

      const data: Intervention = await res.json();
      setIntervention(data);
      setModalStep('intervention');
    } catch {
      // If API fails, still let user proceed
      setIntervention({
        severity: 'low',
        message: 'Could not reach Gemma right now. Use your own judgment.',
        recommendation: 'proceed',
      });
      setModalStep('intervention');
    }
  };

  const confirmExpense = async () => {
    if (!currentUser) return;

    const newExpense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category,
      description: expenseForm.description,
      date: new Date().toISOString(),
    };

    // Insert into Supabase
    if (userId) {
      try {
        const supabase = getSupabaseClient();
        const { data: inserted, error } = await supabase.from('expenses').insert({
          user_id: userId,
          amount: newExpense.amount,
          category: newExpense.category,
          description: newExpense.description,
          date: newExpense.date,
        }).select().single();

        if (error) {
          console.error('Failed to save expense to Supabase:', error);
        } else if (inserted) {
          // Use the Supabase-generated UUID as the id
          newExpense.id = inserted.id;
        }
      } catch (err) {
        console.error('Error saving expense:', err);
      }
    }

    const updated = [...expenses, newExpense];
    setExpenses(updated);

    const newTotal = monthlySpending + newExpense.amount;
    setMonthlySpending(newTotal);
    setSpendingPercentage((newTotal / monthlyBudget) * 100);

    closeModal();
  };

  const closeModal = () => {
    setModalStep('closed');
    setExpenseForm({ amount: '', category: 'food', description: '' });
    setIntervention(null);
  };

  const deleteExpense = async (id: string) => {
    if (!currentUser) return;

    const exp = expenses.find(e => e.id === id);
    if (!exp) return;

    // Delete from Supabase
    if (userId) {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) console.error('Failed to delete expense from Supabase:', error);
      } catch (err) {
        console.error('Error deleting expense:', err);
      }
    }

    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);

    const newTotal = monthlySpending - exp.amount;
    setMonthlySpending(Math.max(newTotal, 0));
    setSpendingPercentage(Math.max((newTotal / monthlyBudget) * 100, 0));
  };

  if (!isLoggedIn) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  const remaining = monthlyBudget - monthlySpending;
  const remainingPercent = Math.max(100 - spendingPercentage, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <DashboardSidebar />

      <div className="flex-1 overflow-auto">
        <div className="h-full w-full flex flex-col">
          {/* TOP: Gemma insight bar */}
          <div className="flex-shrink-0 px-8 pt-8 pb-4">
            <div className="bg-card/30 border border-border/30 backdrop-blur-sm rounded-2xl p-5">
              <p className="text-center text-sm font-light text-foreground/80 leading-relaxed tracking-wide">
                {spendingPercentage < 30
                  ? `Outstanding — only ${spendingPercentage.toFixed(0)}% of your budget used. You're doing great.`
                  : spendingPercentage < 50
                  ? `Solid discipline — ${spendingPercentage.toFixed(0)}% used. Keep it steady.`
                  : spendingPercentage < 80
                  ? `Heads up — ${spendingPercentage.toFixed(0)}% of budget used. Watch the non-essentials.`
                  : spendingPercentage < 100
                  ? `${spendingPercentage.toFixed(0)}% used. One big purchase away from exceeding your limit.`
                  : `Budget exceeded by ${Math.round(spendingPercentage - 100)}%. Time to pause and replan.`}
              </p>
            </div>
          </div>

          {/* MIDDLE: Gemma character + action */}
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="flex flex-col items-center justify-center gap-6 py-6">
              <GemmaCharacter spendingPercentage={spendingPercentage} isAnimating={true} />

              <button
                onClick={() => setModalStep('input')}
                className="px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-base rounded-2xl hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                + Log Expense
              </button>
            </div>
          </div>

          {/* BOTTOM: Budget status + Recent Expenses */}
          <div className="flex-shrink-0 px-8 pb-8 space-y-4">
            <div className={`border rounded-xl p-5 backdrop-blur-sm ${
              spendingPercentage > 90
                ? 'bg-destructive/10 border-destructive/30'
                : 'bg-primary/10 border-primary/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-foreground font-medium text-sm">Budget Status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Rs.{monthlySpending.toFixed(0)} / Rs.{monthlyBudget}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${spendingPercentage > 90 ? 'text-destructive' : 'text-primary'}`}>
                    {remainingPercent.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rs.{Math.max(remaining, 0).toLocaleString()} remaining this month
                  </p>
                </div>
              </div>
              <div className="w-full bg-card/50 rounded-full h-2 border border-border/30">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    spendingPercentage > 90
                      ? 'bg-gradient-to-r from-destructive to-secondary'
                      : 'bg-gradient-to-r from-primary to-accent'
                  }`}
                  style={{ width: `${Math.min(spendingPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Recent Expenses */}
            {expenses.length > 0 && (
              <div className="bg-card/30 border border-border/30 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">Recent Expenses</p>
                  <p className="text-xs text-muted-foreground">{expenses.length} total</p>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {expenses.slice().reverse().slice(0, 5).map((exp) => (
                    <div key={exp.id} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2 group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          exp.category === 'food' ? 'bg-primary' :
                          exp.category === 'transport' ? 'bg-accent' :
                          exp.category === 'shopping' ? 'bg-secondary' :
                          exp.category === 'entertainment' ? 'bg-chart-4' :
                          'bg-muted-foreground'
                        }`} />
                        <div>
                          <p className="text-sm font-medium capitalize">{exp.category}</p>
                          {exp.description && <p className="text-xs text-muted-foreground">{exp.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold">Rs.{exp.amount}</p>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-xs"
                          title="Delete"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === INTERVENTION MODAL === */}
      {modalStep !== 'closed' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">

            {/* Step 1: Expense input */}
            {modalStep === 'input' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold">Log an Expense</h2>
                  <p className="text-muted-foreground text-xs mt-1">Gemma will review this before you confirm</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Amount (Rs.)</label>
                    <input
                      type="number"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      placeholder="500"
                      autoFocus
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition text-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Category</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    >
                      <option value="food">Food & Dining</option>
                      <option value="transport">Transport</option>
                      <option value="shopping">Shopping</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="utilities">Utilities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Description (Optional)</label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      placeholder="What did you buy?"
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={closeModal} className="flex-1 py-3 px-4 bg-card border border-border text-foreground font-semibold rounded-lg hover:bg-primary/10 transition">
                    Cancel
                  </button>
                  <button
                    onClick={requestIntervention}
                    disabled={!expenseForm.amount || parseFloat(expenseForm.amount) <= 0}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-40"
                  >
                    Check with Gemma
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Loading - Gemma is thinking */}
            {modalStep === 'loading' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Gemma is analyzing your spending...</p>
              </div>
            )}

            {/* Step 3: Intervention - Gemma's verdict */}
            {modalStep === 'intervention' && intervention && (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  {/* Severity indicator */}
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
                    intervention.recommendation === 'proceed'
                      ? 'bg-primary/20 text-primary'
                      : intervention.recommendation === 'caution'
                      ? 'bg-secondary/20 text-secondary'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {intervention.recommendation === 'proceed' ? 'OK' : intervention.recommendation === 'caution' ? '!!' : 'NO'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">
                      {intervention.recommendation === 'proceed'
                        ? 'Gemma says: Go ahead'
                        : intervention.recommendation === 'caution'
                        ? 'Gemma says: Think twice'
                        : 'Gemma says: Reconsider this'}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Rs.{expenseForm.amount} for {expenseForm.category}
                      {intervention.source === 'gemma-3-27b' ? ' — Powered by Gemma 3 27B' : ''}
                    </p>
                  </div>
                </div>

                {/* Intervention message */}
                <div className={`rounded-xl p-4 text-sm leading-relaxed border ${
                  intervention.recommendation === 'proceed'
                    ? 'bg-primary/10 border-primary/20 text-foreground'
                    : intervention.recommendation === 'caution'
                    ? 'bg-secondary/10 border-secondary/20 text-foreground'
                    : 'bg-destructive/10 border-destructive/20 text-foreground'
                }`}>
                  {intervention.message}
                </div>

                {/* Pattern detection */}
                {intervention.pattern && (
                  <div className="bg-card border border-border rounded-lg p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pattern Detected</p>
                    <p className="text-sm text-foreground">{intervention.pattern}</p>
                  </div>
                )}

                {/* Budget projection */}
                {intervention.budgetAfter && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground bg-background/50 rounded-lg p-3">
                    <span>Budget after this expense</span>
                    <span className={`font-bold ${parseInt(intervention.budgetAfter) > 100 ? 'text-destructive' : 'text-primary'}`}>
                      {intervention.budgetAfter}%
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} className="flex-1 py-3 px-4 bg-card border border-border text-foreground font-semibold rounded-lg hover:bg-destructive/10 hover:border-destructive/30 transition">
                    Cancel Expense
                  </button>
                  <button
                    onClick={confirmExpense}
                    className={`flex-1 py-3 px-4 font-semibold rounded-lg transition ${
                      intervention.recommendation === 'stop'
                        ? 'bg-destructive/80 text-white hover:bg-destructive'
                        : 'bg-gradient-to-r from-primary to-accent text-primary-foreground hover:shadow-lg'
                    }`}
                  >
                    {intervention.recommendation === 'stop' ? 'Spend Anyway' : 'Confirm Expense'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
