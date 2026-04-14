// Stock transaction history page
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  Loader2,
  FileText,
} from "lucide-react";
import { useSession } from "next-auth/react";

const typeIcons: Record<string, any> = {
  IN: TrendingUp,
  OUT: TrendingDown,
  ADJUSTMENT: RefreshCw,
  RECEIVE: Package,
};

const typeColors: Record<string, string> = {
  IN: "bg-green-500/10 text-green-600",
  OUT: "bg-red-500/10 text-red-600",
  ADJUSTMENT: "bg-blue-500/10 text-blue-600",
  RECEIVE: "bg-purple-500/10 text-purple-600",
};

const typeLabels: Record<string, string> = {
  IN: "Pemasukan",
  OUT: "Pengeluaran",
  ADJUSTMENT: "Penyesuaian",
  RECEIVE: "Penerimaan PO",
};

export default function StockTransactionsPage() {
  const { data: session } = useSession();
  const [productFilter, setProductFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["stock-transactions", productFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (productFilter !== "all") params.set("product_id", productFilter);
      if (typeFilter !== "all") params.set("transaction_type", typeFilter);
      const res = await fetch(`/api/stock/transactions?${params}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("id-ID", {
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
    <AppLayout pageTitle="Riwayat Transaksi Stok">
      <div className="space-y-6 w-full max-w-full overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Transaksi Stok</h1>
          <p className="text-muted-foreground mt-1">
            Lihat semua riwayat perubahan stok produk
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="text-sm font-medium mb-1 block">Jenis</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua jenis</SelectItem>
                {Object.entries(typeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
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
                    <TableHead>Jenis</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Sebelum</TableHead>
                    <TableHead>Sesudah</TableHead>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Oleh</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <FileText className="h-10 w-10 text-muted-foreground/50" />
                          <p className="font-medium">Belum ada transaksi</p>
                          <p className="text-sm text-muted-foreground">
                            Transaksi stok akan muncul saat ada perubahan stok
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions?.map((tx: any) => {
                      const Icon = typeIcons[tx.transaction_type] || Package;
                      return (
                        <TableRow key={tx.transaction_id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {tx.products?.product_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tx.products?.product_code}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                typeColors[tx.transaction_type] ||
                                "bg-gray-500/10 text-gray-600"
                              }
                            >
                              <Icon className="mr-1 h-3 w-3" />
                              {typeLabels[tx.transaction_type] ||
                                tx.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {tx.transaction_type === "OUT" ? "-" : "+"}
                            {parseFloat(tx.quantity).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            {parseFloat(tx.quantity_before).toLocaleString(
                              "id-ID",
                            )}
                          </TableCell>
                          <TableCell>
                            {parseFloat(tx.quantity_after).toLocaleString(
                              "id-ID",
                            )}
                          </TableCell>
                          <TableCell>
                            {tx.reference_type ? (
                              <Badge variant="outline" className="text-xs">
                                {tx.reference_type}: {tx.reference_id || "-"}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {tx.users?.full_name || "System"}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {tx.notes || "-"}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDateTime(tx.transaction_date)}
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
