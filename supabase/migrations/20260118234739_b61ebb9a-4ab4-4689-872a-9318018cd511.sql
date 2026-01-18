-- Add payment_method column to transactions table for expenses
ALTER TABLE public.transactions 
ADD COLUMN payment_method TEXT DEFAULT 'Cartão';

-- Add comment explaining the field
COMMENT ON COLUMN public.transactions.payment_method IS 'Payment method: Cartão, PIX, TED, or Cash. Only applicable for expense transactions.';