import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Shield, User } from "lucide-react";
import loopyHappy from "@/assets/loopy-happy.png";
import { useAuthStore } from "@/lib/authStore";
import {
  changePassword as changePasswordAPI,
  getMe,
  updateMe,
} from "@/services/userService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  ACTIVE: "Active",
  PENDING: "Pending",
  LOCKED: "Locked",
  BANNED: "Banned",
};

const STATUS_BADGE_CLASS = {
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  LOCKED: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  BANNED: "bg-destructive/10 text-destructive",
};

function StatusBadge({ status }) {
  const normalized = String(status ?? "ACTIVE").toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        STATUS_BADGE_CLASS[normalized] ?? "bg-secondary text-secondary-foreground",
      )}
    >
      {STATUS_LABELS[normalized] ?? normalized}
    </span>
  );
}

export default function AdminProfile() {
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const result = await getMe();
    setLoading(false);

    if (!result.success) {
      toast.error(result.message || "Failed to load profile");
      return;
    }

    setProfile(result.data);
    setFullName(result.data.fullName || "");
    setUser(result.data);
  }, [setUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      toast.error("Full name is required");
      return;
    }

    setSavingProfile(true);
    const result = await updateMe({ fullName: trimmedName });
    setSavingProfile(false);

    if (result.success) {
      setProfile(result.data);
      setFullName(result.data.fullName || "");
      setUser(result.data);
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setChangingPassword(true);
    const result = await changePasswordAPI({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    setChangingPassword(false);

    if (result.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } else {
      toast.error(result.message || "Failed to change password");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
        Loading account…
      </div>
    );
  }

  const avatarSrc = profile?.avatarUrl || authUser?.avatarUrl || loopyHappy;
  const email = profile?.email || authUser?.email || "";
  const role = profile?.role || authUser?.role || "admin";
  const status = profile?.status || authUser?.status || "ACTIVE";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Account Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your admin account
        </p>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" strokeWidth={1.5} />
          Profile Information
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <img
            src={avatarSrc}
            alt={fullName || "Admin avatar"}
            className="h-20 w-20 rounded-full ring-2 ring-primary/20 object-cover"
          />
          <div className="space-y-2 min-w-0">
            <p className="font-semibold text-foreground truncate">
              {fullName || "Admin"}
            </p>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                <Shield className="h-3 w-3" />
                {role === "admin" ? "Admin" : role}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Full Name
            </label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="mt-1 w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Email
            </label>
            <input
              value={email}
              disabled
              className="mt-1 w-full h-10 rounded-xl bg-muted px-4 text-sm text-muted-foreground border border-border opacity-70 cursor-not-allowed"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform disabled:opacity-50 inline-flex items-center gap-2"
          >
            {savingProfile ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" strokeWidth={1.5} />
          Change Password
        </h2>

        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword}
            className="h-10 px-5 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating…
              </>
            ) : (
              "Change Password"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
