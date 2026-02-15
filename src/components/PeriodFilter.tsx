import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
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

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));


export function PeriodFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilter,
}: PeriodFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  

  const handleMonthYearSelect = () => {
    if (selectedYear) {
      const year = parseInt(selectedYear);
      
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
    }
  };

  const handleClear = () => {
    setSelectedMonth('');
    setSelectedYear('');
    onClearFilter();
  };

  const isFiltered = startDate || endDate;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Month/Year Select */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Mês e Ano</span>
          <div className="flex gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
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

            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
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
          <Badge variant="secondary" className="text-xs">
            Exibindo: {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "..."} 
            {" - "}
            {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "..."}
          </Badge>
        </div>
      )}
    </div>
  );
}
