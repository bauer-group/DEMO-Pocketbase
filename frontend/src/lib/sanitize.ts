import DOMPurify from "dompurify";

// Notiz-Inhalte stammen aus einem HTML-Editor-Feld und werden von anderen
// Workspace-Mitgliedern erstellt -> potenziell gefährlich (gespeichertes XSS).
// Wir bereinigen das HTML vor jeder Ausgabe (OWASP/Defense-in-depth) und
// erlauben nur eine schmale, sichere Tag-Liste.
const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "ul", "ol", "li", "a", "blockquote", "code", "pre", "h3", "h4",
];
const ALLOWED_ATTR = ["href", "target", "rel"];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html || "", { ALLOWED_TAGS, ALLOWED_ATTR });
}
