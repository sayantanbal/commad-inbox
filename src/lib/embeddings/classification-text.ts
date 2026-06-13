export function classificationEmbedText(subject: string, sender: string, snippet: string): string {
  return `${subject}\n${sender}\n${snippet}`.trim();
}
