export function getDateLabel(timestamp?: number): string {
  if (!timestamp) return 'Older';

  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (messageDate.getTime() === today.getTime()) {
    return 'today';
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'yesterday';
  }

  // Check if within last 6 days (Sunday to Saturday)
  const sixDaysAgo = new Date(today);
  sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
  if (messageDate >= sixDaysAgo) {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
  }

  // Older: EEE d MMM
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  })
    .format(date)
    .replace(',', '');
}
