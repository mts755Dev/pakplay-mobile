export function parseISODateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

export function isPast(date: Date): boolean {
  return date.getTime() < Date.now();
}
