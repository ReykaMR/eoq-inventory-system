# EOQ Inventory System

Sistem Penentuan Pembelian Barang Dengan Metode **EOQ (Economic Order Quantity)**.

Aplikasi ini membantu mengelola inventaris dan menentukan waktu serta jumlah pembelian yang optimal menggunakan rumus EOQ standar: **Q\* = √(2DS/H)**

<img width="1241" height="800" alt="halaman_login" src="https://github.com/user-attachments/assets/d4853447-4347-4692-82de-8f889cebdea4" />
<img width="1241" height="800" alt="halaman_dashboard" src="https://github.com/user-attachments/assets/7a1c7ad2-93ad-42e1-8d44-abc1e5b51f84" />

## Fitur Utama

### Perhitungan EOQ
- **EOQ (Economic Order Quantity)**: Menghitung jumlah pesanan optimal untuk meminimalkan total biaya persediaan
- **Reorder Point (ROP)**: Menentukan level stok di mana pesanan baru harus dilakukan
- **Hasil EOQ**: Lihat detail semua perhitungan EOQ (Q*, ROP, biaya, dll)
- **Rekomendasi Otomatis**: Sistem mendeteksi stok di bawah ROP dan menyarankan jumlah EOQ

### Manajemen Persediaan
- **Stock Management**: Monitoring stok real-time dengan alert stok menipis
- **Riwayat Stok**: Lihat semua riwayat perubahan stok dengan filter produk & jenis
- **Purchase Orders**: Buat PO dari rekomendasi EOQ dengan auto-fill atau manual
- **Demand History**: Catat riwayat permintaan bulanan untuk analisis
- **Produk & Kategori**: Kelola data produk dengan kategori dan satuan

### Manajemen Data Master
- **Supplier**: Kelola data pemasok dengan detail kontak
- **Satuan**: Kelola satuan pengukuran (kg, liter, pcs, dll)
- **Users**: Manajemen user dengan role-based access control

### Notifikasi & Profil
- **Notifikasi**: Peringatan stok menipis, PO pending, transaksi terbaru
- **Profil**: Lihat dan edit informasi akun pengguna

### Dashboard
- Ringkasan nilai stok, produk perlu reorder, PO pending
- Grafik tren demand 12 bulan terakhir
- Rekomendasi EOQ yang perlu segera dipesan
- Transaksi stok dan PO terbaru

## Teknologi

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth.js (JWT) |
| **Styling** | Tailwind CSS 3 + shadcn/ui |
| **State** | TanStack React Query |
| **Charts** | Recharts |

## Role & Akses

| Role | Akses |
|------|-------|
| **Admin** | Full access: semua fitur termasuk manajemen user |
| **Manager** | EOQ, PO, stock, demand, profile, notifikasi |
| **Staff Pembelian** | Produk, supplier, EOQ, PO, demand, profile, notifikasi |
| **Staff Gudang** | Dashboard, stock, profile, notifikasi |

## Instalasi

### Prasyarat
- Node.js 24
- PostgreSQL 18
- npm

### Langkah Instalasi

1. **Clone repository**
```bash
git clone https://github.com/ReykaMR/eoq-inventory-system.git
cd eoq-inventory-system
```

2. **Setup environment**
```bash
cp .env.example .env
```
Edit `.env` dan sesuaikan:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/eoq_inventory_system?schema=public
NEXTAUTH_SECRET=generate-random-secret-key-here
NEXTAUTH_URL=http://localhost:3000
```

3. **Install dependencies**
```bash
npm install
```

4. **Setup database**
```bash
npm run db:migrate    # Jalankan migrasi database (Prisma migrate dev)
npm run db:setup      # Setup data awal (views, functions)
npm run db:seed       # Seed data demo (users, produk, dll)
```

5. **Jalankan development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `password123` |
| Manager | `manager` | `password123` |
| Staff Pembelian | `staff_beli` | `password123` |
| Staff Gudang | `staff_gudang` | `password123` |

## Database Schema

Entitas utama:
- `users` - Data pengguna dengan role-based access
- `products` - Produk/barang dengan harga dan stok minimum
- `categories` - Kategori produk
- `units` - Satuan pengukuran
- `suppliers` - Data pemasok
- `stock` - Level stok per produk
- `eoq_parameters` - Parameter EOQ (D, S, H) per produk
- `eoq_calculations` - Hasil perhitungan EOQ
- `purchase_orders` - Purchase orders dengan status workflow
- `stock_transactions` - Riwayat transaksi stok (IN/OUT/ADJUSTMENT)
- `demand_history` - Riwayat permintaan bulanan
- `notifications` - Notifikasi sistem per pengguna

## Rumus EOQ

**Q\* = √(2DS/H)**

Dimana:
- **Q\*** = Economic Order Quantity (jumlah pesanan optimal)
- **D** = Demand tahunan (unit/tahun)
- **S** = Biaya pemesanan per order (Rp)
- **H** = Biaya penyimpanan per unit per tahun (Rp)

**Reorder Point (ROP) = d × L**

Dimana:
- **d** = Demand harian (D / hari kerja per tahun)
- **L** = Lead time dalam hari

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run db:migrate   # Jalankan migrasi database
npm run db:setup     # Setup database views/functions
npm run db:seed      # Seed demo data
npm run db:reset     # Reset database + seed ulang
npm run db:truncate  # Kosongkan semua tabel, reset ID ke 1
```

## Konfigurasi Tambahan

### Production Deployment
1. Set `NODE_ENV=production`
2. Generate `NEXTAUTH_SECRET` yang kuat: `openssl rand -base64 32`
3. Set `NEXTAUTH_URL` ke domain produksi
4. Deploy ke Vercel, Railway, atau server sendiri

### Backup Database
```bash
pg_dump -U postgres eoq_inventory_system > backup.sql
```

## Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| `prisma: command not found` | Jalankan `npx prisma` atau install Prisma global `npm i -g prisma` |
| Database connection error | Pastikan PostgreSQL berjalan dan `DATABASE_URL` benar |
| `NEXTAUTH_SECRET` missing | Generate secret dengan `openssl rand -base64 32` dan tambahkan ke `.env` |
| Error saat `npm run db:migrate` | Pastikan database sudah dibuat: `createdb eoq_inventory_system` |

## Lisensi

MIT License
