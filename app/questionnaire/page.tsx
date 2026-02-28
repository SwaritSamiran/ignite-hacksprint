'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuestionnairePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(50000);
  const [monthlyBudget, setMonthlyBudget] = useState(30000);
  const [savingsGoal, setSavingsGoal] = useState('emergency');
  const [savingsTarget, setSavingsTarget] = useState(100000);

  const formatCurrency = (val: number) => {
    if (val >= 100000) return `Rs.${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `Rs.${(val / 1000).toFixed(0)}K`;
    return `Rs.${val}`;
  };

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const handleIncomeChange = (val: number) => {
    const clamped = clamp(val, 5000, 500000);
    setMonthlyIncome(clamped);
    // Only cap budget if it exceeds new income — never decrease it otherwise
    if (monthlyBudget > clamped) setMonthlyBudget(clamped);
  };

  const handleBudgetChange = (val: number) => {
    setMonthlyBudget(clamp(val, 2000, monthlyIncome));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    const userEmail = localStorage.getItem('finguard_currentUser');
    const profile = {
      monthlyIncome: monthlyIncome.toString(),
      monthlyBudget: monthlyBudget.toString(),
      weeklyLimit: Math.round(monthlyBudget / 4).toString(),
      savingsGoal,
      savingsTarget: savingsTarget.toString(),
    };
    localStorage.setItem(`finguard_profile_${userEmail}`, JSON.stringify(profile));
    setTimeout(() => router.push('/dashboard'), 400);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
            Set Your Goals
          </h1>
          <p className="text-muted-foreground text-sm">
            Use sliders or type values directly
          </p>
        </div>

        <div className="space-y-8">
          {/* Monthly Income */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">Monthly Income</label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => handleIncomeChange(parseInt(e.target.value) || 5000)}
                className="w-32 text-right text-lg font-black text-primary bg-transparent border-b border-primary/30 focus:border-primary focus:outline-none tabular-nums"
              />
            </div>
            <input
              type="range"
              min={5000}
              max={500000}
              step={5000}
              value={monthlyIncome}
              onChange={(e) => handleIncomeChange(parseInt(e.target.value))}
              className="slider w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rs.5K</span>
              <span>Rs.5L</span>
            </div>
          </div>

          {/* Monthly Budget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">Monthly Spending Budget</label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => handleBudgetChange(parseInt(e.target.value) || 2000)}
                className="w-32 text-right text-lg font-black text-accent bg-transparent border-b border-accent/30 focus:border-accent focus:outline-none tabular-nums"
              />
            </div>
            <input
              type="range"
              min={2000}
              max={monthlyIncome}
              step={1000}
              value={monthlyBudget}
              onChange={(e) => handleBudgetChange(parseInt(e.target.value))}
              className="slider w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rs.2K</span>
              <span>{formatCurrency(monthlyIncome)}</span>
            </div>
            {monthlyBudget > monthlyIncome * 0.8 && (
              <p className="text-xs text-secondary font-medium">Budget is over 80% of income - leave room for savings</p>
            )}
          </div>

          {/* Savings Goal */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground/80">Primary Savings Goal</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'emergency', label: 'Emergency Fund' },
                { value: 'vacation', label: 'Vacation' },
                { value: 'education', label: 'Education' },
                { value: 'home', label: 'Home' },
                { value: 'investment', label: 'Invest' },
                { value: 'other', label: 'Other' },
              ].map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => setSavingsGoal(goal.value)}
                  className={`py-3 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                    savingsGoal === goal.value
                      ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20'
                      : 'bg-card/50 border-border text-muted-foreground hover:border-primary/50 hover:bg-card'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          {/* Savings Target */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground/80">Savings Target</label>
              <input
                type="number"
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(clamp(parseInt(e.target.value) || 10000, 10000, 5000000))}
                className="w-36 text-right text-lg font-black text-primary bg-transparent border-b border-primary/30 focus:border-primary focus:outline-none tabular-nums"
              />
            </div>
            <input
              type="range"
              min={10000}
              max={5000000}
              step={10000}
              value={savingsTarget}
              onChange={(e) => setSavingsTarget(parseInt(e.target.value))}
              className="slider w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Rs.10K</span>
              <span>Rs.50L</span>
            </div>
            <p className="text-xs text-muted-foreground">
              At current savings rate, ~{Math.ceil(savingsTarget / Math.max(monthlyIncome - monthlyBudget, 1))} months to reach goal
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full mt-10 py-4 px-6 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-lg rounded-xl hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Setting up...' : 'Start Tracking'}
        </button>

        <div className="mt-6 bg-card/30 border border-border/50 rounded-xl p-4 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Save</p>
              <p className="text-sm font-bold text-primary">{formatCurrency(Math.max(monthlyIncome - monthlyBudget, 0))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Weekly Budget</p>
              <p className="text-sm font-bold text-accent">{formatCurrency(Math.round(monthlyBudget / 4))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Daily Budget</p>
              <p className="text-sm font-bold text-foreground">{formatCurrency(Math.round(monthlyBudget / 30))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
