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

interface ConfirmationModalProps {
  open: boolean;
  onConfirm: () => void;
  onReturn: () => void;
  validCount: number;
  totalBrl: number;
  isSaving: boolean;
}

export function ConfirmationModal({
  open,
  onConfirm,
  onReturn,
  validCount,
  totalBrl,
  isSaving,
}: ConfirmationModalProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) {
          onReturn();
        }
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <DialogTitle>Confirmar transações</DialogTitle>
          </div>
          <DialogDescription>
            As linhas estão validadas. Confirme para registrar as transações.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Transações prontas para adicionar:</span>
            <span className="font-medium">{validCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total BRL:</span>
            <span className="font-medium">{formatCurrency(totalBrl)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onReturn} disabled={isSaving}>
            Retornar
          </Button>
          <Button onClick={onConfirm} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Confirmar"}
          </Button>
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

interface SaveErrorModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function SaveErrorModal({ open, onClose, message }: SaveErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>Não foi possível salvar as transações</DialogTitle>
          </div>
          <DialogDescription>
            {message || "Tente novamente em instantes."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>Retornar</Button>
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
