/** Strip scripts/event handlers before rendering marketing HTML in a sandboxed iframe. */
export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/\s(on\w+|javascript:)[^>\s]*/gi, "");
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const QUOTE_MARKERS = [
  /<blockquote[\s>]/i,
  /<div[^>]+class="[^"]*gmail_quote[^"]*"/i,
  /<div[^>]+class="[^"]*gmail_extra[^"]*"/i,
];

/** Split HTML into visible body vs collapsed quoted reply (Gmail-style). */
export function splitQuotedHtml(html: string): { main: string; quoted: string | null } {
  let splitAt = html.length;

  for (const marker of QUOTE_MARKERS) {
    const match = html.match(marker);
    if (match?.index !== undefined && match.index < splitAt) {
      splitAt = match.index;
    }
  }

  const onWrote = html.match(/\n?\s*On .+wrote:\s*\n/i);
  if (onWrote?.index !== undefined && onWrote.index < splitAt) {
    splitAt = onWrote.index;
  }

  if (splitAt >= html.length) {
    return { main: html, quoted: null };
  }

  const main = html.slice(0, splitAt).trim();
  const quoted = html.slice(splitAt).trim();
  if (!quoted) {
    return { main: html, quoted: null };
  }
  return { main: main || html, quoted };
}

export function buildEmailPreviewDocument(bodyHtml: string): string {
  const safe = sanitizeEmailHtml(bodyHtml);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" rel="noopener noreferrer" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #202124;
        font-family: "Google Sans", Roboto, Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: anywhere;
      }
      img { max-width: 100% !important; height: auto !important; }
      table { max-width: 100% !important; }
      a { color: #1a73e8; }
      blockquote {
        margin: 0;
        padding-left: 12px;
        border-left: 1px solid #dadce0;
        color: #5f6368;
      }
    </style>
  </head>
  <body>${safe}</body>
</html>`;
}
