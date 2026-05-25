"use client";

import { useAdminDemoStore } from "@/lib/adminDemoStore";
import { motion } from "framer-motion";
import { Lock, Unlock, Shield, User } from "lucide-react";
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

export default function AdminUsers() {
  const { users, toggleLockUser } = useAdminDemoStore();
  
  // Lọc danh sách student
  const students = users.filter((u) => u.role === "student");

  const handleToggleLock = (id, currentlyLocked) => {
    toggleLockUser(id);
    toast.success(currentlyLocked ? "Account unlocked ✅" : "Account locked 🔒");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">{students.length} student accounts</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-soft overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" strokeWidth={1.5} />
                    </div>
                    <span className="font-medium text-foreground">{u.username}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{u.createdAt}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    u.locked 
                      ? "bg-destructive/10 text-destructive" 
                      : "bg-accent/20 text-accent-foreground"
                  }`}>
                    {u.locked ? <Lock className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {u.locked ? "Locked" : "Active"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        u.locked 
                          ? "bg-accent/20 text-accent-foreground hover:bg-accent/30" 
                          : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      }`}>
                        {u.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                        {u.locked ? "Unlock" : "Lock"}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{u.locked ? "Unlock" : "Lock"} {u.username}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {u.locked
                            ? "This student will regain access to the platform."
                            : "This student will be prevented from logging in."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleToggleLock(u.id, u.locked)}
                          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
}