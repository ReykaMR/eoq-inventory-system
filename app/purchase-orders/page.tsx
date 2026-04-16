"use client";

// Daftar PO dengan EOQ recommendations

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
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
  Trash2,
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
      toast.success(
        messages[variables.action] || "Status PO berhasil diperbarui",
      );
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

    // Validate
    if (!formData.supplier_id) {
      setError("Supplier harus dipilih");
      return;
    }
    if (formData.items.length === 0) {
      setError("Tambahkan minimal 1 item pada PO");
      return;
    }
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.product_id) {
        setError(`Item #${i + 1}: Produk harus dipilih`);
        return;
      }
      if (!item.quantity_ordered || parseFloat(item.quantity_ordered) <= 0) {
        setError(`Item #${i + 1}: Quantity harus lebih dari 0`);
        return;
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        setError(`Item #${i + 1}: Harga satuan harus lebih dari 0`);
        return;
      }
    }

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
              <DataTable
                data={purchaseOrders || []}
                searchKeys={["po_number", "suppliers"]}
                emptyMessage='Belum ada PO. Klik "Buat PO" untuk membuat.'
                columns={[
                  {
                    key: "po_number",
                    header: "PO Number",
                    cell: (po: any) => (
                      <span className="font-medium">{po.po_number}</span>
                    ),
                  },
                  {
                    key: "supplier_name",
                    header: "Supplier",
                    cell: (po: any) => po.suppliers?.supplier_name,
                  },
                  {
                    key: "order_date",
                    header: "Tanggal",
                    className: "hidden sm:table-cell",
                    cell: (po: any) =>
                      new Date(po.order_date).toLocaleDateString("id-ID"),
                  },
                  {
                    key: "total_amount",
                    header: "Total",
                    cell: (po: any) => formatCurrency(po.total_amount),
                  },
                  {
                    key: "status",
                    header: "Status",
                    cell: (po: any) => getStatusBadge(po.status),
                  },
                  {
                    key: "actions",
                    header: "Aksi",
                    cell: (po: any) => (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPO(po)}
                        >
                          <Eye className="h-4 w-4" />
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
                            <Send className="h-4 w-4" />
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
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
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
                  <div className="flex items-center justify-between">
                    <Label>Item PO</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          items: [
                            ...formData.items,
                            {
                              product_id: "",
                              product_name: "",
                              quantity_ordered: "",
                              unit_price: "",
                              notes: "",
                            },
                          ],
                        })
                      }
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Tambah Item
                    </Button>
                  </div>

                  {formData.items.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Belum ada item. Klik "Tambah Item" atau buat dari
                      rekomendasi EOQ.
                    </p>
                  )}

                  {formData.items.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Item #{index + 1}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newItems = formData.items.filter(
                              (_, i) => i !== index,
                            );
                            setFormData({ ...formData, items: newItems });
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>

                      <Select
                        value={item.product_id}
                        onValueChange={(value) => {
                          const product = products?.find(
                            (p: any) => p.product_id.toString() === value,
                          );
                          const newItems = [...formData.items];
                          newItems[index] = {
                            ...newItems[index],
                            product_id: value,
                            product_name: product?.product_name || "",
                          };
                          setFormData({ ...formData, items: newItems });
                        }}
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
                            placeholder="0"
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
                            placeholder="0"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <Input
                        value={item.notes}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].notes = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                        placeholder="Catatan item (opsional)"
                        disabled={isSubmitting}
                      />
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
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <div>Buat PO</div>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* PO Detail Dialog */}
        <Dialog open={!!selectedPO} onOpenChange={() => setSelectedPO(null)}>
          <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto">
            {selectedPO && (
              <>
                <DialogHeader>
                  <DialogTitle>Detail PO: {selectedPO.po_number}</DialogTitle>
                  <DialogDescription>
                    {getStatusBadge(selectedPO.status)}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {/* PO Info */}
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
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Estimasi Tiba
                      </p>
                      <p className="font-medium">
                        {selectedPO.expected_delivery_date
                          ? new Date(
                              selectedPO.expected_delivery_date,
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Aktual Tiba
                      </p>
                      <p className="font-medium">
                        {selectedPO.actual_delivery_date
                          ? new Date(
                              selectedPO.actual_delivery_date,
                            ).toLocaleDateString("id-ID")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Disetujui</p>
                      <p className="font-medium">
                        {selectedPO.users_purchase_orders_approved_byTousers
                          ?.full_name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Tanggal Setuju
                      </p>
                      <p className="font-medium">
                        {selectedPO.approved_at
                          ? new Date(selectedPO.approved_at).toLocaleDateString(
                              "id-ID",
                            )
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {selectedPO.notes && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Catatan PO
                      </p>
                      <p className="font-medium">{selectedPO.notes}</p>
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Item ({selectedPO.purchase_order_items?.length || 0})
                    </p>
                    <div className="space-y-2">
                      {selectedPO.purchase_order_items?.map(
                        (item: any, index: number) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <p className="font-medium">
                                {item.products?.product_name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                Diterima:{" "}
                                {parseFloat(
                                  item.quantity_received || 0,
                                ).toLocaleString("id-ID")}{" "}
                                /{" "}
                                {parseFloat(
                                  item.quantity_ordered,
                                ).toLocaleString("id-ID")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {parseFloat(item.quantity_ordered).toLocaleString(
                                "id-ID",
                              )}{" "}
                              x {formatCurrency(item.unit_price)} ={" "}
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
