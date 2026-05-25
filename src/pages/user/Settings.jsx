import { useState, useEffect, useCallback } from "react";
import { User, Lock, Bell, Calendar } from "lucide-react";
import loopyHappy from "@/assets/loopy-happy.png";
import { useAuthStore } from "@/lib/authStore";
import {
  changePassword as changePasswordAPI,
  getMe,
  getPreferences,
  updateMe,
  updatePreferences,
} from "@/services/userService";
import {
  useBlockedSlotsQuery,
  useBlockedSlotsMutation,
} from "@/hooks/queries/user";
import { toast } from "sonner";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 24 }, (_, i) => i);

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [blockMode, setBlockMode] = useState("block");
  const [loading, setLoading] = useState(true);
  const {
    blockedSlots,
    isLoading: blockedSlotsLoading,
    refetch: refetchBlockedSlots,
  } = useBlockedSlotsQuery();
  const replaceBlockedSlotsMutation = useBlockedSlotsMutation();

  const [displayName, setDisplayName] = useState(user?.fullName || "");
  const [email, setEmail] = useState(user?.email || "");

  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [notificationSettings, setNotificationSettings] = useState({
    taskReminders: true,
    sessionReminders: true,
    deadlineAlerts: true,
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, prefsRes] = await Promise.all([
        getMe(),
        getPreferences(),
      ]);

      if (profileRes.success) {
        setDisplayName(profileRes.data.fullName || "");
        setEmail(profileRes.data.email || "");
        setUser(profileRes.data);
      } else {
        toast.error(profileRes.message);
      }

      if (prefsRes.success) {
        setNotificationSettings(
          prefsRes.data.notifications || {
            taskReminders: true,
            sessionReminders: true,
            deadlineAlerts: true,
          },
        );
      } else {
        toast.error(prefsRes.message);
      }

    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const isBlocked = (day, hour) =>
    blockedSlots.some((s) => s.day === day && s.hour === hour);

  const persistBlockedSlots = async (nextSlots) => {
    try {
      await replaceBlockedSlotsMutation.mutateAsync(nextSlots);
      return true;
    } catch (e) {
      toast.error(e.message || "Failed to update blocked slots");
      refetchBlockedSlots();
      return false;
    }
  };

  const handleSlotClick = async (day, hour) => {
    const blocked = isBlocked(day, hour);
    let nextSlots;

    if (blockMode === "block" && !blocked) {
      nextSlots = [...blockedSlots, { day, hour }];
    } else if (blockMode === "unblock" && blocked) {
      nextSlots = blockedSlots.filter(
        (s) => !(s.day === day && s.hour === hour),
      );
    } else {
      return;
    }

    const ok = await persistBlockedSlots(nextSlots);
    if (ok) {
      toast.success(blocked ? "Time unblocked" : "Time blocked successfully");
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    const result = await updateMe({ fullName: displayName.trim() });

    if (result.success) {
      setUser(result.data);
      setDisplayName(result.data.fullName || "");
      setEmail(result.data.email || "");
      toast.success("Profile updated!");
    } else {
      toast.error(result.message);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (oldPw === newPw) {
      toast.error("New password must be different from old password");
      return;
    }

    const result = await changePasswordAPI({
      currentPassword: oldPw,
      newPassword: newPw,
      confirmPassword: confirmPw,
    });

    if (result.success) {
      setOldPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed successfully!");
    } else {
      toast.error(result.message);
    }
  };

  const handleToggleNotification = async (key) => {
    const updated = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };

    const result = await updatePreferences({ notifications: { [key]: updated[key] } });

    if (result.success) {
      setNotificationSettings(result.data.notifications);
    } else {
      toast.error(result.message);
    }
  };

  if (loading || blockedSlotsLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-muted-foreground">
        Loading settings…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" strokeWidth={1.5} /> Profile
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <img
            src={loopyHappy}
            alt="Avatar"
            className="h-16 w-16 rounded-full ring-2 ring-secondary"
          />
          <div>
            <p className="font-medium text-foreground">
              {user?.fullName || displayName || "Study Beaver"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.email || email}
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Display Name
            </label>
            <input
              className="mt-1 w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest font-bold text-muted-foreground">
              Email
            </label>
            <input
              className="mt-1 w-full h-10 rounded-xl bg-muted px-4 text-sm text-muted-foreground border border-border opacity-70 cursor-not-allowed"
              value={email}
              disabled
            />
          </div>
          <button
            onClick={handleSaveProfile}
            className="h-10 px-5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:scale-[1.01] transition-transform"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" strokeWidth={1.5} /> Change
          Password
        </h2>
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="w-full h-10 rounded-xl bg-background px-4 text-sm text-foreground border border-border focus:ring-2 focus:ring-primary/20 outline-none"
          />
          <button
            onClick={handleChangePassword}
            className="h-10 px-5 rounded-full bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" strokeWidth={1.5} />{" "}
          Notifications
        </h2>
        <div className="space-y-3">
          <ToggleSwitch
            label="Study reminders"
            value={notificationSettings.taskReminders ?? true}
            onChange={() => handleToggleNotification("taskReminders")}
          />
          <ToggleSwitch
            label="Deadline alerts"
            value={notificationSettings.deadlineAlerts ?? true}
            onChange={() => handleToggleNotification("deadlineAlerts")}
          />
          <ToggleSwitch
            label="AI suggestions"
            value={notificationSettings.sessionReminders ?? true}
            onChange={() => handleToggleNotification("sessionReminders")}
          />
        </div>
      </div>

      {/* Weekly Availability Scheduler */}
      <div className="bg-card rounded-2xl p-5 shadow-soft">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" strokeWidth={1.5} /> Weekly
          Availability Scheduler
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          Block times when you're unavailable.
        </p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setBlockMode("block")}
            className={`h-8 px-4 rounded-full text-xs font-medium transition-colors ${blockMode === "block" ? "bg-destructive text-destructive-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Block Time
          </button>
          <button
            onClick={() => setBlockMode("unblock")}
            className={`h-8 px-4 rounded-full text-xs font-medium transition-colors ${blockMode === "unblock" ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}
          >
            Unblock Time
          </button>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[50px_repeat(7,1fr)] gap-px">
              <div />
              {days.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] uppercase tracking-widest font-bold text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
              {hours
                .filter((h) => h >= 6 && h <= 22)
                .map((hour) => (
                  <div key={hour} className="contents">
                    <div className="text-[10px] text-muted-foreground font-medium text-right pr-2 py-1">
                      {hour}:00
                    </div>
                    {days.map((day) => {
                      const blocked = isBlocked(day, hour);
                      return (
                        <button
                          key={`${day}-${hour}`}
                          type="button"
                          onClick={() => handleSlotClick(day, hour)}
                          className={`h-6 rounded-sm border transition-colors ${
                            blocked
                              ? "bg-destructive/20 border-destructive/30 hover:bg-destructive/30"
                              : "bg-background/60 border-border/30 hover:bg-secondary/40"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ label, value = true, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-foreground">{label}</span>
      <button
        type="button"
        onClick={() => {
          onChange();
        }}
        className={`relative w-10 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-secondary"}`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-primary-foreground shadow transition-transform ${value ? "translate-x-4 left-0.5" : "left-0.5 translate-x-0"}`}
        />
      </button>
    </label>
  );
}
