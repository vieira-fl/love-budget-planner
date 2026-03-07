import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface InvestmentGoal {
  id: string;
  user_id: string;
  category_key: string;
  goal_amount: number;
}

export function useInvestmentGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('investment_goals')
      .select('*');
    if (!error && data) {
      setGoals(data as unknown as InvestmentGoal[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const upsertGoal = useCallback(async (categoryKey: string, goalAmount: number) => {
    if (!user) return;
    const existing = goals.find(g => g.category_key === categoryKey);
    if (existing) {
      const { error } = await supabase
        .from('investment_goals')
        .update({ goal_amount: goalAmount } as any)
        .eq('id', existing.id);
      if (!error) {
        setGoals(prev => prev.map(g => g.id === existing.id ? { ...g, goal_amount: goalAmount } : g));
      }
    } else {
      const { data, error } = await supabase
        .from('investment_goals')
        .insert({ user_id: user.id, category_key: categoryKey, goal_amount: goalAmount } as any)
        .select()
        .single();
      if (!error && data) {
        setGoals(prev => [...prev, data as unknown as InvestmentGoal]);
      }
    }
  }, [user, goals]);

  const getGoal = useCallback((categoryKey: string): number => {
    return goals.find(g => g.category_key === categoryKey)?.goal_amount ?? 0;
  }, [goals]);

  return { goals, loading, upsertGoal, getGoal, fetchGoals };
}
