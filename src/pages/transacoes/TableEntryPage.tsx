import { Component, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FEATURE_FLAGS } from "@/config/featureFlags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { ArrowLeft, Plus, Upload, Check, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
          <Button onClick={() => navigate("/")}>
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
  const disabledTooltip = "Disponível no próximo checkpoint";

  const upcomingFeatures = [
    "Adicionar/editar linhas",
    "Upload opcional CSV/XML para preencher",
    "Validação e confirmação",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Entrada em Tabela</h1>
          <p className="text-muted-foreground mt-2">
            Registre várias transações de uma vez usando uma tabela editável (em desenvolvimento).
          </p>
        </div>

        {/* Informative Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Checkpoint A concluído</CardTitle>
            <CardDescription>
              A tabela editável será implementada no próximo passo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">O que virá a seguir:</p>
            <ul className="space-y-2">
              {upcomingFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar linha
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{disabledTooltip}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled variant="outline">
                      <Upload className="mr-2 h-4 w-4" />
                      Preencher por arquivo (CSV/XML)
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{disabledTooltip}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button disabled>
                      <Check className="mr-2 h-4 w-4" />
                      Confirmar e adicionar transações
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{disabledTooltip}</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Button */}
        <Button onClick={() => navigate("/")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Transações
        </Button>
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
