"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Download, Loader2, Search, Users } from "lucide-react";
import { ContactsImportForm } from "@/components/contacts/contacts-import-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  addContactApi,
  disconnectGoogleContactsApi,
  dismissContactApi,
  fetchAppContactsListApi,
  fetchGoogleContactsStatusApi,
  syncGoogleContactsApi,
} from "@/lib/inbox/client-api";
import { inboxQueryKeys } from "@/lib/inbox/query-keys";

const PAGE_SIZE = 20;
const GOOGLE_RETURN_TO = encodeURIComponent("/inbox?openSettings=contacts&googleContacts=connected");

interface ContactsSettingsProps {
  googleContactsReturn?: string | null;
}

export function ContactsSettings({ googleContactsReturn }: ContactsSettingsProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [addingManual, setAddingManual] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const invalidateContacts = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: inboxQueryKeys.contacts() }),
      queryClient.invalidateQueries({ queryKey: inboxQueryKeys.googleContacts() }),
      queryClient.invalidateQueries({ queryKey: ["inbox", "contacts", "app"] }),
    ]);
  }, [queryClient]);

  const { data: googleStatus, refetch: refetchGoogle } = useQuery({
    queryKey: inboxQueryKeys.googleContacts(),
    queryFn: () => fetchGoogleContactsStatusApi(),
    staleTime: 30_000,
  });

  const { data: listData, isLoading: listLoading, refetch: refetchList } = useQuery({
    queryKey: inboxQueryKeys.appContactsList(page, PAGE_SIZE, debouncedSearch),
    queryFn: () =>
      fetchAppContactsListApi({ page, pageSize: PAGE_SIZE, q: debouncedSearch || undefined }),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (googleContactsReturn === "connected") {
      setImportNotice("Google Contacts connected and imported.");
      void invalidateContacts();
    } else if (googleContactsReturn === "error") {
      setImportError("Google Contacts import failed. Try again.");
    }
  }, [googleContactsReturn, invalidateContacts]);

  const totalPages = listData ? Math.max(1, Math.ceil(listData.total / PAGE_SIZE)) : 1;

  const handleImportSuccess = async (result: { imported: number; kind: string }) => {
    setImportError(null);
    setImportNotice(`Imported ${result.imported} contact${result.imported === 1 ? "" : "s"}.`);
    await invalidateContacts();
    void refetchList();
  };

  const handleManualAdd = async () => {
    const email = manualEmail.trim();
    if (!email) return;
    setAddingManual(true);
    setImportError(null);
    try {
      await addContactApi({
        email,
        displayName: manualName.trim() || undefined,
      });
      setManualEmail("");
      setManualName("");
      setImportNotice("Contact added.");
      await invalidateContacts();
      void refetchList();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not add contact");
    } finally {
      setAddingManual(false);
    }
  };

  const handleRemove = async (email: string) => {
    setRemovingEmail(email);
    setImportError(null);
    try {
      await dismissContactApi(email);
      setImportNotice(`Removed ${email}.`);
      await invalidateContacts();
      void refetchList();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not remove contact");
    } finally {
      setRemovingEmail(null);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setImportError(null);
    try {
      const result = await syncGoogleContactsApi();
      setImportNotice(
        `Synced ${result.imported} new contact${result.imported === 1 ? "" : "s"} (${result.total} total in Google).`
      );
      await invalidateContacts();
      void refetchGoogle();
      void refetchList();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async (removeImported: boolean) => {
    setDisconnecting(true);
    setImportError(null);
    try {
      const result = await disconnectGoogleContactsApi(removeImported);
      setDisconnectOpen(false);
      setImportNotice(
        removeImported
          ? `Disconnected Google Contacts and removed ${result.removedContacts} imported contact${result.removedContacts === 1 ? "" : "s"}.`
          : "Disconnected Google Contacts. Previously imported contacts were kept."
      );
      await invalidateContacts();
      void refetchGoogle();
      void refetchList();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Disconnect failed");
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <section className="border-t border-hairline pt-6">
      <h3 className="text-sm font-semibold">Contacts</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        App contacts only — stored in Command Inbox, never written back to Google Contacts.
      </p>

      {importError ? (
        <p className="mt-2 text-xs text-[color:var(--color-destructive)]">{importError}</p>
      ) : null}
      {importNotice ? <p className="mt-2 text-xs text-muted-foreground">{importNotice}</p> : null}

      <div className="mt-4 rounded-md border border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" strokeWidth={1.75} />
            <p className="text-sm font-medium">Google Contacts</p>
          </div>
          {googleStatus?.connected ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Connected
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Not connected</span>
          )}
        </div>

        {googleStatus?.connected ? (
          <>
            <p className="mt-2 text-xs text-muted-foreground">
              Last synced{" "}
              {googleStatus.lastSyncedAt
                ? formatDistanceToNow(new Date(googleStatus.lastSyncedAt), { addSuffix: true })
                : "never"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={syncing} onClick={() => void handleSync()}>
                {syncing ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Syncing…
                  </>
                ) : (
                  "Sync now"
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={disconnecting}
                onClick={() => setDisconnectOpen(true)}
              >
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <Button
            size="sm"
            className="mt-3"
            onClick={() => {
              window.location.href = `/api/connect/google-contacts?returnTo=${GOOGLE_RETURN_TO}`;
            }}
          >
            Connect Google Contacts
          </Button>
        )}
      </div>

      <div className="mt-4 rounded-md border border-border p-3">
        <p className="text-sm font-medium">Add one contact</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Input
            type="email"
            placeholder="email@example.com"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            autoComplete="off"
          />
          <Input
            placeholder="Display name (optional)"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <Button
          size="sm"
          className="mt-2"
          disabled={!manualEmail.trim() || addingManual}
          onClick={() => void handleManualAdd()}
        >
          {addingManual ? "Adding…" : "Add contact"}
        </Button>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium">Import contacts</p>
        <ContactsImportForm
          googleConnectHref={`/api/connect/google-contacts?returnTo=${GOOGLE_RETURN_TO}`}
          hideGoogleConnect={Boolean(googleStatus?.connected)}
          showDemo
          onSuccess={(result) => void handleImportSuccess(result)}
          onError={(message) => {
            setImportNotice(null);
            setImportError(message);
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Your contacts{listData ? ` (${listData.total})` : ""}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            window.location.href = "/api/inbox/contacts/export";
          }}
        >
          <Download className="mr-1 h-3 w-3" strokeWidth={1.75} />
          Export CSV
        </Button>
      </div>

      <div className="relative mt-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-3 max-h-56 overflow-y-auto rounded-md border border-border">
        {listLoading ? (
          <p className="p-3 text-xs text-muted-foreground">Loading contacts…</p>
        ) : listData && listData.contacts.length > 0 ? (
          <ul className="divide-y divide-border">
            {listData.contacts.map((contact) => (
              <li key={contact.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {contact.displayName || contact.email.split("@")[0]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{contact.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {contact.source}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    disabled={removingEmail === contact.email}
                    onClick={() => void handleRemove(contact.email)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-3 text-xs text-muted-foreground">No contacts yet.</p>
        )}
      </div>

      {listData && listData.total > PAGE_SIZE ? (
        <div className="mt-2 flex items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <Dialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="type-tagline text-ink">Disconnect Google Contacts?</DialogTitle>
          </DialogHeader>
          <p className="type-caption text-ink-muted-48">
            Choose whether to keep contacts already imported from Google.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="outline"
              disabled={disconnecting}
              onClick={() => void handleDisconnect(false)}
            >
              Disconnect only
            </Button>
            <Button
              variant="destructive"
              disabled={disconnecting}
              onClick={() => void handleDisconnect(true)}
            >
              Disconnect &amp; remove Google contacts
            </Button>
            <Button variant="ghost" disabled={disconnecting} onClick={() => setDisconnectOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
