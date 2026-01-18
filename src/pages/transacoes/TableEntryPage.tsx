import { Component, ReactNode, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Plus, Upload, Check, AlertTriangle, Trash2, RotateCcw, Loader2, CheckCircle2, XCircle, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EditableTable } from "./components/EditableTable";
import { ConfirmationModal, ErrorsModal, InfoModal, SaveErrorModal, ClearConfirmModal } from "./components/ValidationModals";
import { useTableEntry } from "./hooks/useTableEntry";
import { ValidationResult } from "./types";
import { parseBRL } from "./utils/tableEntryUtils";
import { parseCsvContent } from "./utils/csvParser";
import { Transaction, TransactionType, RecurrenceType } from "@/types/finance";

type FileStatus = {
  type: "success" | "error";
  fileName: string;
  message: string;
} | null;

// Error Boundary for fallback protection
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

class TableEntryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Fallback component when error occurs
function ErrorFallback() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Não foi possível carregar a Entrada em Tabela</CardTitle>
          <CardDescription>Tente novamente mais tarde.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Transações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Disabled feature component
function FeatureDisabled() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Funcionalidade desabilitada</CardTitle>
          <CardDescription>
            A entrada em tabela está desabilitada no momento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => navigate("/") }>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Transações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Main page content
function TableEntryContent() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const userName = profile?.username || "Usuário logado";
  const userId = user?.id || profile?.user_id || "default";
  
  const {
    rows,
    selectedRows,
    errorsByCell,
    options,
    addRow,
    updateRow,
    selectRow,
    selectAll,
    deleteSelected,
    clearAll,
    appendRows,
    registerOption,
    formatBrlOnBlur,
    validate,
  } = useTableEntry({ defaultResponsavel: userName, userId });

  const [showClearModal, setShowClearModal] = useState(false);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSaveErrorModal, setShowSaveErrorModal] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileStatus, setFileStatus] = useState<FileStatus>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const responsaveis = [userName];
  const hasSelectedRows = selectedRows.size > 0;
  const hasRows = rows.length > 0;

  const ALLOWED_EXTENSIONS = [".csv", ".xml"];
  const ALLOWED_MIME_TYPES = [
    "text/csv",
    "application/csv",
    "text/xml",
    "application/xml",
  ];

  const validateFileFormat = (file: File): { valid: boolean; error?: string } => {
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) =>
      fileName.endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Formato inválido. Apenas arquivos ${ALLOWED_EXTENSIONS.join(", ")} são aceitos.`,
      };
    }

    // Check MIME type as secondary validation (some browsers may not set it correctly)
    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type) && file.type !== "") {
      console.warn(`MIME type "${file.type}" não esperado, mas extensão válida.`);
    }

    // Check if file is not empty
    if (file.size === 0) {
      return {
        valid: false,
        error: "O arquivo está vazio.",
      };
    }

    // Check max size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: "O arquivo é muito grande. Tamanho máximo: 10MB.",
      };
    }

    return { valid: true };
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDismissFileStatus = () => {
    setFileStatus(null);
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous status
    setFileStatus(null);
    setIsProcessingFile(true);

    // Validate file format
    const validation = validateFileFormat(file);

    // Reset input so user can select same file again if needed
    event.target.value = "";

    if (!validation.valid) {
      setIsProcessingFile(false);
      setFileStatus({
        type: "error",
        fileName: file.name,
        message: validation.error || "Erro desconhecido ao validar arquivo.",
      });
      return;
    }

    // Read and parse the file
    try {
      const content = await file.text();
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith(".csv")) {
        const result = parseCsvContent(content, userName);
        
        if (result.parseErrors.length > 0) {
          setIsProcessingFile(false);
          setFileStatus({
            type: "error",
            fileName: file.name,
            message: result.parseErrors.join(" "),
          });
          return;
        }

        if (result.rows.length === 0) {
          setIsProcessingFile(false);
          setFileStatus({
            type: "error",
            fileName: file.name,
            message: "Nenhuma linha de dados encontrada no arquivo.",
          });
          return;
        }

        // Append rows to the table
        appendRows(result.rows, result.errors);
        
        setIsProcessingFile(false);
        setFileStatus({
          type: "success",
          fileName: file.name,
          message: `${result.rows.length} linha(s) importada(s) com sucesso!`,
        });
      } else if (fileName.endsWith(".xml")) {
        // XML parsing not implemented yet
        setIsProcessingFile(false);
        setFileStatus({
          type: "error",
          fileName: file.name,
          message: "Parsing de XML ainda não implementado. Use arquivos CSV.",
        });
      }
    } catch (error) {
      console.error("Error parsing file:", error);
      setIsProcessingFile(false);
      setFileStatus({
        type: "error",
        fileName: file.name,
        message: "Erro ao processar o arquivo.",
      });
    }
  };

  const handleValidate = () => {
    if (rows.length === 0) {
      setValidationResult(null);
      setShowInfoModal(true);
      return;
    }

    const result = validate();
    setValidationResult(result);
    if (result.valid) {
      setShowConfirmModal(true);
    } else {
      setShowErrorsModal(true);
    }
  };

  const handleClearConfirm = () => {
    clearAll();
    setShowClearModal(false);
  };

  const mapTransactionType = (tipo: string): TransactionType => {
    const normalized = tipo.trim().toLowerCase();
    if (normalized.includes("receita") || normalized.includes("income")) {
      return "income";
    }
    return "expense";
  };

  const parseDatePtBr = (value: string): Date => {
    const [day, month, year] = value.split("/").map(Number);
    return new Date(year, (month ?? 1) - 1, day ?? 1);
  };

  const mapRecurrence = (parcelado: boolean): RecurrenceType =>
    parcelado ? "recorrente" : "pontual";

  const buildTransactionsPayload = (): Omit<Transaction, "id">[] => {
    return rows.map((row) => {
      const amount = parseBRL(row.brl);
      if (amount === null) {
        throw new Error("Valor inválido encontrado na tabela.");
      }
      const parsedDate = parseDatePtBr(row.data);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Data inválida encontrada na tabela.");
      }

      const type = mapTransactionType(row.tipo);
      const includeInSplit = type === "expense" ? row.incluirRateio : false;

      return {
        type,
        category: row.categoria.trim(),
        description: row.descricao.trim(),
        tag: row.tagDespesa?.trim() || undefined,
        amount,
        person: row.responsavel.trim(),
        date: parsedDate,
        recurrence: mapRecurrence(row.parcelado),
        includeInSplit,
      };
    });
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      if (!user?.id) {
        throw new Error("Você precisa estar logado para salvar transações.");
      }

      const transactionsToInsert = buildTransactionsPayload();
      const inserts = transactionsToInsert.map((transaction) => ({
        user_id: user.id,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        tag: transaction.tag ?? null,
        amount: transaction.amount,
        person: transaction.person,
        date: format(transaction.date, "yyyy-MM-dd"),
        recurrence: transaction.recurrence === "recorrente" ? "monthly" : "once",
        include_in_split: transaction.includeInSplit,
      }));

      const { error } = await supabase
        .from("transactions")
        .insert(inserts)
        .select();

      if (error) {
        throw error;
      }

      clearAll();
      setValidationResult(null);
      setShowConfirmModal(false);
      navigate("/");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as transações.";
      setSaveErrorMessage(message);
      setShowConfirmModal(false);
      setShowSaveErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" onClick={(e) => { e.preventDefault(); navigate("/"); }}>
                Transações
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Entrada em Tabela</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Entrada em Tabela</h1>
          <p className="text-muted-foreground mt-2">
            Registre várias transações de uma vez usando a tabela editável abaixo.
          </p>
        </div>

        {/* File Status Feedback */}
        {fileStatus && (
          <Alert
            variant={fileStatus.type === "error" ? "destructive" : "default"}
            className={`mb-6 ${fileStatus.type === "success" ? "border-green-500 bg-green-50 dark:bg-green-950/20" : ""}`}
          >
            <div className="flex items-start gap-3">
              {fileStatus.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1">
                <AlertTitle className={fileStatus.type === "success" ? "text-green-800 dark:text-green-200" : ""}>
                  {fileStatus.type === "success" ? "Arquivo carregado" : "Erro no arquivo"}
                </AlertTitle>
                <AlertDescription className={fileStatus.type === "success" ? "text-green-700 dark:text-green-300" : ""}>
                  <span className="font-medium">{fileStatus.fileName}</span>
                  <span className="mx-2">—</span>
                  {fileStatus.message}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={handleDismissFileStatus}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </Alert>
        )}

        {/* Action Buttons */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={addRow} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar linha
              </Button>

              <Button
                onClick={deleteSelected}
                variant="outline"
                disabled={!hasSelectedRows}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Deletar selecionadas
              </Button>

              <Button
                onClick={() => setShowClearModal(true)}
                variant="outline"
                disabled={!hasRows}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar tabela
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xml"
                onChange={handleFileSelected}
                className="hidden"
              />
              <Button 
                onClick={handleFileButtonClick} 
                variant="outline"
                disabled={isProcessingFile}
              >
                {isProcessingFile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando arquivo…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Preencher por arquivo
                  </>
                )}
              </Button>

              <Button onClick={handleValidate}>
                <Check className="mr-2 h-4 w-4" />
                Confirmar e validar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Editable Table */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Transações</CardTitle>
            <CardDescription>
              {rows.length === 0
                ? "Adicione linhas para começar a registrar transações."
                : `${rows.length} linha(s) | ${selectedRows.size} selecionada(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditableTable
              rows={rows}
              selectedRows={selectedRows}
              errorsByCell={errorsByCell}
              responsaveis={responsaveis}
              categories={options.categories}
              types={options.types}
              tags={options.tags}
              onRowChange={updateRow}
              onSelectRow={selectRow}
              onSelectAll={selectAll}
              onOptionCommit={registerOption}
              onBrlBlur={formatBrlOnBlur}
            />
          </CardContent>
        </Card>

        {/* Navigation Button */}
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Transações
        </Button>

        {/* Modals */}
        <ClearConfirmModal
          open={showClearModal}
          onClose={() => setShowClearModal(false)}
          onConfirm={handleClearConfirm}
        />
        
        <ErrorsModal
          open={showErrorsModal}
          onClose={() => setShowErrorsModal(false)}
          errorList={validationResult?.errorList || []}
        />

        <InfoModal
          open={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          title="Tabela vazia"
          message="Adicione ao menos uma linha antes de confirmar."
        />
        
        <ConfirmationModal
          open={showConfirmModal}
          onConfirm={handleConfirmSave}
          onReturn={() => setShowConfirmModal(false)}
          validCount={validationResult?.validCount || 0}
          totalBrl={validationResult?.totalBrl || 0}
          isSaving={isSaving}
        />

        <SaveErrorModal
          open={showSaveErrorModal}
          onClose={() => setShowSaveErrorModal(false)}
          message={saveErrorMessage || undefined}
        />
      </div>
    </div>
  );
}

// Main exported component with feature flag check and error boundary
export default function TableEntryPage() {
  if (!FEATURE_FLAGS.ENABLE_TABLE_ENTRY) {
    return <FeatureDisabled />;
  }

  return (
    <TableEntryErrorBoundary fallback={<ErrorFallback />}>
      <TableEntryContent />
    </TableEntryErrorBoundary>
  );
}
