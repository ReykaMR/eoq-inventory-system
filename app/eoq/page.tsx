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
import { Plus, Calculator, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export default function EOQPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: "",
    annual_demand: "",
    ordering_cost: "",
    holding_cost_per_unit: "",
    working_days_per_year: "300",
    effective_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: eoqParams, isLoading } = useQuery({
    queryKey: ["eoq-parameters"],
    queryFn: async () => {
      const res = await fetch("/api/eoq");
      if (!res.ok) throw new Error("Failed to fetch EOQ parameters");
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
      const res = await fetch("/api/eoq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          product_id: parseInt(data.product_id),
          annual_demand: parseFloat(data.annual_demand),
          ordering_cost: parseFloat(data.ordering_cost),
          holding_cost_per_unit: parseFloat(data.holding_cost_per_unit),
          working_days_per_year: parseInt(data.working_days_per_year),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create EOQ parameter");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eoq-parameters"] });
      queryClient.invalidateQueries({ queryKey: ["eoq-calculations"] });
      setOpen(false);
      resetForm();
    },
  });

  const calculateMutation = useMutation({
    mutationFn: async (product_id: number) => {
      const res = await fetch("/api/eoq", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to calculate EOQ");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eoq-calculations"] });
    },
  });

  const resetForm = () => {
    setFormData({
      product_id: "",
      annual_demand: "",
      ordering_cost: "",
      holding_cost_per_unit: "",
      working_days_per_year: "300",
      effective_date: new Date().toISOString().split("T")[0],
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

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (!session) {
    return null;
  }

  return (
    <AppLayout pageTitle="Parameter EOQ">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Parameter EOQ</h1>
            <p className="text-muted-foreground mt-1">
              Kelola parameter Economic Order Quantity untuk perhitungan
              otomatis
            </p>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Tambah Parameter
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Tambah Parameter EOQ Baru</DialogTitle>
                  <DialogDescription>
                    Isi parameter EOQ untuk produk. Parameter lama akan
                    dinonaktifkan secara otomatis.
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
                      <Label htmlFor="annual_demand">
                        Permintaan Tahunan (D)
                      </Label>
                      <Input
                        id="annual_demand"
                        type="number"
                        value={formData.annual_demand}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            annual_demand: e.target.value,
                          })
                        }
                        placeholder="Contoh: 1200"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ordering_cost">Biaya Pemesanan (S)</Label>
                      <Input
                        id="ordering_cost"
                        type="number"
                        value={formData.ordering_cost}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ordering_cost: e.target.value,
                          })
                        }
                        placeholder="Contoh: 150000"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="holding_cost_per_unit">
                        Biaya Simpan per Unit (H)
                      </Label>
                      <Input
                        id="holding_cost_per_unit"
                        type="number"
                        value={formData.holding_cost_per_unit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            holding_cost_per_unit: e.target.value,
                          })
                        }
                        placeholder="Contoh: 5000"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="working_days_per_year">
                        Hari Kerja per Tahun
                      </Label>
                      <Input
                        id="working_days_per_year"
                        type="number"
                        value={formData.working_days_per_year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            working_days_per_year: e.target.value,
                          })
                        }
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="effective_date">Tanggal Efektif</Label>
                    <Input
                      id="effective_date"
                      type="date"
                      value={formData.effective_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          effective_date: e.target.value,
                        })
                      }
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
                    onClick={() => handleOpenChange(false)}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Simpan & Hitung EOQ
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
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead>Permintaan/Tahun</TableHead>
                  <TableHead>Biaya Pesan</TableHead>
                  <TableHead>Biaya Simpan</TableHead>
                  <TableHead>Tanggal Efektif</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eoqParams?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Belum ada parameter EOQ. Klik &quot;Tambah Parameter&quot;
                      untuk menambahkan.
                    </TableCell>
                  </TableRow>
                ) : (
                  eoqParams?.map((param: any) => (
                    <TableRow key={param.parameter_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {param.products?.product_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {param.products?.product_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {parseInt(param.annual_demand).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        Rp{" "}
                        {parseInt(param.ordering_cost).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>
                        Rp{" "}
                        {parseInt(param.holding_cost_per_unit).toLocaleString(
                          "id-ID",
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(param.effective_date).toLocaleDateString(
                          "id-ID",
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={param.is_active ? "default" : "secondary"}
                        >
                          {param.is_active ? (
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            calculateMutation.mutate(param.product_id)
                          }
                          disabled={calculateMutation.isPending}
                        >
                          <Calculator className="h-4 w-4" />
                          Hitung Ulang
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
