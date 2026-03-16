/**
 * Sanitize external content before rendering in the UI or including in templates.
 * Apply to: CSV imports, any future API integrations, user-submitted rich text.
 */
export function sanitizeHTML(dirty: string): string {
  const div = document.createElement('div');
  div.textContent = dirty;
  return div.innerHTML;
}

/**
 * Sanitize CSV field values during import.
 * Strips formula injection attempts (=, +, -, @, \t, \r prefixes).
 */
export function sanitizeCSVField(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return "'" + value;  // Prefix with single quote to neutralize
  }
  return value.trim();
}
