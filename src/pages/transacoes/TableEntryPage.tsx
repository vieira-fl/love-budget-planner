import { Component, ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, Plus, Upload, Check, AlertTriangle, Trash2, RotateCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { EditableTable } from "./components/EditableTable";
import { ErrorsModal, InfoModal, SuccessModal, ClearConfirmModal } from "./components/ValidationModals";
import { useTableEntry } from "./hooks/useTableEntry";
import { ValidationResult } from "./types";

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
    registerOption,
    formatBrlOnBlur,
    validate,
  } = useTableEntry({ defaultResponsavel: userName, userId });

  const [showClearModal, setShowClearModal] = useState(false);
  const [showErrorsModal, setShowErrorsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const responsaveis = [userName];
  const hasSelectedRows = selectedRows.size > 0;
  const hasRows = rows.length > 0;

  const handleValidate = () => {
    if (rows.length === 0) {
      setValidationResult(null);
      setShowInfoModal(true);
      return;
    }

    const result = validate();
    setValidationResult(result);
    if (result.valid) {
      setShowSuccessModal(true);
    } else {
      setShowErrorsModal(true);
    }
  };

  const handleClearConfirm = () => {
    clearAll();
    setShowClearModal(false);
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

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Preencher por arquivo
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Disponível no Checkpoint C</TooltipContent>
              </Tooltip>

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
        
        <SuccessModal
          open={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          validCount={validationResult?.validCount || 0}
          totalBrl={validationResult?.totalBrl || 0}
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
