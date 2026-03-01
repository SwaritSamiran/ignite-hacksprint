'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile, Expense } from '@/lib/schemas';

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setIsLoggedIn: (loggedIn: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
  setUser: (user) => set({ user }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  logout: () => set({ user: null, isLoggedIn: false, error: null }),
}));

interface ProfileState {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  setProfile: (profile: Profile | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateProfile: (updates: Partial<Profile>) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      isLoading: false,
      error: null,
      setProfile: (profile) => set({ profile }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),
    }),
    {
      name: 'profile-storage',
    }
  )
);

interface ExpensesState {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  setExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearExpenses: () => void;
  getMonthlyTotal: () => number;
  getMonthlyExpenses: () => Expense[];
}

export const useExpensesStore = create<ExpensesState>()(
  persist(
    (set, get) => ({
      expenses: [],
      isLoading: false,
      error: null,
      setExpenses: (expenses) => set({ expenses }),
      addExpense: (expense) =>
        set((state) => ({ expenses: [...state.expenses, expense] })),
      removeExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearExpenses: () => set({ expenses: [] }),
      getMonthlyTotal: () => {
        const now = new Date();
        return get().expenses
          .filter((exp) => {
            const expDate = new Date(exp.date);
            return (
              expDate.getMonth() === now.getMonth() &&
              expDate.getFullYear() === now.getFullYear()
            );
          })
          .reduce((sum, exp) => sum + exp.amount, 0);
      },
      getMonthlyExpenses: () => {
        const now = new Date();
        return get().expenses.filter((exp) => {
          const expDate = new Date(exp.date);
          return (
            expDate.getMonth() === now.getMonth() &&
            expDate.getFullYear() === now.getFullYear()
          );
        });
      },
    }),
    {
      name: 'expenses-storage',
    }
  )
);

interface InterventionState {
  severity: 'low' | 'medium' | 'high' | 'critical' | null;
  message: string | null;
  recommendation: 'proceed' | 'caution' | 'stop' | null;
  pattern: string | null;
  budgetAfter: string | null;
  source: 'gemma-3-27b' | 'fallback' | null;
  isLoading: boolean;
  error: string | null;
  setIntervention: (intervention: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendation: 'proceed' | 'caution' | 'stop';
    pattern?: string | null;
    budgetAfter?: string;
    source?: 'gemma-3-27b' | 'fallback';
  }) => void;
  clear: () => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useInterventionStore = create<InterventionState>((set) => ({
  severity: null,
  message: null,
  recommendation: null,
  pattern: null,
  budgetAfter: null,
  source: null,
  isLoading: false,
  error: null,
  setIntervention: (intervention) =>
    set({
      severity: intervention.severity,
      message: intervention.message,
      recommendation: intervention.recommendation,
      pattern: intervention.pattern || null,
      budgetAfter: intervention.budgetAfter || null,
      source: intervention.source || null,
      error: null,
    }),
  clear: () =>
    set({
      severity: null,
      message: null,
      recommendation: null,
      pattern: null,
      budgetAfter: null,
      source: null,
      error: null,
    }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

interface UIState {
  modalOpen: boolean;
  modalStep: 'closed' | 'input' | 'loading' | 'intervention';
  setModalOpen: (open: boolean) => void;
  setModalStep: (step: 'closed' | 'input' | 'loading' | 'intervention') => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      modalOpen: false,
      modalStep: 'closed',
      setModalOpen: (open) => set({ modalOpen: open }),
      setModalStep: (step) => set({ modalStep: step }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
    }
  )
);
