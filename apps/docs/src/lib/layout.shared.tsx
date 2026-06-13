import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Command Inbox",
      url: "https://command-inbox.sayantanbal.in",
    },
    links: [
      {
        text: "App",
        url: "https://command-inbox.sayantanbal.in",
        external: true,
      },
      {
        text: "GitHub",
        url: "https://github.com/sayantanbal/command-inbox",
        external: true,
      },
    ],
  };
}
