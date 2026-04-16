"use client";

import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/common/DataTable";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  DollarSign,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: demandHistory } = useQuery({
    queryKey: ["demand-history"],
    queryFn: async () => {
      const res = await fetch("/api/demand-history");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (!session) {
    return null;
  }

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  const summary = data?.summary || {};
  const productsNeedReorder = data?.productsNeedReorder || [];
  const recentTransactions = data?.recentTransactions || [];
  const recentPOs = data?.recentPOs || [];

  // Prepare demand chart data
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const demandChartData =
    demandHistory
      ?.slice(0, 12)
      .map((item: any) => {
        const monthIndex = item.period_month - 1;
        const safeMonth = monthIndex >= 0 && monthIndex < 12 ? monthIndex : 0;
        return {
          month: `${monthNames[safeMonth]} ${item.period_year}`,
          demand: parseFloat(item.demand_quantity),
          product: item.products?.product_name || "Unknown",
        };
      })
      .reverse() || [];

  const stats = [
    {
      title: "Nilai Stok",
      value: formatCurrency(summary.total_stock_value || 0),
      description: "Total nilai persediaan",
      icon: DollarSign,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Perlu Pesan",
      value: summary.products_need_reorder || 0,
      description: "Produk perlu reorder",
      icon: AlertTriangle,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "PO Pending",
      value: formatCurrency(summary.pending_po_value || 0),
      description: "Nilai PO pending",
      icon: ShoppingCart,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Butuh Persetujuan",
      value: summary.pending_approval_count || 0,
      description: "PO menunggu approval",
      icon: Clock,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <AppLayout pageTitle="Dashboard">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Ringkasan inventaris dan rekomendasi EOQ
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            Live Data
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              <Loader2 className="relative h-12 w-12 text-primary" />
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.title}
                    className="border-0 shadow-lg overflow-hidden"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </CardTitle>
                        <div className={`${stat.bgColor} p-2 rounded-xl`}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-1">
                        {stat.value}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                    </CardContent>
                    {/* Gradient overlay */}
                    <div className={`h-1 bg-linear-to-r ${stat.color}`} />
                  </Card>
                );
              })}
            </div>

            {/* Demand Chart */}
            {demandChartData.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    Tren Demand Bulanan
                  </CardTitle>
                  <CardDescription>
                    Riwayat permintaan 12 bulan terakhir untuk analisis EOQ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={demandChartData}>
                      <defs>
                        <linearGradient
                          id="colorDemand"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid hsl(var(--border))",
                          boxShadow:
                            "0 10px 40px -10px hsl(var(--primary) / 0.2)",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="demand"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fill="url(#colorDemand)"
                        name="Demand"
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Products Need Reorder */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="bg-orange-500/10 p-2 rounded-xl">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                  </div>
                  Produk Perlu Pesan
                </CardTitle>
                <CardDescription>
                  Produk yang stoknya di bawah Reorder Point (ROP)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {productsNeedReorder.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Semua produk dalam kondisi aman
                    </p>
                  </div>
                ) : (
                  <DataTable
                    data={productsNeedReorder}
                    searchKeys={[
                      "product_name",
                      "product_code",
                      "supplier_name",
                    ]}
                    emptyMessage="Semua produk dalam kondisi aman"
                    pageSizeOptions={[5, 10, 25]}
                    columns={[
                      {
                        key: "product",
                        header: "Produk",
                        cell: (p: any) => (
                          <div>
                            <p className="font-semibold">{p.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.product_code}
                            </p>
                          </div>
                        ),
                      },
                      {
                        key: "current_stock",
                        header: "Stok",
                        cell: (p: any) => (
                          <Badge variant="destructive" className="font-medium">
                            {p.current_stock} {p.unit_abbreviation}
                          </Badge>
                        ),
                      },
                      {
                        key: "reorder_point",
                        header: "ROP",
                        cell: (p: any) => (
                          <span className="font-medium">{p.reorder_point}</span>
                        ),
                      },
                      {
                        key: "eoq_quantity",
                        header: "EOQ",
                        cell: (p: any) => (
                          <Badge variant="secondary" className="font-medium">
                            {Math.round(Number(p.eoq_quantity))}
                          </Badge>
                        ),
                      },
                      {
                        key: "supplier_name",
                        header: "Supplier",
                        className: "hidden sm:table-cell",
                        cell: (p: any) => p.supplier_name || "-",
                      },
                      {
                        key: "actions",
                        header: "Aksi",
                        cell: () => (
                          <Link href="/purchase-orders">
                            <Badge variant="outline" className="cursor-pointer">
                              Buat PO
                            </Badge>
                          </Link>
                        ),
                      },
                    ]}
                  />
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Transactions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-blue-500/10 p-2 rounded-xl">
                      <Package className="h-5 w-5 text-blue-500" />
                    </div>
                    Transaksi Stok Terbaru
                  </CardTitle>
                  <CardDescription>5 transaksi stok terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">
                      Belum ada transaksi
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentTransactions.map((tx: any, index: number) => (
                        <div
                          key={tx.transaction_id}
                          className="flex items-center justify-between p-4 rounded-xl border border-border/50"
                        >
                          <div>
                            <p className="font-semibold">
                              {tx.products.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.transaction_type} •{" "}
                              {new Date(tx.transaction_date).toLocaleDateString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                          <Badge
                            variant={
                              tx.transaction_type === "IN" ||
                              tx.transaction_type === "RECEIVE"
                                ? "default"
                                : "destructive"
                            }
                            className="font-medium"
                          >
                            {tx.quantity}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Purchase Orders */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="bg-purple-500/10 p-2 rounded-xl">
                      <ShoppingCart className="h-5 w-5 text-purple-500" />
                    </div>
                    Purchase Order Terbaru
                  </CardTitle>
                  <CardDescription>5 PO terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentPOs.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">
                      Belum ada PO
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {recentPOs.map((po: any, index: number) => (
                        <div
                          key={po.po_id}
                          className="flex items-center justify-between p-4 rounded-xl border border-border/50"
                        >
                          <div>
                            <p className="font-semibold">{po.po_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {po.suppliers.supplier_name} •{" "}
                              {new Date(po.created_at).toLocaleDateString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">
                              {formatCurrency(po.total_amount)}
                            </p>
                            <Badge
                              variant={
                                po.status === "disetujui"
                                  ? "default"
                                  : po.status === "diajukan"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="mt-1"
                            >
                              {po.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
