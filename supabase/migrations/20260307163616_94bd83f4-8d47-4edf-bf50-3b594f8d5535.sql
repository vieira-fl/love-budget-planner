
CREATE TABLE public.investment_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_key text NOT NULL,
  goal_amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_key)
);

ALTER TABLE public.investment_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all investment goals"
  ON public.investment_goals FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own investment goals"
  ON public.investment_goals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update all investment goals"
  ON public.investment_goals FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete all investment goals"
  ON public.investment_goals FOR DELETE TO authenticated
  USING (true);

CREATE TRIGGER update_investment_goals_updated_at
  BEFORE UPDATE ON public.investment_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
