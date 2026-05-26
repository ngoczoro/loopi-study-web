import { useState } from "react";
import LockUserModal from "@/components/admin/LockUserModal";
import { Skeleton } from "@/components/skeleton";
import {
  useAdminResolveViolation,
  useAdminViolationStats,
  useAdminViolations,
} from "@/hooks/queries/adminViolations";
import { useAdminLockUser, useAdminUnlockUser } from "@/hooks/queries/adminUsers";
import { formatAdminUserDate } from "@/lib/adminUserUtils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Lock,
  Shield,
  Unlock,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alert-dialog";

const levelStyles = {
  low: "bg-accent/20 text-accent-foreground",
  medium: "bg-warning/20 text-foreground",
  high: "bg-destructive/10 text-destructive",
};

const levelLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const STAT_LEVELS = ["low", "medium", "high"];

function StatsCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl shadow-soft p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-7 w-10" />
      </div>
    </div>
  );
}

function UserSectionSkeleton() {
  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export default function AdminWarnings() {
  const { stats, isLoading: statsLoading, error: statsError } =
    useAdminViolationStats();
  const {
    flaggedUsers,
    isLoading: listLoading,
    error: listError,
  } = useAdminViolations();
  const resolveMutation = useAdminResolveViolation();
  const lockMutation = useAdminLockUser();
  const unlockMutation = useAdminUnlockUser();

  const [lockTargetUser, setLockTargetUser] = useState(null);
  const [unlockTargetUser, setUnlockTargetUser] = useState(null);

  const isPageLoading = statsLoading || listLoading;
  const resolvingId = resolveMutation.isPending ? resolveMutation.variables : null;
  const lockActionId =
    lockMutation.isPending && lockTargetUser ? lockTargetUser.userId : null;
  const unlockActionId = unlockMutation.isPending
    ? unlockMutation.variables
    : null;

  const statCounts = {
    low: stats?.lowRiskUsers ?? 0,
    medium: stats?.mediumRiskUsers ?? 0,
    high: stats?.highRiskUsers ?? 0,
  };

  const handleResolve = async (id) => {
    try {
      await resolveMutation.mutateAsync(id);
      toast.success("Violation resolved");
    } catch (error) {
      toast.error(error.message || "Failed to resolve violation");
    }
  };

  const handleConfirmLock = async (reason) => {
    if (!lockTargetUser) return;

    try {
      await lockMutation.mutateAsync({
        id: lockTargetUser.userId,
        reason,
      });
      toast.success("Account locked");
      setLockTargetUser(null);
    } catch (error) {
      toast.error(error.message || "Failed to lock account");
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockTargetUser) return;

    try {
      await unlockMutation.mutateAsync(unlockTargetUser.userId);
      toast.success("Account unlocked");
      setUnlockTargetUser(null);
    } catch (error) {
      toast.error(error.message || "Failed to unlock account");
    }
  };

  const mapUserForLockModal = (flaggedUser) => ({
    id: flaggedUser.userId,
    username: flaggedUser.userName,
    email: flaggedUser.userEmail,
    avatarUrl: null,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Violation Warnings
        </h1>

        <p className="text-sm text-muted-foreground">
          {statsLoading ? (
            "Loading violation summary…"
          ) : statsError ? (
            statsError
          ) : (
            <>
              {stats?.usersWithUnresolvedViolations ?? 0} users with unresolved
              violations
            </>
          )}
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsLoading
          ? STAT_LEVELS.map((level) => <StatsCardSkeleton key={level} />)
          : STAT_LEVELS.map((level) => {
              const count = statCounts[level];

              return (
                <motion.div
                  key={level}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl shadow-soft p-4 flex items-center gap-3"
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${levelStyles[level]}`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {level} risk
                    </p>
                    <p className="text-xl font-bold text-foreground">{count}</p>
                  </div>
                </motion.div>
              );
            })}
      </div>

      {listError && !listLoading ? (
        <div className="rounded-2xl bg-destructive/10 text-destructive text-sm p-4">
          {listError}
        </div>
      ) : null}

      {listLoading
        ? Array.from({ length: 2 }).map((_, index) => (
            <UserSectionSkeleton key={index} />
          ))
        : flaggedUsers.map((fu, idx) => (
            <motion.div
              key={fu.userId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-2xl shadow-soft overflow-hidden"
            >
              <div className="p-4 border-b border-border/50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {fu.userName}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${levelStyles[fu.riskLevel] ?? levelStyles.low}`}
                      >
                        {levelLabels[fu.riskLevel] ?? fu.riskLevel} risk
                      </span>

                      {fu.locked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive">
                          Locked
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted-foreground truncate">
                      {fu.userEmail} · {fu.totalCount} violations (
                      {fu.unresolvedCount} unresolved)
                    </p>
                  </div>
                </div>

                {fu.locked ? (
                  <AlertDialog
                    open={unlockTargetUser?.userId === fu.userId}
                    onOpenChange={(open) =>
                      setUnlockTargetUser(open ? fu : null)
                    }
                  >
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        disabled={Boolean(unlockActionId && unlockActionId !== fu.userId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-accent/20 text-accent-foreground disabled:opacity-50 shrink-0"
                      >
                        {unlockActionId === fu.userId ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unlock className="h-3 w-3" />
                        )}
                        Unlock
                      </button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unlock {fu.userName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Restore login access for this account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleConfirmUnlock}
                          disabled={unlockMutation.isPending}
                          className="rounded-full"
                        >
                          {unlockMutation.isPending ? "Unlocking…" : "Confirm"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLockTargetUser(fu)}
                    disabled={Boolean(lockActionId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Lock className="h-3 w-3" />
                    Lock Account
                  </button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Violation Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {fu.violations.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          {v.typeLabel || v.type}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {v.contentTitle || "—"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {formatAdminUserDate(v.detectedAt)}
                      </TableCell>

                      <TableCell className="capitalize">
                        {v.status === "resolved" ? "Resolved" : "Pending"}
                      </TableCell>

                      <TableCell className="text-right">
                        {v.status !== "resolved" && v.resolved !== true ? (
                          <button
                            type="button"
                            onClick={() => handleResolve(v.id)}
                            disabled={resolveMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-accent/20 disabled:opacity-50"
                          >
                            {resolvingId === v.id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Resolving…
                              </>
                            ) : (
                              "Resolve"
                            )}
                          </button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </motion.div>
          ))}

      {!isPageLoading && !listError && flaggedUsers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No violations detected</p>
        </div>
      ) : null}

      <LockUserModal
        open={Boolean(lockTargetUser)}
        onOpenChange={(open) => {
          if (!open) setLockTargetUser(null);
        }}
        user={lockTargetUser ? mapUserForLockModal(lockTargetUser) : null}
        onConfirm={handleConfirmLock}
        submitting={lockMutation.isPending && lockTargetUser?.userId === lockActionId}
      />
    </div>
  );
}
