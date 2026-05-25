import { useAdminDemoStore } from "@/lib/adminDemoStore";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Lock,
  Unlock,
  User,
  FileText,
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

function getWarningLevel(count) {
  if (count >= 3) return "high";
  if (count >= 2) return "medium";
  return "low";
}

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

const violationTypeLabels = {
  spam: "Spam content",
  inappropriate: "Inappropriate language",
  irrelevant: "Irrelevant content",
};

export default function AdminWarnings() {
  const { violations, users, toggleLockUser, resolveViolation } =
    useAdminDemoStore();

  const userViolations = violations.reduce((acc, v) => {
    if (!acc[v.userId]) acc[v.userId] = [];
    acc[v.userId].push(v);
    return acc;
  }, {});

  const flaggedUsers = Object.entries(userViolations)
    .map(([userId, viols]) => {
      const user = users.find((u) => u.id === userId);
      const unresolvedCount = viols.filter((v) => !v.resolved).length;

      return {
        userId,
        userName: viols[0].userName,
        userEmail: viols[0].userEmail,
        violations: viols,
        totalCount: viols.length,
        unresolvedCount,
        level: getWarningLevel(unresolvedCount),
        locked: user?.locked ?? false,
      };
    })
    .sort((a, b) => b.unresolvedCount - a.unresolvedCount);

  const handleLock = (id, currentlyLocked) => {
    toggleLockUser(id);
    toast.success(currentlyLocked ? "Account unlocked" : "Account locked");
  };

  const handleResolve = (id) => {
    resolveViolation(id);
    toast.success("Violation resolved");
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          Violation Warnings
        </h1>

        <p className="text-sm text-muted-foreground">
          {flaggedUsers.filter((f) => f.unresolvedCount > 0).length} users with
          unresolved violations
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["low", "medium", "high"].map((level) => {
          const count = flaggedUsers.filter(
            (f) => f.level === level && f.unresolvedCount > 0,
          ).length;

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

      {/* USERS */}
      {flaggedUsers.map((fu, idx) => (
        <motion.div
          key={fu.userId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-card rounded-2xl shadow-soft overflow-hidden"
        >
          {/* HEADER USER */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {fu.userName}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${levelStyles[fu.level]}`}
                  >
                    {levelLabels[fu.level]} risk
                  </span>

                  {fu.locked && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/10 text-destructive">
                      Locked
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {fu.userEmail} · {fu.totalCount} violations (
                  {fu.unresolvedCount} unresolved)
                </p>
              </div>
            </div>

            {/* LOCK BUTTON */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    fu.locked
                      ? "bg-accent/20 text-accent-foreground"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {fu.locked ? (
                    <Unlock className="h-3 w-3" />
                  ) : (
                    <Lock className="h-3 w-3" />
                  )}
                  {fu.locked ? "Unlock" : "Lock Account"}
                </button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {fu.locked ? "Unlock" : "Lock"} {fu.userName}?
                  </AlertDialogTitle>

                  <AlertDialogDescription>
                    {fu.locked ? "Restore access" : "Prevent login"}
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>

                  <AlertDialogAction
                    onClick={() => handleLock(fu.userId, fu.locked)}
                  >
                    Confirm
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* TABLE */}
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
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                      {violationTypeLabels[v.type]}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      {v.contentTitle}
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {v.detectedAt}
                  </TableCell>

                  <TableCell>{v.resolved ? "Resolved" : "Pending"}</TableCell>

                  <TableCell className="text-right">
                    {!v.resolved && (
                      <button
                        onClick={() => handleResolve(v.id)}
                        className="px-3 py-1.5 rounded-full text-xs bg-accent/20"
                      >
                        Resolve
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      ))}

      {/* EMPTY */}
      {flaggedUsers.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No violations detected</p>
        </div>
      )}
    </div>
  );
}
