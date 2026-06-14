"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddContactModalProps {
  open: boolean;
  email: string;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  onDismiss: () => void;
  onNeverAsk: () => void;
}

export function AddContactModal({
  open,
  email,
  onOpenChange,
  onAdd,
  onDismiss,
  onNeverAsk,
}: AddContactModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="type-tagline text-ink">Add to contacts?</DialogTitle>
        </DialogHeader>
        <p className="type-caption text-ink-muted-48">
          <span className="font-mono text-ink">{email}</span> is not in your app contacts.
          Contacts stay in Command Inbox only — Google Contacts is not modified.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onAdd}>Add contact</Button>
          <Button variant="outline" onClick={onDismiss}>
            Not now
          </Button>
          <button
            type="button"
            onClick={onNeverAsk}
            className="type-caption text-ink-muted-48 hover:text-ink"
          >
            Don&apos;t ask for this address
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
