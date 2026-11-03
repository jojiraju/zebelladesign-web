import sanitizeHtml from "sanitize-html";

const looksLikeHtml = (s: string) => /^\s*</.test(s);

/** Allow-list matches what the CMS editor can produce; everything else (scripts, styles, handlers) is dropped. */
export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li", "blockquote", "hr", "a"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }, true) },
  });
}

/** Plain text for meta descriptions / JSON-LD. Works for legacy plain text and editor HTML. */
export function toPlainText(v: string | undefined | null): string {
  if (!v) return "";
  if (!looksLikeHtml(v)) return v.trim();
  return sanitizeHtml(v.replace(/<\/(p|h2|h3|li|blockquote)>/gi, " "), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

/** Renders CMS rich text (HTML) safely; older plain-text values keep their paragraph breaks. */
export function RichText({ html, className = "" }: { html?: string | null; className?: string }) {
  if (!html?.trim()) return null;
  if (!looksLikeHtml(html)) return <div className={`rich ${className}`}>{html.split(/\n{2,}/).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>;
  return <div className={`rich ${className}`} dangerouslySetInnerHTML={{ __html: sanitize(html) }} />;
}
