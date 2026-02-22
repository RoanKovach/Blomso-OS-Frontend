import { format, parse, isValid } from 'date-fns';

/**
 * Normalizes a variety of date string formats into a standard 'yyyy-MM-dd' format.
 * This function is designed to handle common date formats found in soil test reports.
 * 
 * @param {string | null | undefined} dateString The date string to normalize.
 * @returns {string} The date formatted as 'yyyy-MM-dd'. Falls back to the current date for invalid input.
 */
export const normalizeDate = (dateString) => {
  if (!dateString) {
    console.warn("normalizeDate called with null or undefined. Falling back to today.");
    return format(new Date(), 'yyyy-MM-dd');
  }
  
  // A list of common formats to try parsing
  const formatsToTry = [
    'MM/dd/yyyy', 
    'yyyy-MM-dd', 
    'M/d/yyyy', 
    'MM-dd-yyyy', 
    'yyyy/MM/dd', 
    'dd MMMM yyyy', 
    'MMMM d, yyyy'
  ];
  
  for (const fmt of formatsToTry) {
    const parsedDate = parse(dateString, fmt, new Date());
    if (isValid(parsedDate)) {
      return format(parsedDate, 'yyyy-MM-dd');
    }
  }

  // Final attempt with native Date constructor for ISO 8601 or other standard formats
  const nativeParsedDate = new Date(dateString);
  if (isValid(nativeParsedDate)) {
    return format(nativeParsedDate, 'yyyy-MM-dd');
  }
  
  console.warn(`Could not parse date: "${dateString}". Falling back to today's date.`);
  return format(new Date(), 'yyyy-MM-dd');
};