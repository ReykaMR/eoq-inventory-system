"use client";

// Daftar PO dengan EOQ recommendations

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
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Plus,
  Loader2,
  ShoppingCart,
  TrendingUp,
  Eye,
  Send,
  Check,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useToast } from "@/components/toast";

export default function PurchaseOrdersPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [formData, setFormData] = useState({
    supplier_id: "",
    order_date: new Date().toISOString().split("T")[0],
    expected_delivery_date: "",
    notes: "",
    items: [] as Array<{
      product_id: string;
      product_name: string;
      quantity_ordered: string;
      unit_price: string;
      notes: string;
    }>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: purchaseOrders, isLoading } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await fetch("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed to fetch POs");
      return res.json();
    },
  });

  const { data: eoqRecommendations } = useQuery({
    queryKey: ["eoq-recommendations"],
    queryFn: async () => {
      const res = await fetch("/api/eoq/recommendations");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers");
      if (!res.ok) throw new Error("Failed to fetch suppliers");
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
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create PO");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setShowCreateDialog(false);
      resetForm();
      toast.success("Purchase Order berhasil dibuat");
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal membuat Purchase Order");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ poId, action }: { poId: number; action: string }) => {
      const res = await fetch(`/api/purchase-orders/${poId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update PO");
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      const messages: Record<string, string> = {
        submit: "PO berhasil diajukan",
        approve: "PO berhasil disetujui",
        receive: "PO berhasil diterima dan stok diperbarui",
      };
      toast.success(messages[variables.action] || "Status PO berhasil diperbarui");
    },
    onError: (err: any) => {
      toast.error(err.message || "Gagal memperbarui status PO");
    },
  });

  const resetForm = () => {
    setFormData({
      supplier_id: "",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: "",
      notes: "",
      items: [],
    });
    setError("");
  };

  const handleCreateFromEOQ = (recommendation: any) => {
    setFormData({
      supplier_id: recommendation.supplier_id.toString(),
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery_date: new Date(
        Date.now() + recommendation.lead_time_days * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
      notes: `Auto-generated from EOQ recommendation`,
      items: [
        {
          product_id: recommendation.product_id.toString(),
          product_name: recommendation.product_name,
          quantity_ordered: Math.round(
            Number(recommendation.eoq_quantity),
          ).toString(),
          unit_price: recommendation.supplier_price?.toString() || "0",
          notes: `EOQ: ${Math.round(Number(recommendation.eoq_quantity))} units, ROP: ${recommendation.reorder_point}`,
        },
      ],
    });
    setShowCreateDialog(true);
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { variant: any; icon: any; label: string }
    > = {
      draft: { variant: "outline", icon: Clock, label: "Draft" },
      diajukan: { variant: "secondary", icon: Send, label: "Diajukan" },
      disetujui: { variant: "default", icon: Check, label: "Disetujui" },
      diterima: { variant: "default", icon: CheckCircle, label: "Diterima" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  if (!session) {
    return null;
  }

  const canCreate =
    session.user.role === "admin" || session.user.role === "staff_pembelian";
  const canApprove =
    session.user.role === "manager" || session.user.role === "admin";
  const canReceive =
    session.user.role === "staff_gudang" || session.user.role === "admin";

  return (
    <AppLayout pageTitle="Purchase Orders">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Purchase Orders</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Kelola pesanan pembelian dengan rekomendasi EOQ
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Buat PO
            </Button>
          )}
        </div>

        {/* EOQ Recommendations */}
        {eoqRecommendations && eoqRecommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Rekomendasi EOQ - Perlu Pesan
              </CardTitle>
              <CardDescription>
                Produk yang stoknya di bawah Reorder Point. Klik "Buat PO" untuk
                auto-fill dari EOQ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {eoqRecommendations.map((rec: any) => (
                  <div
                    key={rec.product_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium">{rec.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stok: {rec.current_stock} | ROP: {rec.reorder_point} |
                          EOQ: {Math.round(Number(rec.eoq_quantity))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supplier: {rec.supplier_name} | Lead Time:{" "}
                          {rec.lead_time_days} hari
                        </p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleCreateFromEOQ(rec)}>
                      <div>
                        <ShoppingCart className="h-4 w-4" />
                        Buat PO dari EOQ
                      </div>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PO Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Purchase Orders</CardTitle>
            <CardDescription>
              Semua purchase order dengan status dan detail
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Tanggal
                      </TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders?.length === 0 ? (
                      <tr key="empty">
                        <TableCell colSpan={6} className="text-center py-8">
                          Belum ada PO. Klik "Buat PO" untuk membuat.
                        </TableCell>
                      </tr>
                    ) : (
                      purchaseOrders?.map((po: any) => (
                        <tr key={po.po_id}>
                          <TableCell className="font-medium">
                            {po.po_number}
                          </TableCell>
                          <TableCell>{po.suppliers?.supplier_name}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {new Date(po.order_date).toLocaleDateString(
                              "id-ID",
                            )}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(po.total_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(po.status)}</TableCell>
                          <TableCell>
                            <div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPO(po)}
                              >
                                <div>
                                  <Eye className="h-4 w-4" />
                                </div>
                              </Button>

                              {canCreate && po.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      poId: po.po_id,
                                      action: "submit",
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <div>
                                    <Send className="h-4 w-4" />
                                  </div>
                                </Button>
                              )}

                              {canApprove && po.status === "diajukan" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      poId: po.po_id,
                                      action: "approve",
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <div>
                                    <Check className="h-4 w-4" />
                                  </div>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create PO Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Buat Purchase Order</DialogTitle>
                <DialogDescription>
                  Isi detail PO. Jumlah akan otomatis terisi dari rekomendasi
                  EOQ.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, supplier_id: value })
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers
                        ?.filter((s: any) => s.is_active)
                        .map((supplier: any) => (
                          <SelectItem
                            key={supplier.supplier_id}
                            value={supplier.supplier_id.toString()}
                          >
                            {supplier.supplier_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="order_date">Tanggal Order</Label>
                    <Input
                      id="order_date"
                      type="date"
                      value={formData.order_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order_date: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expected_delivery_date">
                      Estimasi Tiba
                    </Label>
                    <Input
                      id="expected_delivery_date"
                      type="date"
                      value={formData.expected_delivery_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expected_delivery_date: e.target.value,
                        })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <Label>Item PO</Label>
                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <p className="text-sm font-medium">{item.product_name}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity_ordered}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index].quantity_ordered = e.target.value;
                              setFormData({ ...formData, items: newItems });
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Harga Satuan</Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => {
                              const newItems = [...formData.items];
                              newItems[index].unit_price = e.target.value;
                              setFormData({ ...formData, items: newItems });
                            }}
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.notes}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan PO</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Catatan tambahan"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isSubmitting}
                >
                  <div>Batal</div>
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <div>Buat PO</div>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* PO Detail Dialog */}
        <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
          <DialogContent className="sm:max-w-150">
            {selectedPO && (
              <>
                <DialogHeader>
                  <DialogTitle>Detail PO: {selectedPO.po_number}</DialogTitle>
                  <DialogDescription>
                    {getStatusBadge(selectedPO.status)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Supplier</p>
                      <p className="font-medium">
                        {selectedPO.suppliers?.supplier_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tanggal Order
                      </p>
                      <p className="font-medium">
                        {new Date(selectedPO.order_date).toLocaleDateString(
                          "id-ID",
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Items</p>
                    <div className="space-y-2">
                      {selectedPO.purchase_order_items?.map(
                        (item: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <p className="font-medium">
                              {item.products?.product_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity_ordered} x{" "}
                              {formatCurrency(item.unit_price)} ={" "}
                              {formatCurrency(
                                Number(item.quantity_ordered) *
                                  Number(item.unit_price),
                              )}
                            </p>
                            {item.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold">Total</p>
                      <p className="text-lg font-bold">
                        {formatCurrency(selectedPO.total_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
