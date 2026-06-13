import defaultMdxComponents from "fumadocs-ui/mdx";
import { Callout } from "fumadocs-ui/components/callout";
import { Mermaid } from "fumadocs-mermaid/ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMDXComponents(components?: Record<string, any>): Record<string, any> {
  return {
    ...defaultMdxComponents,
    Callout,
    Mermaid,
    ...components,
  };
}
