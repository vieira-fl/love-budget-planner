import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type ListType = 'expense_category' | 'income_category' | 'payment_method' | 'tag';

export interface ListItem {
  id: string;
  list_type: ListType;
  value: string;
  label: string;
  sort_order: number;
}

const DEFAULT_EXPENSE_CATEGORIES: Omit<ListItem, 'id'>[] = [
  { list_type: 'expense_category', value: 'moradia', label: 'Moradia', sort_order: 0 },
  { list_type: 'expense_category', value: 'alimentacao', label: 'Alimentação', sort_order: 1 },
  { list_type: 'expense_category', value: 'transporte', label: 'Transporte', sort_order: 2 },
  { list_type: 'expense_category', value: 'saude', label: 'Saúde', sort_order: 3 },
  { list_type: 'expense_category', value: 'educacao', label: 'Educação', sort_order: 4 },
  { list_type: 'expense_category', value: 'lazer', label: 'Lazer', sort_order: 5 },
  { list_type: 'expense_category', value: 'assinaturas', label: 'Assinaturas', sort_order: 6 },
  { list_type: 'expense_category', value: 'streaming', label: 'Streaming', sort_order: 7 },
  { list_type: 'expense_category', value: 'vestuario', label: 'Vestuário', sort_order: 8 },
  { list_type: 'expense_category', value: 'pet', label: 'Pet', sort_order: 9 },
  { list_type: 'expense_category', value: 'outros', label: 'Outros', sort_order: 10 },
];

const DEFAULT_INCOME_CATEGORIES: Omit<ListItem, 'id'>[] = [
  { list_type: 'income_category', value: 'salario', label: 'Salário', sort_order: 0 },
  { list_type: 'income_category', value: 'bonus', label: 'Bônus', sort_order: 1 },
  { list_type: 'income_category', value: 'investimentos', label: 'Investimentos', sort_order: 2 },
  { list_type: 'income_category', value: 'outros', label: 'Outros', sort_order: 3 },
];

const DEFAULT_PAYMENT_METHODS: Omit<ListItem, 'id'>[] = [
  { list_type: 'payment_method', value: 'Cartão', label: 'Cartão', sort_order: 0 },
  { list_type: 'payment_method', value: 'PIX', label: 'PIX', sort_order: 1 },
  { list_type: 'payment_method', value: 'TED', label: 'TED', sort_order: 2 },
  { list_type: 'payment_method', value: 'Cash', label: 'Cash', sort_order: 3 },
];

const DEFAULT_TAGS: Omit<ListItem, 'id'>[] = [];

export const DEFAULTS_BY_TYPE: Record<ListType, Omit<ListItem, 'id'>[]> = {
  expense_category: DEFAULT_EXPENSE_CATEGORIES,
  income_category: DEFAULT_INCOME_CATEGORIES,
  payment_method: DEFAULT_PAYMENT_METHODS,
  tag: DEFAULT_TAGS,
};

export function useCustomLists() {
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState<Record<ListType, boolean>>({
    expense_category: false,
    income_category: false,
    payment_method: false,
    tag: false,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('custom_list_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const mapped: ListItem[] = (data || []).map(d => ({
        id: d.id,
        list_type: d.list_type as ListType,
        value: d.value,
        label: d.label,
        sort_order: d.sort_order,
      }));
      setItems(mapped);

      // Check which types have been initialized (have at least one item)
      const types: ListType[] = ['expense_category', 'income_category', 'payment_method', 'tag'];
      const init: Record<ListType, boolean> = {} as any;
      types.forEach(t => {
        init[t] = mapped.some(i => i.list_type === t);
      });
      setInitialized(init);
    } catch (err: any) {
      console.error('Error fetching custom lists:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const seedDefaults = async (listType: ListType) => {
    if (!user) return;
    const defaults = DEFAULTS_BY_TYPE[listType];
    if (defaults.length === 0) return;

    const rows = defaults.map(d => ({
      user_id: user.id,
      list_type: d.list_type,
      value: d.value,
      label: d.label,
      sort_order: d.sort_order,
    }));

    const { error } = await supabase.from('custom_list_items').insert(rows);
    if (error) {
      // Might already exist, ignore duplicate errors
      if (!error.message.includes('duplicate')) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      }
    }
    await fetchItems();
  };

  const addItem = async (listType: ListType, label: string) => {
    if (!user) return;
    const value = label.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!value) return;

    const maxOrder = items.filter(i => i.list_type === listType).reduce((max, i) => Math.max(max, i.sort_order), -1);

    const { error } = await supabase.from('custom_list_items').insert({
      user_id: user.id,
      list_type: listType,
      value: listType === 'payment_method' ? label.trim() : value,
      label: label.trim(),
      sort_order: maxOrder + 1,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message.includes('duplicate') ? 'Item já existe nesta lista.' : error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Item adicionado' });
    await fetchItems();
  };

  const updateItem = async (id: string, newLabel: string) => {
    const newValue = newLabel.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const item = items.find(i => i.id === id);

    const { error } = await supabase.from('custom_list_items').update({
      label: newLabel.trim(),
      value: item?.list_type === 'payment_method' ? newLabel.trim() : newValue,
    }).eq('id', id);

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Item atualizado' });
    await fetchItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('custom_list_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Item removido' });
    await fetchItems();
  };

  const getItemsByType = (listType: ListType) => items.filter(i => i.list_type === listType);

  return {
    items,
    loading,
    initialized,
    seedDefaults,
    addItem,
    updateItem,
    deleteItem,
    getItemsByType,
    fetchItems,
  };
}
