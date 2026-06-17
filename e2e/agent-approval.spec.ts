import { expect, test } from "@playwright/test";

test.describe("agent approval harness", () => {
  test("send_email: approve pauses then resumes", async ({ page }) => {
    await page.goto("/test/agent-approval");

    const sendSection = page.getByRole("region", { name: "Send email approval" });
    await expect(sendSection.getByText("Pending approval")).toBeVisible();
    await expect(sendSection.getByText("Send email to friend@corsair.dev")).toBeVisible();

    await sendSection.getByRole("button", { name: "Approve & send", exact: true }).click();
    await expect(page.getByTestId("send-email-result")).toHaveText("approved");
  });

  test("create_calendar_invite: reject pauses then stops", async ({ page }) => {
    await page.goto("/test/agent-approval");

    const calendarSection = page.getByRole("region", { name: "Calendar invite approval" });
    await expect(calendarSection.getByText("Pending approval")).toBeVisible();

    await calendarSection.getByRole("button", { name: "Reject" }).click();
    await expect(page.getByTestId("calendar-result")).toHaveText("denied");
  });
});
