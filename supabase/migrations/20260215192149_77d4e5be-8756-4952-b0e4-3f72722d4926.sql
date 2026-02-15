
-- Table to store user-customizable list items for transaction classification
CREATE TABLE public.custom_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  list_type TEXT NOT NULL, -- 'expense_category', 'income_category', 'payment_method', 'tag'
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint per user + list_type + value
ALTER TABLE public.custom_list_items 
  ADD CONSTRAINT unique_user_list_value UNIQUE (user_id, list_type, value);

-- Enable RLS
ALTER TABLE public.custom_list_items ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only manage their own items
CREATE POLICY "Users can view their own list items"
  ON public.custom_list_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own list items"
  ON public.custom_list_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own list items"
  ON public.custom_list_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own list items"
  ON public.custom_list_items FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_list_items_updated_at
  BEFORE UPDATE ON public.custom_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
