"use client";

import { useEffect } from "react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Package,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  TrendingUp,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Username atau password salah");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800" />

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl" />
                <div className="relative bg-linear-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-2xl">
                  <Package className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  EOQ System
                </h1>
                <p className="text-muted-foreground mt-1">
                  Inventory Management
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold leading-tight">
                Sistem Penentuan Pembelian Barang
                <span className="block bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                  Dengan Metode EOQ
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Optimalkan persediaan barang Anda dengan perhitungan Economic
                Order Quantity yang akurat dan otomatis.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Perhitungan EOQ Otomatis</h3>
                  <p className="text-sm text-muted-foreground">
                    Formula Q* = √(2DS/H)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Rekomendasi Pembelian</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-suggest kapan & berapa banyak
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-time Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Dashboard interaktif & alert
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="">
          <Card className="border-2 border-border/50 shadow-2xl backdrop-blur-xl bg-card/80">
            <CardHeader className="space-y-3 text-center pb-8">
              <div className="flex justify-center mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                  <div className="relative bg-linear-to-br from-primary to-primary/80 p-4 rounded-full shadow-xl">
                    <Package className="h-10 w-10 text-primary-foreground" />
                  </div>
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold mb-2">
                  Selamat Datang
                </CardTitle>
                <CardDescription className="text-base">
                  Masuk ke akun Anda untuk melanjutkan
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5" />
                      Masuk...
                    </>
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm font-medium text-center flex-1">
                      Demo Accounts
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { role: "Admin", user: "admin" },
                      { role: "Manager", user: "manager" },
                      { role: "Staff Beli", user: "staff_beli" },
                      { role: "Staff Gudang", user: "staff_gudang" },
                    ].map((demo) => (
                      <div
                        key={demo.user}
                        className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:border-primary/50 cursor-pointer"
                        onClick={() => {
                          setUsername(demo.user);
                          setPassword("password123");
                        }}
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {demo.role}
                        </p>
                        <p className="text-sm font-semibold mt-0.5">
                          {demo.user}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          password123
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
