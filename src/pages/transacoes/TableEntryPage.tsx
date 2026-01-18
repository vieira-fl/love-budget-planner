import { Component, ReactNode, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, Plus, Upload, Check, AlertTriangle, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EditableTable } from "./components/EditableTable";
import { ConfirmationModal, ErrorsModal, InfoModal, SaveErrorModal, ClearConfirmModal } from "./components/ValidationModals";
import { useTableEntry } from "./hooks/useTableEntry";
import { ErrorsByCell, TransactionRow, ValidationResult } from "./types";
import { isValidDatePtBr, parseBRL, sanitizeBRLInput } from "./utils/tableEntryUtils";
import { Transaction, TransactionType, RecurrenceType } from "@/types/finance";

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
  const [importModal, setImportModal] = useState<{
    open: boolean;
    title: string;
    message: ReactNode;
  }>({
    open: false,
    title: "",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const responsaveis = [userName];
  const hasSelectedRows = selectedRows.size > 0;
  const hasRows = rows.length > 0;

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const REQUIRED_FIELDS = ["data", "descricao", "brl"];

  const normalizeHeader = (value: string) =>
    value.replace(/\uFEFF/g, "").trim().toLowerCase();

  const inferDelimiter = (line: string) => {
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    return semicolonCount >= commaCount ? ";" : ",";
  };

  const parseDelimitedLine = (line: string, delimiter: string) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === "\"") {
        const nextChar = line[i + 1];
        if (inQuotes && nextChar === "\"") {
          current += "\"";
          i += 1;
          continue;
        }
        inQuotes = !inQuotes;
        continue;
      }
      if (char === delimiter && !inQuotes) {
        result.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    result.push(current);
    return result;
  };

  const normalizeDateToPtBr = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    const normalizeParts = (day: string, month: string, year: string) => {
      const normalizedYear = year.length === 2 ? `20${year}` : year;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${normalizedYear}`;
    };

    const matchPt = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (matchPt) {
      return normalizeParts(matchPt[1], matchPt[2], matchPt[3]);
    }

    const matchIso = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (matchIso) {
      return normalizeParts(matchIso[3], matchIso[2], matchIso[1]);
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return normalizeParts(
        String(parsed.getDate()),
        String(parsed.getMonth() + 1),
        String(parsed.getFullYear())
      );
    }

    return trimmed;
  };

  const buildRow = (dataValue: string, descricaoValue: string, brlValue: string) => {
    const id = crypto.randomUUID();
    const normalizedDate = normalizeDateToPtBr(dataValue);
    const sanitizedBrl = sanitizeBRLInput(brlValue);
    const descricao = descricaoValue.trim();

    const row: TransactionRow = {
      id,
      data: normalizedDate,
      descricao,
      brl: sanitizedBrl,
      responsavel: userName,
      categoria: "",
      tipo: "",
      tagDespesa: "",
      incluirRateio: true,
      parcelado: false,
    };

    const rowErrors: Partial<Record<keyof TransactionRow, string>> = {};

    if (!normalizedDate) {
      rowErrors.data = "obrigatório";
    } else if (!isValidDatePtBr(normalizedDate)) {
      rowErrors.data = "inválido";
    }

    if (!descricao) {
      rowErrors.descricao = "obrigatório";
    }

    if (!sanitizedBrl) {
      rowErrors.brl = "obrigatório";
    } else if (parseBRL(sanitizedBrl) === null) {
      rowErrors.brl = "inválido";
    }

    return { row, rowErrors };
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const text = (await file.text()).replace(/^\uFEFF/, "");
      const extension = file.name.split(".").pop()?.toLowerCase();

      let rowsToAppend: TransactionRow[] = [];
      const nextErrors: ErrorsByCell = {};
      const alertRowIds = new Set<string>();
      const foundFields = new Set<string>();

      if (!text.trim()) {
        throw new Error("O arquivo está vazio.");
      }

      if (extension === "csv") {
        const lines = text.split(/\r?\n/);
        const headerIndex = lines.findIndex((line) => line.trim().length > 0);
        if (headerIndex === -1) {
          throw new Error("O arquivo está vazio.");
        }

        const headerLine = lines[headerIndex];
        const hasBomInHeader = /\uFEFF/.test(headerLine);
        const delimiter = inferDelimiter(headerLine);
        const headerValues = parseDelimitedLine(headerLine, delimiter).map(normalizeHeader);
        headerValues.forEach((value) => {
          if (value) {
            foundFields.add(value);
          }
        });

        const headerMap = new Map<string, number>();
        headerValues.forEach((value, index) => {
          if (value) {
            headerMap.set(value, index);
          }
        });

        const missingFields = REQUIRED_FIELDS.filter((field) => !headerMap.has(field));
        if (missingFields.length > 0) {
          const bomMessage = hasBomInHeader ? "Arquivo contém BOM no cabeçalho; " : "";
          throw new Error(
            `${bomMessage}Campos encontrados: ${Array.from(foundFields).join(", ") || "nenhum"}. ` +
              `Campos obrigatórios: ${REQUIRED_FIELDS.join(", ")}.`
          );
        }

        for (let i = headerIndex + 1; i < lines.length; i += 1) {
          const line = lines[i];
          if (!line.trim()) {
            continue;
          }
          const columns = parseDelimitedLine(line, delimiter);
          const dataValue = columns[headerMap.get("data") ?? -1] ?? "";
          const descricaoValue = columns[headerMap.get("descricao") ?? -1] ?? "";
          const brlValue = columns[headerMap.get("brl") ?? -1] ?? "";
          const { row, rowErrors } = buildRow(dataValue, descricaoValue, brlValue);
          if (Object.keys(rowErrors).length > 0) {
            nextErrors[row.id] = rowErrors;
            alertRowIds.add(row.id);
          }
          rowsToAppend.push(row);
        }
      } else if (extension === "xml") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
          throw new Error("Não foi possível ler o XML informado.");
        }

        const allElements = Array.from(xmlDoc.getElementsByTagName("*"));
        const recordTags = ["row", "item", "transaction", "lancamento"];
        let recordElements = allElements.filter((el) =>
          recordTags.includes(el.tagName.toLowerCase())
        );

        if (recordElements.length === 0) {
          recordElements = allElements.filter((el) => {
            const childTags = Array.from(el.children).map((child) =>
              child.tagName.toLowerCase()
            );
            const attributes = Array.from(el.attributes).map((attr) =>
              attr.name.toLowerCase()
            );
            const available = new Set([...childTags, ...attributes]);
            REQUIRED_FIELDS.forEach((field) => {
              if (available.has(field)) {
                foundFields.add(field);
              }
            });
            return REQUIRED_FIELDS.some((field) => available.has(field));
          });
        }

        if (recordElements.length === 0) {
          throw new Error("Não foi possível reconhecer a estrutura do XML.");
        }

        recordElements.forEach((record) => {
          const fieldNames = [
            ...Array.from(record.attributes).map((attr) => attr.name.toLowerCase()),
            ...Array.from(record.children).map((child) => child.tagName.toLowerCase()),
            ...Array.from(record.getElementsByTagName("*")).map((child) =>
              child.tagName.toLowerCase()
            ),
          ];
          fieldNames.forEach((name) => foundFields.add(name));
        });

        const missingFields = REQUIRED_FIELDS.filter((field) => !foundFields.has(field));
        if (missingFields.length > 0) {
          throw new Error(
            `Campos encontrados: ${Array.from(foundFields).join(", ") || "nenhum"}. ` +
              `Campos obrigatórios: ${REQUIRED_FIELDS.join(", ")}.`
          );
        }

        const getFieldValue = (record: Element, field: string) => {
          const attribute = Array.from(record.attributes).find(
            (attr) => attr.name.toLowerCase() === field
          );
          if (attribute) {
            return attribute.value;
          }
          const directChild = Array.from(record.children).find(
            (child) => child.tagName.toLowerCase() === field
          );
          if (directChild) {
            return directChild.textContent ?? "";
          }
          const descendant = Array.from(record.getElementsByTagName("*")).find(
            (child) => child.tagName.toLowerCase() === field
          );
          return descendant?.textContent ?? "";
        };

        recordElements.forEach((record) => {
          const dataValue = getFieldValue(record, "data");
          const descricaoValue = getFieldValue(record, "descricao");
          const brlValue = getFieldValue(record, "brl");
          const { row, rowErrors } = buildRow(dataValue, descricaoValue, brlValue);
          if (Object.keys(rowErrors).length > 0) {
            nextErrors[row.id] = rowErrors;
            alertRowIds.add(row.id);
          }
          rowsToAppend.push(row);
        });
      } else {
        throw new Error("Formato de arquivo não suportado. Use CSV ou XML.");
      }

      if (rowsToAppend.length === 0) {
        throw new Error("Nenhuma linha válida foi encontrada no arquivo.");
      }

      appendRows(rowsToAppend, nextErrors);

      const alertCount = alertRowIds.size;
      const messageLines = [
        `Linhas adicionadas: ${rowsToAppend.length}`,
        alertCount > 0 ? `Linhas com alertas: ${alertCount}` : null,
      ].filter(Boolean) as string[];

      setImportModal({
        open: true,
        title: "Importação para a tabela concluída",
        message: (
          <div className="space-y-1">
            {messageLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível importar o arquivo.";
      setImportModal({
        open: true,
        title: "Arquivo inválido",
        message,
      });
    } finally {
      setIsProcessingFile(false);
      event.target.value = "";
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

        <InfoModal
          open={importModal.open}
          onClose={() =>
            setImportModal((prev) => ({
              ...prev,
              open: false,
            }))
          }
          title={importModal.title}
          message={importModal.message}
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
