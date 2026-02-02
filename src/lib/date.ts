export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr) return new Date(NaN);

  const [datePart] = dateStr.split('T');
  const [year, month, day] = datePart.split('-').map(Number);

  if (!year || !month || !day) return new Date(NaN);

  return new Date(year, month - 1, day);
};
