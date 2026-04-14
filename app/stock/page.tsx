// Stock management
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
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast";

export default function StockPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    transaction_type: "IN",
    quantity: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: stock, isLoading } = useQuery({
    queryKey: ["stock"],
    queryFn: async () => {
      const res = await fetch("/api/stock");
      if (!res.ok) throw new Error("Failed to fetch stock");
      return res.json();
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          product_id: parseInt(data.product_id),
          quantity: parseFloat(data.quantity),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create transaction");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      setOpen(false);
      resetForm();
      toast.success("Transaksi stok berhasil dicatat");
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal mencatat transaksi stok");
    },
  });

  const resetForm = () => {
    setFormData({
      product_id: "",
      transaction_type: "IN",
      quantity: "",
      notes: "",
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await createMutation.mutateAsync(formData);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStatus = (current: number, min: number) => {
    if (current === 0)
      return { label: "HABIS", variant: "destructive" as const };
    if (current <= min)
      return { label: "REORDER", variant: "secondary" as const };
    return { label: "AMAN", variant: "default" as const };
  };

  if (!session) {
    return null;
  }

  return (
    <AppLayout pageTitle="Manajemen Stok">
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Manajemen Stok
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola stok dan catat transaksi persediaan
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <RefreshCw className="h-4 w-4" />
                Catat Transaksi
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Catat Transaksi Stok</DialogTitle>
                  <DialogDescription>
                    Catat pemasukan, pengeluaran, atau penyesuaian stok
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="product_id">Produk</Label>
                    <Select
                      value={formData.product_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, product_id: value })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih produk" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          ?.filter((p: any) => p.is_active)
                          .map((product: any) => (
                            <SelectItem
                              key={product.product_id}
                              value={product.product_id.toString()}
                            >
                              {product.product_code} - {product.product_name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction_type">Jenis Transaksi</Label>
                    <Select
                      value={formData.transaction_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, transaction_type: value })
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IN">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Pemasukan
                          </div>
                        </SelectItem>
                        <SelectItem value="OUT">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4" />
                            Pengeluaran
                          </div>
                        </SelectItem>
                        <SelectItem value="ADJUSTMENT">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Penyesuaian
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Jumlah</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) =>
                        setFormData({ ...formData, quantity: e.target.value })
                      }
                      placeholder="Jumlah"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Catatan tambahan (opsional)"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Simpan
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
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto w-full max-w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Min. Stok</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Update</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Belum ada data stok
                      </TableCell>
                    </TableRow>
                  ) : (
                    stock?.map((item: any) => {
                      const status = getStockStatus(
                        parseFloat(item.current_quantity),
                        parseFloat(item.products?.min_stock ?? 0),
                      );
                      return (
                        <TableRow key={item.stock_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {item.products?.product_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.products?.product_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.products?.categories?.category_name ?? "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {parseFloat(
                                  item.current_quantity,
                                ).toLocaleString("id-ID")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.products?.units?.unit_abbreviation ?? ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {parseFloat(
                              item.products?.min_stock ?? 0,
                            ).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(item.last_updated).toLocaleDateString(
                              "id-ID",
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
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
