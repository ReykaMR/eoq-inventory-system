// Profile page
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Pencil,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  staff_pembelian: "Staff Pembelian",
  staff_gudang: "Staff Gudang",
};

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: session?.user?.name || "",
    email: session?.user?.email || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update profile");
      }

      await update();
      setMessage("Profil berhasil diperbarui");
      setIsEditing(false);
    } catch (err: any) {
      setMessage(err.message || "Gagal memperbarui profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Belum pernah login";
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!session) {
    return null;
  }

  return (
    <AppLayout pageTitle="Profil Saya">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Profil Saya</h1>
          <p className="text-muted-foreground mt-1">
            Lihat dan edit informasi profil Anda
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Informasi Profil</CardTitle>
                  <CardDescription>
                    Data pribadi akun Anda
                  </CardDescription>
                </div>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div
                  className={`p-3 text-sm rounded-md ${
                    message.includes("Gagal")
                      ? "bg-destructive/10 text-destructive"
                      : "bg-green-500/10 text-green-600"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    disabled={!isEditing || isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    disabled={!isEditing || isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Username</Label>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Input value={session.user?.username || ""} disabled />
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Simpan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: session.user?.name || "",
                        email: session.user?.email || "",
                      });
                      setMessage("");
                    }}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Akun</CardTitle>
              <CardDescription>Informasi akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline">
                    {roleLabels[session.user?.role || ""] || session.user?.role}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {session.user?.isActive ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Aktif</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Nonaktif</span>
                    </>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Terakhir Login</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDate(session.user?.lastLogin)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
