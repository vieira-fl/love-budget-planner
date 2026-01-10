-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;

-- Create new permissive SELECT policy for all authenticated users
CREATE POLICY "Authenticated users can view all transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (true);

-- Drop existing restrictive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;

-- Create new permissive UPDATE policy for all authenticated users
CREATE POLICY "Authenticated users can update all transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (true);

-- Drop existing restrictive DELETE policy
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

-- Create new permissive DELETE policy for all authenticated users
CREATE POLICY "Authenticated users can delete all transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated
USING (true);

-- Also update person_settings to be shared
DROP POLICY IF EXISTS "Users can view their own person settings" ON public.person_settings;

CREATE POLICY "Authenticated users can view all person settings" 
ON public.person_settings 
FOR SELECT 
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Users can update their own person settings" ON public.person_settings;

CREATE POLICY "Authenticated users can update all person settings" 
ON public.person_settings 
FOR UPDATE 
TO authenticated
USING (true);