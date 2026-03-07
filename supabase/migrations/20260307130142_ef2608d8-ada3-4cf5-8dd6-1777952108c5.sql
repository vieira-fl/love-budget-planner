
-- Remove duplicate rows, keeping only one per (list_type, value)
DELETE FROM public.custom_list_items a
USING public.custom_list_items b
WHERE a.list_type = b.list_type
  AND a.value = b.value
  AND a.created_at > b.created_at;

-- Now add the shared unique constraint
ALTER TABLE public.custom_list_items DROP CONSTRAINT IF EXISTS custom_list_items_user_id_list_type_value_key;
ALTER TABLE public.custom_list_items ADD CONSTRAINT custom_list_items_list_type_value_key UNIQUE (list_type, value);
