export type DeadlineStatus = 'expired' | 'soon' | 'ok' | 'none';

export const getDeadlineStatus = (deadline: string | null): DeadlineStatus => {
  if (!deadline) return 'none';
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  now.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'expired';
  if (diffDays === 0) return 'soon';
  return 'ok';
};

export const formatDate = (date: string | null): string => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};