"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, DollarSign, Package, Star } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ["supplier", id],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch supplier");
      return res.json();
    },
    enabled: !!id,
  });

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <AppLayout pageTitle="Detail Supplier">
        <div className="flex justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!supplier) {
    return (
      <AppLayout pageTitle="Detail Supplier">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Supplier tidak ditemukan</p>
          <Link href="/suppliers">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Supplier
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout pageTitle="Detail Supplier">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/suppliers">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{supplier.supplier_name}</h1>
            <p className="text-muted-foreground">{supplier.supplier_code}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Kontak</CardTitle>
              <CardDescription>Detail kontak supplier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Kontak Person</p>
                <p className="font-medium">{supplier.contact_person || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telepon</p>
                <p className="font-medium">{supplier.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{supplier.email || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alamat</CardTitle>
              <CardDescription>Lokasi supplier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium">{supplier.address || "-"}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Kota</p>
                  <p className="font-medium">{supplier.city || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Provinsi</p>
                  <p className="font-medium">{supplier.province || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kode Pos</p>
                  <p className="font-medium">{supplier.postal_code || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={supplier.is_active ? "default" : "secondary"}
              className="gap-1"
            >
              {supplier.is_active ? (
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
          </CardContent>
        </Card>

        {/* Products Supplied */}
        <Card>
          <CardHeader>
            <CardTitle>Produk yang Disuplai</CardTitle>
            <CardDescription>
              {supplier.product_suppliers?.length || 0} produk
            </CardDescription>
          </CardHeader>
          <CardContent>
            {supplier.product_suppliers?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada produk yang disuplai
              </p>
            ) : (
              <div className="space-y-3">
                {supplier.product_suppliers?.map((ps: any) => (
                  <div
                    key={ps.product_supplier_id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {ps.products?.product_name}
                          </p>
                          {ps.is_primary && (
                            <Badge
                              variant="default"
                              className="gap-1 text-xs bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                            >
                              <Star className="h-3 w-3" />
                              Utama
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ps.products?.product_code}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {ps.supplier_price
                              ? new Intl.NumberFormat("id-ID", {
                                  style: "currency",
                                  currency: "IDR",
                                  minimumFractionDigits: 0,
                                }).format(Number(ps.supplier_price))
                              : "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{ps.lead_time_days} hari</span>
                        </div>
                        <div className="text-muted-foreground">
                          Min:{" "}
                          {parseFloat(ps.min_order_qty).toLocaleString("id-ID")}{" "}
                          {ps.products?.units?.unit_abbreviation || ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
