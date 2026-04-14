"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast";

interface User {
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff_pembelian", label: "Staff Pembelian" },
  { value: "staff_gudang", label: "Staff Gudang" },
];

export default function UsersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
    role: "staff_gudang",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      resetForm();
      toast.success("User berhasil ditambahkan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menambahkan User");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<typeof formData>;
    }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setEditingUser(null);
      resetForm();
      toast.success("User berhasil diperbarui");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui User");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User berhasil dihapus");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus User");
    },
  });

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      full_name: "",
      email: "",
      role: "staff_gudang",
      is_active: true,
    });
    setError("");
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "",
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
    });
    setOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus User "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.user_id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setEditingUser(null);
      resetForm();
    }
  };

  const formatRole = (role: string) => {
    return roleOptions.find((r) => r.value === role)?.label || role;
  };

  if (!session) {
    return null;
  }

  return (
    <AppLayout pageTitle="Manajemen User">
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Manajemen User
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola user yang dapat mengakses sistem
            </p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Tambah User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-125">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "Edit User" : "Tambah User Baru"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser
                      ? "Perbarui informasi user"
                      : "Isi informasi user baru"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Username untuk login"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {!editingUser && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          })
                        }
                        placeholder="Minimum 6 karakter"
                        required={!editingUser}
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nama Lengkap</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          full_name: e.target.value,
                        })
                      }
                      placeholder="Nama lengkap user"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@example.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData({ ...formData, role: value })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      disabled={isSubmitting}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {editingUser ? "Perbarui" : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={users || []}
            searchKeys={["username", "full_name", "email", "role"]}
            emptyMessage='Belum ada user. Klik "Tambah User" untuk menambahkan.'
            columns={[
              {
                key: "username",
                header: "Username",
                cell: (u: any) => (
                  <span className="font-medium">{u.username}</span>
                ),
              },
              { key: "full_name", header: "Nama Lengkap" },
              {
                key: "email",
                header: "Email",
                className: "hidden sm:table-cell",
              },
              {
                key: "role",
                header: "Role",
                cell: (u: any) => (
                  <Badge variant="outline">{formatRole(u.role)}</Badge>
                ),
              },
              {
                key: "last_login",
                header: "Terakhir Login",
                className: "hidden lg:table-cell",
                cell: (u: any) =>
                  u.last_login
                    ? new Date(u.last_login).toLocaleString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Belum pernah",
              },
              {
                key: "is_active",
                header: "Status",
                className: "hidden md:table-cell",
                cell: (u: any) => (
                  <Badge variant={u.is_active ? "default" : "secondary"}>
                    {u.is_active ? (
                      <>
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Aktif
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-1 h-3 w-3" />
                        Nonaktif
                      </>
                    )}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Aksi",
                cell: (u: any) => (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(u.user_id, u.full_name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </AppLayout>
  );
}
