import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ErrorsModalProps {
  open: boolean;
  onClose: () => void;
  errorList: string[];
}

export function ErrorsModal({ open, onClose, errorList }: ErrorsModalProps) {
  const visibleErrors = errorList.slice(0, 20);
  const remaining = errorList.length - visibleErrors.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>Erros na tabela</DialogTitle>
          </div>
          <DialogDescription>
            Corrija os erros abaixo antes de confirmar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[300px]">
          <ul className="space-y-2 text-sm">
            {visibleErrors.map((error, i) => (
              <li key={i} className="text-destructive">
                {error}
              </li>
            ))}
            {remaining > 0 && (
              <li className="text-muted-foreground">+{remaining} erros adicionais</li>
            )}
          </ul>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  validCount: number;
  totalBrl: number;
}

export function SuccessModal({ open, onClose, validCount, totalBrl }: SuccessModalProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <DialogTitle>Validação OK</DialogTitle>
          </div>
          <DialogDescription>
            Todas as linhas estão válidas e prontas para serem adicionadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Linhas válidas:</span>
            <span className="font-medium">{validCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total (somatório):</span>
            <span className="font-medium">{formatCurrency(totalBrl)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export function InfoModal({ open, onClose, title, message }: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ClearConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearConfirmModal({ open, onClose, onConfirm }: ClearConfirmModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar tabela?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá remover todas as linhas da tabela. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Limpar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
