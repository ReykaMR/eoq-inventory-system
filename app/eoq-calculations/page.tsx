// EOQ calculations results page
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calculator,
  TrendingUp,
  Package,
  Loader2,
  FileText,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EoqCalculationsPage() {
  const { data: session } = useSession();
  const [productFilter, setProductFilter] = useState<string>("all");

  const { data: calculations, isLoading } = useQuery({
    queryKey: ["eoq-calculations", productFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (productFilter !== "all") params.set("product_id", productFilter);
      const res = await fetch(`/api/eoq/calculations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch EOQ calculations");
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

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  const formatDate = (date: string) => {
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
    <AppLayout pageTitle="Hasil Perhitungan EOQ">
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold">Hasil Perhitungan EOQ</h1>
          <p className="text-muted-foreground mt-1">
            Lihat riwayat dan detail perhitungan Economic Order Quantity
          </p>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 max-w-sm">
            <label className="text-sm font-medium mb-1 block">Produk</label>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua produk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua produk</SelectItem>
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
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : calculations?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="font-medium">Belum ada perhitungan EOQ</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tambahkan parameter EOQ terlebih dahulu untuk menghitung
              </p>
              <Button className="mt-4" asChild>
                <a href="/eoq">
                  <Calculator className="h-4 w-4" />
                  Tambah Parameter EOQ
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {calculations?.map((calc: any, index: number) => (
              <Card key={calc.calculation_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        {calc.products?.product_name}
                      </CardTitle>
                      <CardDescription>
                        {calc.products?.product_code} •{" "}
                        {formatDate(calc.calculation_date)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={calc.is_active ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {calc.is_active ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )}
                      {calc.is_active ? "Aktif" : "Tidak Aktif"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">EOQ (Q*)</p>
                      <p className="text-xl font-bold text-primary">
                        {Math.round(Number(calc.eoq_quantity)).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">unit</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Reorder Point
                      </p>
                      <p className="text-lg font-semibold">
                        {Math.round(Number(calc.reorder_point)).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">unit</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Safety Stock
                      </p>
                      <p className="text-lg font-semibold">
                        {Math.round(Number(calc.safety_stock)).toLocaleString(
                          "id-ID",
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">unit</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Order/Tahun
                      </p>
                      <p className="text-lg font-semibold">
                        {Number(calc.orders_per_year).toFixed(1)}x
                      </p>
                      <p className="text-xs text-muted-foreground">
                        setiap {Number(calc.order_interval_days).toFixed(0)}{" "}
                        hari
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Biaya Pesan/Tahun
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(calc.total_ordering_cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Biaya Simpan/Tahun
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(calc.total_holding_cost)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Biaya Inventori/Tahun
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(calc.total_inventory_cost)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Lead Time
                        </p>
                        <p className="text-lg font-semibold">
                          {calc.lead_time_days} hari
                        </p>
                      </div>
                    </div>
                  </div>
                  {calc.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Catatan</p>
                      <p className="text-sm">{calc.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
