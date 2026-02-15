import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCustomLists, ListType, DEFAULTS_BY_TYPE } from '@/hooks/useCustomLists';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ListSectionProps {
  title: string;
  description: string;
  listType: ListType;
  items: { id: string; label: string; value: string }[];
  initialized: boolean;
  onSeed: () => void;
  onAdd: (label: string) => Promise<void>;
  onUpdate: (id: string, label: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function ListSection({ title, description, listType, items, initialized, onSeed, onAdd, onUpdate, onDelete }: ListSectionProps) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!initialized && DEFAULTS_BY_TYPE[listType].length > 0) {
      onSeed();
    }
  }, [initialized, listType, onSeed]);

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    setAdding(true);
    await onAdd(newLabel);
    setNewLabel('');
    setAdding(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editLabel.trim()) return;
    await onUpdate(id, editLabel);
    setEditingId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await onDelete(deleteId);
    setDeleteId(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder="Novo item..."
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button size="icon" onClick={handleAdd} disabled={!newLabel.trim() || adding}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Items list */}
        <div className="divide-y divide-border rounded-md border">
          {items.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground text-center">Nenhum item cadastrado</p>
          )}
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 px-3 py-2">
              {editingId === item.id ? (
                <>
                  <Input
                    value={editLabel}
                    onChange={e => setEditLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdate(item.id)}
                    className="flex-1 h-8"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdate(item.id)}>
                    <Check className="h-4 w-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{item.label}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(item.id); setEditLabel(item.label); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover item?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. Transações existentes que usam este item não serão afetadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { loading, initialized, seedDefaults, addItem, updateItem, deleteItem, getItemsByType } = useCustomLists();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const lists: { type: ListType; title: string; description: string }[] = [
    { type: 'expense_category', title: 'Categorias de Despesa', description: 'Categorias disponíveis para classificar despesas.' },
    { type: 'income_category', title: 'Categorias de Receita', description: 'Categorias disponíveis para classificar receitas.' },
    { type: 'payment_method', title: 'Formas de Pagamento', description: 'Métodos de pagamento disponíveis para despesas.' },
    { type: 'tag', title: 'Tags', description: 'Tags para agrupar e filtrar transações.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Configurações</h1>
              <p className="text-sm text-muted-foreground">Gerencie as listas de classificação de transações</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {lists.map(list => (
            <ListSection
              key={list.type}
              title={list.title}
              description={list.description}
              listType={list.type}
              items={getItemsByType(list.type)}
              initialized={initialized[list.type]}
              onSeed={() => seedDefaults(list.type)}
              onAdd={(label) => addItem(list.type, label)}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
