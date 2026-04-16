// Notifications page
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  ShoppingCart,
  Package,
  Trash2,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/toast";

interface Notification {
  notification_id: number;
  user_id: number | null;
  title: string;
  message: string;
  type: "warning" | "info" | "success";
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const typeIcons = {
  warning: AlertTriangle,
  info: Bell,
  success: CheckCheck,
};

const typeColors = {
  warning: "text-orange-500 bg-orange-500/10",
  info: "text-blue-500 bg-blue-500/10",
  success: "text-green-500 bg-green-500/10",
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: true }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Semua notifikasi ditandai sebagai sudah dibaca");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete notification");
      }
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ["notifications"] });
      toast.success("Notifikasi berhasil dihapus");
    },
    onError: (err: any) => {
      console.error("[UI DELETE ERROR]", err);
      toast.error(err.message || "Gagal menghapus notifikasi");
    },
  });

  const handleDeleteNotification = async (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus notifikasi ini?")) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        // Error sudah di-handle di onError
      }
    }
  };

  const filteredNotifications = notifications?.filter(
    (n: Notification) => filter === "all" || !n.is_read,
  );

  const unreadCount =
    notifications?.filter((n: Notification) => !n.is_read).length || 0;

  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return notificationDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <AppLayout pageTitle="Notifikasi">
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Notifikasi</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0
                ? `${unreadCount} notifikasi belum dibaca`
                : "Semua notifikasi sudah dibaca"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter(filter === "all" ? "unread" : "all")}
            >
              {filter === "all" ? "Belum Dibaca" : "Semua"}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4" />
                Tandai Semua Dibaca
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Daftar Notifikasi</CardTitle>
              <CardDescription>
                Riwayat notifikasi dan peringatan dari sistem
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredNotifications?.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">
                    {filter === "unread"
                      ? "Semua notifikasi sudah dibaca"
                      : "Belum ada notifikasi"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications?.map((notif: Notification) => {
                    const Icon = typeIcons[notif.type];
                    return (
                      <div
                        key={notif.notification_id}
                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                          !notif.is_read
                            ? "bg-accent/50 border-primary/20"
                            : "bg-card"
                        }`}
                      >
                        <div
                          className={`shrink-0 rounded-full p-2 ${typeColors[notif.type]}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{notif.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {notif.message}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notif.is_read && (
                                <Badge variant="default" className="text-xs">
                                  Baru
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatTime(notif.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              {!notif.is_read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() =>
                                    markAsReadMutation.mutate(
                                      notif.notification_id,
                                    )
                                  }
                                >
                                  <Check className="mr-1 h-3 w-3" />
                                  Tandai Dibaca
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() =>
                                  handleDeleteNotification(
                                    notif.notification_id,
                                  )
                                }
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
