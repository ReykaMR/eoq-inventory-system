"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Package,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast";

export default function ProductsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    product_code: "",
    product_name: "",
    description: "",
    category_id: "",
    unit_id: "",
    purchase_price: "0",
    selling_price: "0",
    min_stock: "0",
    max_stock: "0",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
  });

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const res = await fetch("/api/units");
      if (!res.ok) throw new Error("Failed to fetch units");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          category_id: parseInt(data.category_id),
          unit_id: parseInt(data.unit_id),
          purchase_price: parseFloat(data.purchase_price),
          selling_price: parseFloat(data.selling_price),
          min_stock: parseFloat(data.min_stock),
          max_stock: parseFloat(data.max_stock),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      resetForm();
      toast.success("Produk berhasil ditambahkan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menambahkan Produk");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id
            ? parseInt(data.category_id)
            : undefined,
          unit_id: data.unit_id ? parseInt(data.unit_id) : undefined,
          purchase_price: data.purchase_price
            ? parseFloat(data.purchase_price)
            : undefined,
          selling_price: data.selling_price
            ? parseFloat(data.selling_price)
            : undefined,
          min_stock: data.min_stock ? parseFloat(data.min_stock) : undefined,
          max_stock: data.max_stock ? parseFloat(data.max_stock) : undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditingProduct(null);
      resetForm();
      toast.success("Produk berhasil diperbarui");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal memperbarui Produk");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete product");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produk berhasil dihapus");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menghapus Produk");
    },
  });

  const resetForm = () => {
    setFormData({
      product_code: "",
      product_name: "",
      description: "",
      category_id: "",
      unit_id: "",
      purchase_price: "0",
      selling_price: "0",
      min_stock: "0",
      max_stock: "0",
      is_active: true,
    });
    setError("");
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      product_code: product.product_code,
      product_name: product.product_name,
      description: product.description || "",
      category_id: product.category_id.toString(),
      unit_id: product.unit_id.toString(),
      purchase_price: product.purchase_price.toString(),
      selling_price: product.selling_price?.toString() || "0",
      min_stock: product.min_stock.toString(),
      max_stock: product.max_stock?.toString() || "0",
      is_active: product.is_active,
    });
    setOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus Produk "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.product_id,
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
      setEditingProduct(null);
      resetForm();
    }
  };

  if (!session) {
    return null;
  }

  return (
    <AppLayout pageTitle="Manajemen Produk">
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Manajemen Produk
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola data produk untuk sistem EOQ
            </p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Tambah Produk
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? "Edit Produk" : "Tambah Produk Baru"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingProduct
                      ? "Perbarui informasi produk"
                      : "Isi informasi produk baru"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product_code">Kode Produk</Label>
                      <Input
                        id="product_code"
                        value={formData.product_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            product_code: e.target.value,
                          })
                        }
                        placeholder="Contoh: RAW-001"
                        required
                        disabled={isSubmitting}
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product_name">Nama Produk</Label>
                      <Input
                        id="product_name"
                        value={formData.product_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            product_name: e.target.value,
                          })
                        }
                        placeholder="Nama produk"
                        required
                        disabled={isSubmitting}
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>
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
                      placeholder="Deskripsi produk (opsional)"
                      disabled={isSubmitting}
                      className="transition-all duration-300 focus:shadow-md"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_id">Kategori</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, category_id: value })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat: any) => (
                            <SelectItem
                              key={cat.category_id}
                              value={cat.category_id.toString()}
                            >
                              {cat.category_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit_id">Satuan</Label>
                      <Select
                        value={formData.unit_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, unit_id: value })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih satuan" />
                        </SelectTrigger>
                        <SelectContent>
                          {units?.map((unit: any) => (
                            <SelectItem
                              key={unit.unit_id}
                              value={unit.unit_id.toString()}
                            >
                              {unit.unit_name} ({unit.unit_abbreviation})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_price">Harga Beli</Label>
                      <Input
                        id="purchase_price"
                        type="number"
                        value={formData.purchase_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            purchase_price: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="selling_price">Harga Jual</Label>
                      <Input
                        id="selling_price"
                        type="number"
                        value={formData.selling_price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            selling_price: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_stock">Stok Minimum</Label>
                      <Input
                        id="min_stock"
                        type="number"
                        value={formData.min_stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            min_stock: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_stock">Stok Maksimum</Label>
                      <Input
                        id="max_stock"
                        type="number"
                        value={formData.max_stock}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            max_stock: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                        className="transition-all duration-300 focus:shadow-md"
                      />
                    </div>
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
                  <Button type="submit" disabled={isSubmitting} className="">
                    {isSubmitting && <Loader2 className="h-4 w-4" />}
                    {editingProduct ? "Perbarui" : "Simpan"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <Loader2 className="relative h-10 w-10 text-primary" />
            </div>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto w-full max-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Kategori
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Satuan
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Harga Beli
                    </TableHead>
                    <TableHead className="hidden xl:table-cell">
                      Harga Jual
                    </TableHead>
                    <TableHead className="hidden 2xl:table-cell">
                      Stok Maks
                    </TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Status
                    </TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          <div className="bg-muted p-4 rounded-full">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">Belum ada produk</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Klik "Tambah Produk" untuk menambahkan.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products?.map((product: any) => (
                      <TableRow key={product.product_id} className="">
                        <TableCell className="font-medium">
                          {product.product_code}
                        </TableCell>
                        <TableCell>{product.product_name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.categories?.category_name ?? "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {product.units?.unit_abbreviation ?? "-"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          Rp{" "}
                          {parseInt(product.purchase_price).toLocaleString(
                            "id-ID",
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {product.selling_price
                            ? `Rp ${parseInt(product.selling_price).toLocaleString("id-ID")}`
                            : "-"}
                        </TableCell>
                        <TableCell className="hidden 2xl:table-cell">
                          {product.max_stock
                            ? parseFloat(product.max_stock).toLocaleString(
                                "id-ID",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {product.stock?.current_quantity || 0}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant={
                              product.is_active ? "default" : "secondary"
                            }
                          >
                            {product.is_active ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                Aktif
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3" />
                                Nonaktif
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              className="hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDelete(
                                  product.product_id,
                                  product.product_name,
                                )
                              }
                              disabled={deleteMutation.isPending}
                              className="hover:shadow-md transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
