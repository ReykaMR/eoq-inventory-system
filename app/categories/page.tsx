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
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast";

interface Category {
  category_id: number;
  category_code: string;
  category_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    category_code: "",
    category_name: "",
    description: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
      resetForm();
      toast.success("Kategori berhasil ditambahkan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menambahkan Kategori");
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
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
      setEditingCategory(null);
      resetForm();
      toast.success("Kategori berhasil diperbarui");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui Kategori");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete category");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori berhasil dihapus");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus Kategori");
    },
  });

  const resetForm = () => {
    setFormData({
      category_code: "",
      category_name: "",
      description: "",
      is_active: true,
    });
    setError("");
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      category_code: category.category_code,
      category_name: category.category_name,
      description: category.description || "",
      is_active: category.is_active,
    });
    setOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (
      window.confirm(`Apakah Anda yakin ingin menghapus Kategori "${name}"?`)
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.category_id,
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
      setEditingCategory(null);
      resetForm();
    }
  };

  if (!session) {
    return null;
  }

  return (
    <AppLayout pageTitle="Manajemen Kategori">
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Manajemen Kategori
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola kategori produk untuk sistem EOQ
            </p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Tambah Kategori
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory
                      ? "Perbarui informasi kategori"
                      : "Isi informasi kategori baru"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="category_code">Kode Kategori</Label>
                    <Input
                      id="category_code"
                      value={formData.category_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_code: e.target.value,
                        })
                      }
                      placeholder="Contoh: RAW, FINISH"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category_name">Nama Kategori</Label>
                    <Input
                      id="category_name"
                      value={formData.category_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category_name: e.target.value,
                        })
                      }
                      placeholder="Contoh: Bahan Pabrik"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Deskripsi kategori (opsional)"
                      disabled={isSubmitting}
                    />
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
                    {editingCategory ? "Perbarui" : "Simpan"}
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
            data={categories || []}
            searchKeys={["category_code", "category_name", "description"]}
            emptyMessage='Belum ada kategori. Klik "Tambah Kategori" untuk menambahkan.'
            columns={[
              {
                key: "category_code",
                header: "Kode",
                cell: (cat: any) => (
                  <span className="font-medium">{cat.category_code}</span>
                ),
              },
              {
                key: "category_name",
                header: "Nama",
              },
              {
                key: "description",
                header: "Deskripsi",
                className: "hidden sm:table-cell",
                cell: (cat: any) => cat.description || "-",
              },
              {
                key: "is_active",
                header: "Status",
                className: "hidden sm:table-cell",
                cell: (cat: any) => (
                  <Badge
                    variant={cat.is_active ? "default" : "secondary"}
                    className="gap-1"
                  >
                    {cat.is_active ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {cat.is_active ? "Aktif" : "Nonaktif"}
                  </Badge>
                ),
              },
              {
                key: "actions",
                header: "Aksi",
                cell: (cat: any) => (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(cat)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleDelete(cat.category_id, cat.category_name)
                      }
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
