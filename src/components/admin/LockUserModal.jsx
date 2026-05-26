"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";
import { DEFAULT_LOCK_REASON, LOCK_REASON_MAX_LENGTH } from "@/lib/adminUserUtils";

export default function LockUserModal({
  open,
  onOpenChange,
  user,
  onConfirm,
  submitting = false,
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
    }
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (submitting) return;
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    if (submitting || !user) return;
    onConfirm(reason.trim());
  };

  const remaining = LOCK_REASON_MAX_LENGTH - reason.length;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="rounded-2xl max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Lock User Account</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to block this account. The user will be prevented from
            logging in and will receive an email notification.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {user ? (
            <div className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-primary" strokeWidth={1.5} />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">
                  {user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email || "—"}
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="lock-reason"
              className="text-sm font-medium text-foreground"
            >
              Reason (optional)
            </label>
            <textarea
              id="lock-reason"
              value={reason}
              onChange={(e) =>
                setReason(e.target.value.slice(0, LOCK_REASON_MAX_LENGTH))
              }
              disabled={submitting}
              rows={4}
              placeholder="Describe why this account is being locked…"
              className="w-full rounded-xl bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[96px] disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              If left empty, the system will use: &quot;{DEFAULT_LOCK_REASON}
              &quot;
            </p>
            <p className="text-xs text-muted-foreground text-right">
              {remaining} characters remaining
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={submitting}
            className="rounded-full"
          >
            Cancel
          </AlertDialogCancel>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !user}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-full text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Locking…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Lock Account
              </>
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
