import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';

interface PeriodFilterProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onClearFilter: () => void;
}

const monthLabels = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export function PeriodFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilter,
}: PeriodFilterProps) {
  // Default: current year, months from January to last closed month
  const getDefaultYear = () => new Date().getFullYear();
  const getDefaultMonths = () => {
    const now = new Date();
    const lastClosedMonth = now.getMonth() - 1; // 0-indexed, previous month
    if (lastClosedMonth < 0) return []; // January: no closed month yet this year
    return Array.from({ length: lastClosedMonth + 1 }, (_, i) => i);
  };

  const [selectedYear, setSelectedYear] = useState<number | null>(getDefaultYear);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(getDefaultMonths);

  // Apply default filter on mount
  useEffect(() => {
    const year = getDefaultYear();
    const months = getDefaultMonths();
    if (months.length > 0) {
      applyFilter(year, months);
    } else {
      // If no closed month yet (January), filter whole year
      applyFilter(year, []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilter = useCallback((year: number | null, months: number[]) => {
    if (!year) {
      onClearFilter();
      return;
    }

    if (months.length === 0) {
      // Year only
      onStartDateChange(startOfYear(new Date(year, 0)));
      onEndDateChange(endOfYear(new Date(year, 0)));
    } else {
      // Specific months — find min/max to create range
      const sortedMonths = [...months].sort((a, b) => a - b);
      const start = startOfMonth(new Date(year, sortedMonths[0]));
      const end = endOfMonth(new Date(year, sortedMonths[sortedMonths.length - 1]));
      onStartDateChange(start);
      onEndDateChange(end);
    }
  }, [onStartDateChange, onEndDateChange, onClearFilter]);

  const toggleYear = (year: number) => {
    if (selectedYear === year) {
      setSelectedYear(null);
      setSelectedMonths([]);
      onClearFilter();
    } else {
      setSelectedYear(year);
      setSelectedMonths([]);
      applyFilter(year, []);
    }
  };

  const toggleMonth = (month: number) => {
    if (!selectedYear) return;
    const newMonths = selectedMonths.includes(month)
      ? selectedMonths.filter((m) => m !== month)
      : [...selectedMonths, month];
    setSelectedMonths(newMonths);
    applyFilter(selectedYear, newMonths);
  };

  const handleClear = () => {
    setSelectedYear(null);
    setSelectedMonths([]);
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

      <div className="space-y-4">
        {/* Year Buttons */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Ano</span>
          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <Button
                key={year}
                variant={selectedYear === year ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleYear(year)}
                className="h-8 px-3 text-xs"
              >
                {year}
              </Button>
            ))}
          </div>
        </div>

        {/* Month Buttons */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Mês</span>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {monthLabels.map((label, index) => (
              <Button
                key={index}
                variant={selectedMonths.includes(index) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMonth(index)}
                disabled={!selectedYear}
                className="h-8 px-2 text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Date Range */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Período Personalizado</span>
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "flex-1 min-w-0 justify-start text-left font-normal h-9",
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
                  onSelect={(date) => {
                    setSelectedYear(null);
                    setSelectedMonths([]);
                    onStartDateChange(date);
                  }}
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
                    "flex-1 min-w-0 justify-start text-left font-normal h-9",
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
                  onSelect={(date) => {
                    setSelectedYear(null);
                    setSelectedMonths([]);
                    onEndDateChange(date);
                  }}
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