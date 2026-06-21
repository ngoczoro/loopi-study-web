"use client";



import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { motion } from "framer-motion";

import {

  ChevronLeft,

  ChevronRight,

  Loader2,

  Lock,

  Search,

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

import LockUserModal from "@/components/admin/LockUserModal";

import { Skeleton } from "@/components/skeleton";

import { cn } from "@/lib/utils";

import {

  getAdminUsers,

  lockAdminUser,

  unlockAdminUser,

} from "@/services/adminUserService";

import {

  getStatusBadgeLabel,

  mapAdminUserListForUI,

} from "@/lib/adminUserUtils";



const PAGE_SIZE = 10;

const SCROLL_USER_THRESHOLD = 6;

const USER_LIST_MAX_HEIGHT = "max-h-[min(600px,70vh)]";

const STATUS_FILTERS = [

  { key: "ALL", label: "All" },

  { key: "ACTIVE", label: "Active" },

  { key: "LOCKED", label: "Locked" },

];



const defaultPagination = {

  page: 1,

  limit: PAGE_SIZE,

  total: 0,

  totalPages: 0,

};



export default function AdminUsers() {
  const [searchParams] = useSearchParams();

  const [users, setUsers] = useState([]);

  const [pagination, setPagination] = useState(defaultPagination);

  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [actionUserId, setActionUserId] = useState(null);

  const [lockTargetUser, setLockTargetUser] = useState(null);



  useEffect(() => {

    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);

    return () => clearTimeout(timer);

  }, [search]);

  useEffect(() => {
    const initialSearch = searchParams.get("search");
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [searchParams]);



  useEffect(() => {

    setPage(1);

  }, [debouncedSearch, statusFilter]);



  const loadUsers = useCallback(async () => {

    setLoading(true);

    setError(null);



    const params = { page, limit: PAGE_SIZE };

    if (debouncedSearch) params.search = debouncedSearch;

    if (statusFilter !== "ALL") params.status = statusFilter;



    const result = await getAdminUsers(params);

    setLoading(false);



    if (result.success) {

      setUsers(mapAdminUserListForUI(result.users));

      setPagination(result.pagination ?? { ...defaultPagination, page });

      return;

    }



    setError(result.message || "Failed to load users");

    setUsers([]);

  }, [page, debouncedSearch, statusFilter]);



  useEffect(() => {

    loadUsers();

  }, [loadUsers]);



  const handleConfirmLock = async (reason) => {

    if (!lockTargetUser || actionUserId) return;



    setActionUserId(lockTargetUser.id);

    try {

      const result = await lockAdminUser(lockTargetUser.id, { reason });



      if (result.success) {

        toast.success("Account locked 🔒");

        setLockTargetUser(null);

        await loadUsers();

        return;

      }



      toast.error(result.message || "Failed to lock account");

    } finally {

      setActionUserId(null);

    }

  };



  const handleUnlock = async (user) => {

    if (actionUserId) return;



    setActionUserId(user.id);

    try {

      const result = await unlockAdminUser(user.id);



      if (result.success) {

        toast.success("Account unlocked ✅");

        await loadUsers();

        return;

      }



      toast.error(result.message || "Failed to unlock account");

    } finally {

      setActionUserId(null);

    }

  };



  const canGoPrev = page > 1;

  const canGoNext = pagination.totalPages > 0 && page < pagination.totalPages;

  const shouldScrollList =

    !loading && !error && users.length > SCROLL_USER_THRESHOLD;

  const isLockSubmitting =

    Boolean(lockTargetUser) && actionUserId === lockTargetUser?.id;



  return (

    <div className="space-y-6">

      <LockUserModal

        open={Boolean(lockTargetUser)}

        onOpenChange={(open) => {

          if (!open && !isLockSubmitting) {

            setLockTargetUser(null);

          }

        }}

        user={lockTargetUser}

        onConfirm={handleConfirmLock}

        submitting={isLockSubmitting}

      />



      <div>

        <h1 className="text-2xl font-display font-bold text-foreground">

          User Management

        </h1>

        <p className="text-sm text-muted-foreground">

          {loading ? "Loading…" : `${pagination.total} student accounts`}

        </p>

      </div>



      <div className="flex flex-col sm:flex-row gap-3">

        <div className="relative flex-1">

          <Search

            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"

            strokeWidth={1.5}

          />

          <input

            type="text"

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            placeholder="Search by name or email…"

            className="w-full h-10 rounded-xl bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none focus:ring-2 focus:ring-primary/20"

          />

        </div>

        <div className="flex bg-secondary/50 rounded-xl p-1 gap-1">

          {STATUS_FILTERS.map((filter) => (

            <button

              key={filter.key}

              type="button"

              onClick={() => setStatusFilter(filter.key)}

              className={`h-9 px-4 rounded-lg text-xs font-medium transition-all ${

                statusFilter === filter.key

                  ? "bg-primary text-primary-foreground shadow-soft"

                  : "text-muted-foreground hover:text-foreground"

              }`}

            >

              {filter.label}

            </button>

          ))}

        </div>

      </div>



      <motion.div

        initial={{ opacity: 0, y: 10 }}

        animate={{ opacity: 1, y: 0 }}

        className="bg-card rounded-2xl shadow-soft overflow-hidden"

      >

        {error ? (

          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">

            <p className="text-sm text-destructive mb-3">{error}</p>

            <button

              type="button"

              onClick={loadUsers}

              className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-primary-foreground text-sm font-medium"

            >

              Retry

            </button>

          </div>

        ) : (

          <>

            <div

              className={cn(

                "overflow-x-auto min-h-0",

                shouldScrollList &&

                  "overflow-y-auto overscroll-y-contain scroll-smooth widget-scroll-area",

                shouldScrollList && USER_LIST_MAX_HEIGHT,

              )}

            >

              <Table>

                <TableHeader className="sticky top-0 z-10 bg-card">

                  <TableRow>

                    <TableHead className="bg-card">User</TableHead>

                    <TableHead className="bg-card">Email</TableHead>

                    <TableHead className="bg-card">Joined</TableHead>

                    <TableHead className="bg-card">Status</TableHead>

                    <TableHead className="text-right bg-card">Action</TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {loading ? (

                    Array.from({ length: 5 }).map((_, i) => (

                      <TableRow key={i}>

                        <TableCell colSpan={5}>

                          <Skeleton className="h-10 w-full rounded-lg" />

                        </TableCell>

                      </TableRow>

                    ))

                  ) : users.length === 0 ? (

                    <TableRow>

                      <TableCell

                        colSpan={5}

                        className="text-center py-10 text-sm text-muted-foreground"

                      >

                        No users found.

                      </TableCell>

                    </TableRow>

                  ) : (

                    users.map((u) => {

                      const isLocked = u.locked;

                      const badgeLabel = getStatusBadgeLabel(u);

                      const isBusy = actionUserId === u.id;



                      return (

                        <TableRow key={u.id}>

                          <TableCell>

                            <div className="flex items-center gap-2">

                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">

                                {u.avatarUrl ? (

                                  <img

                                    src={u.avatarUrl}

                                    alt=""

                                    className="h-full w-full object-cover"

                                  />

                                ) : (

                                  <User

                                    className="h-4 w-4 text-primary"

                                    strokeWidth={1.5}

                                  />

                                )}

                              </div>

                              <span className="font-medium text-foreground">

                                {u.username}

                              </span>

                            </div>

                          </TableCell>

                          <TableCell className="text-muted-foreground">

                            {u.email || "—"}

                          </TableCell>

                          <TableCell className="text-muted-foreground">

                            {u.createdAt}

                          </TableCell>

                          <TableCell>

                            <span

                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${

                                isLocked

                                  ? "bg-destructive/10 text-destructive"

                                  : "bg-accent/20 text-accent-foreground"

                              }`}

                            >

                              {isLocked ? (

                                <Lock className="h-3 w-3" />

                              ) : (

                                <Shield className="h-3 w-3" />

                              )}

                              {badgeLabel}

                            </span>

                          </TableCell>

                          <TableCell className="text-right">

                            {isLocked ? (

                              <AlertDialog>

                                <AlertDialogTrigger asChild>

                                  <button

                                    type="button"

                                    disabled={Boolean(actionUserId)}

                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 bg-accent/20 text-accent-foreground hover:bg-accent/30"

                                  >

                                    {isBusy ? (

                                      <Loader2 className="h-3 w-3 animate-spin" />

                                    ) : (

                                      <Unlock className="h-3 w-3" />

                                    )}

                                    Unlock

                                  </button>

                                </AlertDialogTrigger>

                                <AlertDialogContent className="rounded-2xl">

                                  <AlertDialogHeader>

                                    <AlertDialogTitle>

                                      Unlock {u.username}?

                                    </AlertDialogTitle>

                                    <AlertDialogDescription>

                                      This student will regain access to the

                                      platform and receive a reactivation email.

                                    </AlertDialogDescription>

                                  </AlertDialogHeader>

                                  <AlertDialogFooter>

                                    <AlertDialogCancel className="rounded-full">

                                      Cancel

                                    </AlertDialogCancel>

                                    <AlertDialogAction

                                      onClick={() => handleUnlock(u)}

                                      disabled={isBusy}

                                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"

                                    >

                                      {isBusy ? "Processing…" : "Confirm"}

                                    </AlertDialogAction>

                                  </AlertDialogFooter>

                                </AlertDialogContent>

                              </AlertDialog>

                            ) : (

                              <button

                                type="button"

                                onClick={() => setLockTargetUser(u)}

                                disabled={Boolean(actionUserId)}

                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 bg-destructive/10 text-destructive hover:bg-destructive/20"

                              >

                                <Lock className="h-3 w-3" />

                                Lock

                              </button>

                            )}

                          </TableCell>

                        </TableRow>

                      );

                    })

                  )}

                </TableBody>

              </Table>

            </div>



            {!loading && pagination.totalPages > 1 ? (

              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/50">

                <p className="text-xs text-muted-foreground">

                  Page {page} of {pagination.totalPages}

                </p>

                <div className="flex items-center gap-2">

                  <button

                    type="button"

                    onClick={() => setPage((p) => Math.max(1, p - 1))}

                    disabled={!canGoPrev || loading}

                    className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-secondary text-secondary-foreground disabled:opacity-50"

                  >

                    <ChevronLeft className="h-3.5 w-3.5" />

                    Previous

                  </button>

                  <button

                    type="button"

                    onClick={() => setPage((p) => p + 1)}

                    disabled={!canGoNext || loading}

                    className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium bg-secondary text-secondary-foreground disabled:opacity-50"

                  >

                    Next

                    <ChevronRight className="h-3.5 w-3.5" />

                  </button>

                </div>

              </div>

            ) : null}

          </>

        )}

      </motion.div>

    </div>

  );

}

