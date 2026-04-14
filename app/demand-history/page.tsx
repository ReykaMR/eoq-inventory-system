// Demand history management
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast";

export default function DemandHistoryPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    period_year: new Date().getFullYear().toString(),
    period_month: (new Date().getMonth() + 1).toString(),
    demand_quantity: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: demandHistory, isLoading } = useQuery({
    queryKey: ["demand-history"],
    queryFn: async () => {
      const res = await fetch("/api/demand-history");
      if (!res.ok) throw new Error("Failed to fetch demand history");
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
      const res = await fetch("/api/demand-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          product_id: parseInt(data.product_id),
          period_year: parseInt(data.period_year),
          period_month: parseInt(data.period_month),
          demand_quantity: parseFloat(data.demand_quantity),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save demand history");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demand-history"] });
      setOpen(false);
      resetForm();
      toast.success("Demand history berhasil ditambahkan");
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal menambahkan demand history");
    },
  });

  const resetForm = () => {
    setFormData({
      product_id: "",
      period_year: new Date().getFullYear().toString(),
      period_month: (new Date().getMonth() + 1).toString(),
      demand_quantity: "",
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

  if (!session) {
    return null;
  }

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  return (
    <AppLayout pageTitle="Riwayat Demand">
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Riwayat Demand
            </h1>
            <p className="text-muted-foreground mt-1">
              Catat dan lihat riwayat permintaan bulanan untuk analisis EOQ
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Tambah Data Demand
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Catat Demand Bulanan</DialogTitle>
                  <DialogDescription>
                    Input jumlah demand aktual untuk periode tertentu
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="period_year">Tahun</Label>
                      <Input
                        id="period_year"
                        type="number"
                        value={formData.period_year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            period_year: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period_month">Bulan</Label>
                      <Select
                        value={formData.period_month}
                        onValueChange={(value) =>
                          setFormData({ ...formData, period_month: value })
                        }
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {monthNames.map((month, index) => (
                            <SelectItem
                              key={index}
                              value={(index + 1).toString()}
                            >
                              {month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demand_quantity">Jumlah Demand</Label>
                    <Input
                      id="demand_quantity"
                      type="number"
                      value={formData.demand_quantity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          demand_quantity: e.target.value,
                        })
                      }
                      placeholder="Jumlah demand aktual"
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
          <DataTable
            data={demandHistory || []}
            searchKeys={["products"]}
            emptyMessage='Belum ada data demand. Klik "Tambah Data Demand" untuk menambahkan.'
            columns={[
              {
                key: "product",
                header: "Produk",
                cell: (d: any) => (
                  <div>
                    <p className="font-medium">{d.products?.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.products?.product_code}
                    </p>
                  </div>
                ),
              },
              {
                key: "period",
                header: "Periode",
                cell: (d: any) => {
                  const monthNames = [
                    "Januari",
                    "Februari",
                    "Maret",
                    "April",
                    "Mei",
                    "Juni",
                    "Juli",
                    "Agustus",
                    "September",
                    "Oktober",
                    "November",
                    "Desember",
                  ];
                  const m =
                    d.period_month >= 1 && d.period_month <= 12
                      ? monthNames[d.period_month - 1]
                      : "Unknown";
                  return (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {m} {d.period_year}
                      </span>
                    </div>
                  );
                },
              },
              {
                key: "demand_quantity",
                header: "Demand",
                cell: (d: any) =>
                  parseFloat(d.demand_quantity).toLocaleString("id-ID"),
              },
              {
                key: "notes",
                header: "Catatan",
                className: "hidden md:table-cell",
                cell: (d: any) => d.notes || "-",
              },
              {
                key: "user",
                header: "Dicatat Oleh",
                className: "hidden sm:table-cell",
                cell: (d: any) => d.users?.full_name || "System",
              },
            ]}
          />
        )}
      </div>
    </AppLayout>
  );
}
