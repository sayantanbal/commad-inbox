import "server-only";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { externalConnections, threadExternalTasks } from "@/lib/db/schema";

const LINEAR_API = "https://api.linear.app/graphql";

export async function getLinearConnection(userId: string) {
  const [row] = await db
    .select()
    .from(externalConnections)
    .where(and(eq(externalConnections.userId, userId), eq(externalConnections.provider, "linear")));
  return row ?? null;
}

export async function saveLinearConnection(
  userId: string,
  accessToken: string,
  teamId?: string,
  defaultProjectId?: string
) {
  const id = `${userId}:linear`;
  await db
    .insert(externalConnections)
    .values({
      id,
      userId,
      provider: "linear",
      accessToken,
      teamId: teamId ?? null,
      defaultProjectId: defaultProjectId ?? null,
    })
    .onConflictDoUpdate({
      target: externalConnections.id,
      set: {
        accessToken,
        teamId: teamId ?? null,
        defaultProjectId: defaultProjectId ?? null,
      },
    });
}

export async function createLinearIssue(params: {
  accessToken: string;
  teamId: string;
  title: string;
  description: string;
  projectId?: string;
}): Promise<{ id: string; url: string }> {
  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }
  `;

  const response = await fetch(LINEAR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: params.accessToken,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          teamId: params.teamId,
          title: params.title,
          description: params.description,
          projectId: params.projectId,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Linear API error: ${response.statusText}`);
  }

  const json = (await response.json()) as {
    data?: { issueCreate?: { issue?: { id: string; url: string } } };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }

  const issue = json.data?.issueCreate?.issue;
  if (!issue) throw new Error("Linear did not return an issue");

  return { id: issue.id, url: issue.url };
}

export async function linkThreadExternalTask(
  userId: string,
  threadId: string,
  externalTaskId: string,
  url: string
) {
  await db.insert(threadExternalTasks).values({
    id: randomUUID(),
    userId,
    threadId,
    provider: "linear",
    externalTaskId,
    url,
  });
}

export async function getExternalTasksForThread(userId: string, threadId: string) {
  return db
    .select()
    .from(threadExternalTasks)
    .where(and(eq(threadExternalTasks.userId, userId), eq(threadExternalTasks.threadId, threadId)));
}
