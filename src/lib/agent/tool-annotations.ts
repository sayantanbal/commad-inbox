export type AgentToolAnnotation = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
};

/** MCP-style tool hints stored on tool.metadata for approval UI and docs. */
export const AGENT_TOOL_ANNOTATIONS: Record<string, AgentToolAnnotation> = {
  send_email: { destructiveHint: true },
  schedule_send: { destructiveHint: true },
  create_calendar_invite: { destructiveHint: true },
  reschedule_calendar_event: { destructiveHint: true },
  cancel_calendar_event: { destructiveHint: true },
  cancel_meeting_with_notice: { destructiveHint: true },
  draft_commitment_follow_up: { destructiveHint: false },
  list_calendar_events: { readOnlyHint: true },
  search_threads: { readOnlyHint: true },
  get_thread_summary: { readOnlyHint: true },
  stage_thread_attachment: { readOnlyHint: true },
  list_operations: { readOnlyHint: true },
  get_schema: { readOnlyHint: true },
};

export function toolMetadata(
  name: string,
  extra?: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
  const hints = AGENT_TOOL_ANNOTATIONS[name];
  return {
    ...extra,
    ...(hints ?? {}),
  };
}
