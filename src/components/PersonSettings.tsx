import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Users } from 'lucide-react';

interface PersonSettingsProps {
  person1Name: string;
  person2Name: string;
  onPerson1NameChange: (name: string) => void;
  onPerson2NameChange: (name: string) => void;
}

export function PersonSettings({
  person1Name,
  person2Name,
  onPerson1NameChange,
  onPerson2NameChange,
}: PersonSettingsProps) {
  const [open, setOpen] = useState(false);
  const [tempPerson1, setTempPerson1] = useState(person1Name);
  const [tempPerson2, setTempPerson2] = useState(person2Name);

  const handleSave = () => {
    onPerson1NameChange(tempPerson1 || 'Pessoa 1');
    onPerson2NameChange(tempPerson2 || 'Pessoa 2');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="border-border bg-card hover:bg-muted">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[360px] bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Users className="h-5 w-5 text-primary" />
            Configurar Nomes
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="person1" className="text-foreground">Pessoa 1</Label>
            <Input
              id="person1"
              value={tempPerson1}
              onChange={(e) => setTempPerson1(e.target.value)}
              placeholder="Nome da pessoa 1"
              className="bg-background border-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="person2" className="text-foreground">Pessoa 2</Label>
            <Input
              id="person2"
              value={tempPerson2}
              onChange={(e) => setTempPerson2(e.target.value)}
              placeholder="Nome da pessoa 2"
              className="bg-background border-input"
            />
          </div>
          <Button onClick={handleSave} className="w-full gradient-primary border-0 text-primary-foreground">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
