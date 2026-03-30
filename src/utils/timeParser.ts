/**
 * Returns a local-timezone date string in "YYYY-MM-DD" format.
 * @param offsetDays - number of days to offset from today (default 0 = today)
 *
 * WHY: `new Date().toISOString()` always returns UTC, which can be a day
 * behind/ahead for users in UTC± timezones. This function uses local
 * Date methods so the string always matches the user's wall-clock date.
 */
export const getLocalDateString = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface ParsedTimeMatch {
  raw: string;
  index: number;
}

export function extractTimeMatch(text: string): ParsedTimeMatch | null {
  // Matches times like "5pm", "5:30 pm", "10am", "12:00"
  const timeRegex = /\b((?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:am|pm)|(?:[01]?[0-9]|2[0-3]):[0-5][0-9])\b/i;
  
  const match = text.match(timeRegex);
  if (match && match.index !== undefined) {
    return {
      raw: match[0],
      index: match.index,
    };
  }
  return null;
}

export function getHighlightSegments(text: string): { text: string; isTime: boolean }[] {
  const match = extractTimeMatch(text);
  if (!match) return [{ text, isTime: false }];

  const before = text.substring(0, match.index);
  const matchedText = match.raw;
  const after = text.substring(match.index + matchedText.length);

  const segments = [];
  if (before) segments.push({ text: before, isTime: false });
  segments.push({ text: matchedText, isTime: true });
  if (after) segments.push({ text: after, isTime: false });

  return segments;
}

export function parseTaskTime(timeStr: string, targetDateStr: string): Date | null {
  // targetDateStr formatted as "YYYY-MM-DD"
  const cleanTime = timeStr.toLowerCase().trim();
  const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/;
  const match = cleanTime.match(timeRegex);

  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3] || 'am'; // default am if none

  if (period === 'pm' && hours < 12) hours += 12;
  if (period === 'am' && hours === 12) hours = 0;

  const [year, month, day] = targetDateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // If time seems invalid, return null
  if (isNaN(dateObj.getTime())) return null;
  return dateObj;
}
