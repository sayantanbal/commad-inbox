export function resolveSnippetVariables(
  body: string,
  context: { firstName?: string; projectName?: string }
): string {
  return body
    .replace(/\{\{first_name\}\}/gi, context.firstName ?? "there")
    .replace(/\{\{project_name\}\}/gi, context.projectName ?? "the project");
}
