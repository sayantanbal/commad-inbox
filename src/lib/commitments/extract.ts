import "server-only";

import { generateJsonWithProvider } from "@/lib/ai/generate";
import { getDefaultProvider } from "@/lib/ai/with-fallback";
import {
  commitmentExtractionResultSchema,
  type ExtractedCommitment,
} from "@/lib/schemas/domain";

const COMMITMENT_SYSTEM = `You extract explicit commitments from email messages.
A commitment is a promise to do something ("I'll send that by Friday", "Let me loop you in next week").
- outbound: the sender (user) promised something
- inbound: the other party promised something to the user
Only extract clear commitments. Return empty array if none.
Include dueDate as ISO 8601 when a deadline is mentioned. confidence 0-1.`;

export async function extractCommitmentsFromMessage(params: {
  subject: string;
  body: string;
  userEmail: string;
  senderEmail: string;
  participants: string[];
}): Promise<ExtractedCommitment[]> {
  const prompt = [
    `User email: ${params.userEmail}`,
    `Message from: ${params.senderEmail}`,
    `Participants: ${params.participants.join(", ")}`,
    `Subject: ${params.subject}`,
    "",
    "Body:",
    params.body.slice(0, 8000),
  ].join("\n");

  try {
    const { data } = await generateJsonWithProvider(
      getDefaultProvider(),
      prompt,
      COMMITMENT_SYSTEM,
      commitmentExtractionResultSchema
    );
    return data.commitments;
  } catch (error) {
    console.error("[commitments] extraction failed", error);
    return [];
  }
}
