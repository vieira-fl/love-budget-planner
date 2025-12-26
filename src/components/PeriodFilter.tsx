import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface PeriodFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClearFilter: () => void;
  onMonthOnlyFilter?: (month: number | undefined) => void;
  monthOnlyFilter?: number | undefined;
}

const months = [
  { value: 'none', label: 'Todos os meses' },
  { value: '0', label: 'Janeiro' },
  { value: '1', label: 'Fevereiro' },
  { value: '2', label: 'Março' },
  { value: '3', label: 'Abril' },
  { value: '4', label: 'Maio' },
  { value: '5', label: 'Junho' },
  { value: '6', label: 'Julho' },
  { value: '7', label: 'Agosto' },
  { value: '8', label: 'Setembro' },
  { value: '9', label: 'Outubro' },
  { value: '10', label: 'Novembro' },
  { value: '11', label: 'Dezembro' },
];

const monthsOnlyFilter = [
  { value: '0', label: 'Janeiro (todos os anos)' },
  { value: '1', label: 'Fevereiro (todos os anos)' },
  { value: '2', label: 'Março (todos os anos)' },
  { value: '3', label: 'Abril (todos os anos)' },
  { value: '4', label: 'Maio (todos os anos)' },
  { value: '5', label: 'Junho (todos os anos)' },
  { value: '6', label: 'Julho (todos os anos)' },
  { value: '7', label: 'Agosto (todos os anos)' },
  { value: '8', label: 'Setembro (todos os anos)' },
  { value: '9', label: 'Outubro (todos os anos)' },
  { value: '10', label: 'Novembro (todos os anos)' },
  { value: '11', label: 'Dezembro (todos os anos)' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

const quarters = [
  { value: 'Q1', label: '1º Trimestre (Jan-Mar)' },
  { value: 'Q2', label: '2º Trimestre (Abr-Jun)' },
  { value: 'Q3', label: '3º Trimestre (Jul-Set)' },
  { value: 'Q4', label: '4º Trimestre (Out-Dez)' },
];

export function PeriodFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilter,
  onMonthOnlyFilter,
  monthOnlyFilter,
}: PeriodFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('');
  const [selectedMonthOnly, setSelectedMonthOnly] = useState<string>('');

  const handleMonthYearSelect = () => {
    if (selectedYear) {
      const year = parseInt(selectedYear);
      
      // Clear month-only filter when using month+year
      if (onMonthOnlyFilter) {
        onMonthOnlyFilter(undefined);
        setSelectedMonthOnly('');
      }
      
      if (selectedMonth && selectedMonth !== 'none') {
        // Specific month selected
        const month = parseInt(selectedMonth);
        const start = startOfMonth(new Date(year, month));
        const end = endOfMonth(new Date(year, month));
        onStartDateChange(start);
        onEndDateChange(end);
      } else {
        // Only year selected (all months)
        const start = startOfYear(new Date(year, 0));
        const end = endOfYear(new Date(year, 0));
        onStartDateChange(start);
        onEndDateChange(end);
      }
      setSelectedQuarter('');
    }
  };

  const handleQuarterSelect = () => {
    if (selectedQuarter && selectedYear) {
      const year = parseInt(selectedYear);
      const quarterNum = parseInt(selectedQuarter.replace('Q', '')) - 1;
      const baseDate = new Date(year, quarterNum * 3);
      const start = startOfQuarter(baseDate);
      const end = endOfQuarter(baseDate);
      onStartDateChange(start);
      onEndDateChange(end);
      setSelectedMonth('');
      
      // Clear month-only filter
      if (onMonthOnlyFilter) {
        onMonthOnlyFilter(undefined);
        setSelectedMonthOnly('');
      }
    }
  };

  const handleMonthOnlySelect = () => {
    if (selectedMonthOnly && onMonthOnlyFilter) {
      const month = parseInt(selectedMonthOnly);
      onMonthOnlyFilter(month);
      
      // Clear date range filters
      onStartDateChange(undefined);
      onEndDateChange(undefined);
      setSelectedMonth('');
      setSelectedYear('');
      setSelectedQuarter('');
    }
  };

  const handleClear = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedQuarter('');
    setSelectedMonthOnly('');
    if (onMonthOnlyFilter) {
      onMonthOnlyFilter(undefined);
    }
    onClearFilter();
  };

  const isFiltered = startDate || endDate || monthOnlyFilter !== undefined;

  const getMonthLabel = (monthIndex: number) => {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return monthNames[monthIndex];
  };

  return (
    <div className="bg-card rounded-xl p-4 card-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          Filtrar por Período
        </h3>
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* All Filters in Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month/Year Select */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Mês e Ano</span>
          <div className="flex gap-2">
            <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); setSelectedQuarter(''); }}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setSelectedQuarter(''); }}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              size="icon"
              onClick={handleMonthYearSelect}
              disabled={!selectedYear}
              className="h-10 w-10 shrink-0"
              title="Aplicar"
            >
              ✓
            </Button>
          </div>
        </div>

        {/* Month Only (all years) */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Só o Mês (todos os anos)</span>
          <div className="flex gap-2">
            <Select value={selectedMonthOnly} onValueChange={setSelectedMonthOnly}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {monthsOnlyFilter.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              size="icon"
              onClick={handleMonthOnlySelect}
              disabled={!selectedMonthOnly || !onMonthOnlyFilter}
              className="h-10 w-10 shrink-0"
              title="Aplicar"
            >
              ✓
            </Button>
          </div>
        </div>

        {/* Quarterly Select */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Trimestre</span>
          <div className="flex gap-2">
            <Select value={selectedQuarter} onValueChange={(val) => { setSelectedQuarter(val); setSelectedMonth(''); }}>
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((quarter) => (
                  <SelectItem key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="secondary"
              size="icon"
              onClick={handleQuarterSelect}
              disabled={!selectedQuarter || !selectedYear}
              className="h-10 w-10 shrink-0"
              title="Aplicar"
            >
              ✓
            </Button>
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Período Personalizado</span>
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 min-w-0 justify-start text-left font-normal h-10",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {startDate ? format(startDate, "dd/MM/yy", { locale: ptBR }) : "Início"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={onStartDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground text-xs shrink-0">→</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 min-w-0 justify-start text-left font-normal h-10",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {endDate ? format(endDate, "dd/MM/yy", { locale: ptBR }) : "Fim"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={onEndDateChange}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Active Filter Badge */}
      {isFiltered && (
        <div className="pt-3 mt-3 border-t border-border">
          {monthOnlyFilter !== undefined ? (
            <Badge variant="secondary" className="text-xs">
              Exibindo: {getMonthLabel(monthOnlyFilter)} de todos os anos
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Exibindo: {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "..."} 
              {" - "}
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "..."}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
