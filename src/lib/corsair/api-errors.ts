export class GmailApiDisabledError extends Error {
  readonly projectId?: string;
  readonly activationUrl?: string;

  constructor(details?: { projectId?: string; activationUrl?: string }) {
    super("Gmail API is not enabled for this Google Cloud project.");
    this.name = "GmailApiDisabledError";
    this.projectId = details?.projectId;
    this.activationUrl = details?.activationUrl;
  }
}

type ApiErrorLike = {
  status?: number;
  body?: {
    error?: {
      message?: string;
      details?: Array<{
        metadata?: { activationUrl?: string; consumer?: string };
      }>;
    };
  };
};

export function isGmailApiDisabled(error: unknown): boolean {
  const err = error as ApiErrorLike;
  const message = err?.body?.error?.message ?? "";
  return (
    err?.status === 403 &&
    (message.includes("Gmail API has not been used") ||
      message.includes("gmail.googleapis.com") ||
      message.includes("accessNotConfigured"))
  );
}

export function toGmailApiDisabledError(error: unknown): GmailApiDisabledError {
  const err = error as ApiErrorLike;
  const details = err?.body?.error?.details?.[0]?.metadata;
  return new GmailApiDisabledError({
    projectId: details?.consumer?.replace("projects/", ""),
    activationUrl: details?.activationUrl,
  });
}
