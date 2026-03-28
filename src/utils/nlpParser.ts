/**
 * Parses a natural language voice transcript into distinct tasks.
 * Uses regex to split on common spoken conjunctive phrases or heavy pauses.
 */
export function parseMultiTasks(transcript: string): string[] {
  if (!transcript || transcript.trim() === '') return [];

  // Split on variations of "and", "and then", "also", "plus", or heavy comma pauses
  // The regex uses a positive lookbehind to avoid splitting on "and" that's part of a word,
  // but standard JS doesn't always support lookbehinds fully. We use a simpler bounding regex.
  const splitRegex = /\b(?:and then|and also|also|plus|and)\b/i;
  
  // First, we can split by common punctuation that acts as separators
  const punctuationSplit = transcript.split(/[,\.\n;]+/);

  let rawItems: string[] = [];
  punctuationSplit.forEach(chunk => {
    // Then split remaining chunks by conjunctive keywords
    const subChunks = chunk.split(splitRegex);
    rawItems.push(...subChunks);
  });

  return rawItems
    .map(item => item.trim())
    // Remove trailing periods and empty strings
    .filter(item => item.length > 0)
    .map(item => {
      // Capitalize first letter of each task
      return item.charAt(0).toUpperCase() + item.slice(1);
    });
}
