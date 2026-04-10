# Alur Penggunaan Aplikasi — EOQ Inventory System

Dokumen ini menjelaskan langkah-langkah penggunaan sistem penentuan pembelian barang dengan metode EOQ (Economic Order Quantity), mulai dari login hingga alur kerja harian.

---

## 1. Login ke Sistem

1. Buka halaman login di `http://localhost:3000/login`
2. Masukkan **username** dan **password**
3. Klik **Masuk**
4. Setelah berhasil, Anda akan diarahkan ke **Dashboard**

> **Demo Akun:**
> | Role | Username | Password |
> |------|----------|----------|
> | Admin | `admin` | `password123` |
> | Manager | `manager` | `password123` |
> | Staff Pembelian | `staff_beli` | `password123` |
> | Staff Gudang | `staff_gudang` | `password123` |

---

## 2. Alur Pertama Kali Menggunakan Aplikasi (Setup Awal)

Langkah-langkah ini dilakukan **sekali saja** saat pertama kali menggunakan sistem:

### 2.1 Setup Data Master (Admin)

1. **Tambah Satuan Pengukuran**
   - Klik menu **Satuan** di sidebar
   - Klik **Tambah Satuan**
   - Isi nama satuan (contoh: `Kilogram`, `Liter`, `Pcs`) dan singkatan (`kg`, `L`, `pcs`)
   - Klik **Simpan**
   - Ulangi untuk semua satuan yang dibutuhkan

2. **Tambah Kategori Produk**
   - Klik menu **Kategori**
   - Klik **Tambah Kategori**
   - Isi kode kategori (contoh: `RAW` untuk bahan baku, `FIN` untuk barang jadi)
   - Isi nama kategori dan deskripsi
   - Klik **Simpan**

3. **Tambah Supplier/Pemasok**
   - Klik menu **Supplier**
   - Klik **Tambah Supplier**
   - Isi kode supplier, nama perusahaan, kontak person, telepon, email, dan alamat
   - Klik **Simpan**

4. **Tambah User (jika ada banyak pengguna)**
   - Klik menu **Users** (hanya Admin)
   - Klik **Tambah User**
   - Isi username, password, nama lengkap, email, role, dan status aktif
   - Klik **Simpan**

### 2.2 Setup Produk

1. Klik menu **Produk**
2. Klik **Tambah Produk**
3. Isi data produk:
   - **Kode Produk** (contoh: `RAW-001`)
   - **Nama Produk** (contoh: `Bahan A`)
   - **Kategori** (pilih dari dropdown)
   - **Satuan** (pilih dari dropdown)
   - **Harga Beli** dan **Harga Jual**
   - **Stok Minimum** (batas reorder) dan **Stok Maksimum**
   - Centang **Aktif**
4. Klik **Simpan**
5. Ulangi untuk semua produk yang dimiliki

### 2.3 Setup Parameter EOQ

1. Klik menu **EOQ Parameters**
2. Klik **Tambah Parameter**
3. Pilih produk dari dropdown
4. Isi parameter:
   - **Permintaan Tahunan (D)** — total kebutuhan produk per tahun (contoh: `1200`)
   - **Biaya Pemesanan (S)** — biaya per kali pesan (contoh: `150000`)
   - **Biaya Simpan per Unit (H)** — biaya menyimpan 1 unit per tahun (contoh: `5000`)
   - **Hari Kerja per Tahun** (default: `300`)
5. Klik **Simpan & Hitung EOQ**
6. Sistem akan menghitung Q* (EOQ) secara otomatis menggunakan rumus: **Q* = √(2DS/H)**
7. Ulangi untuk semua produk yang membutuhkan perhitungan EOQ

### 2.4 Catat Demand History (Opsional tapi Disarankan)

1. Klik menu **Demand History**
2. Klik **Tambah Data Demand**
3. Pilih produk, isi tahun, bulan, dan jumlah demand aktual
4. Klik **Simpan**
5. Data ini digunakan untuk analisis tren di dashboard

---

## 3. Alur Kerja Harian / Rutin

### 3.1 Monitoring Dashboard

1. Buka **Dashboard** setelah login
2. Lihat **ringkasan**:
   - **Nilai Stok** — total nilai persediaan saat ini
   - **Perlu Pesan** — jumlah produk yang stoknya di bawah ROP
   - **PO Pending** — nilai purchase order yang belum selesai
   - **Butuh Persetujuan** — jumlah PO yang menunggu approval
3. Cek **Rekomendasi EOQ** — produk yang perlu segera dipesan
4. Lihat **grafik tren demand** 12 bulan terakhir

### 3.2 Mengecek Stok

1. Klik menu **Stock Management**
2. Lihat tabel stok semua produk:
   - **Stok Saat Ini** — jumlah persediaan saat ini
   - **Min. Stok** — batas reorder point
   - **Status** — `AMAN` (hijau), `REORDER` (kuning), `HABIS` (merah)
3. Jika status **REORDER** atau **HABIS**, lanjut ke langkah 3.3

### 3.3 Membuat Purchase Order (PO) dari Rekomendasi EOQ

1. Di **Dashboard**, lihat bagian **Rekomendasi EOQ - Perlu Pesan**
2. Klik **Buat PO dari EOQ** pada produk yang perlu dipesan
3. Form PO akan terisi otomatis:
   - Supplier sudah terpilih
   - Jumlah pesanan sudah terisi dari nilai EOQ
   - Estimasi tanggal tiba sudah dihitung dari lead time
4. Tambahkan catatan jika perlu
5. Klik **Buat PO**
6. Status PO akan menjadi **Draft**

### 3.4 Mengelola Status PO (Workflow)

| Status | Aksi | Role |
|--------|------|------|
| **Draft** | Klik tombol **Kirim** (icon pesawat) untuk mengubah jadi **Diajukan** | Staff Pembelian |
| **Diajukan** | Klik tombol **Setujui** (icon centang) untuk mengubah jadi **Disetujui** | Manager |
| **Disetujui** | PO dikirim ke supplier (proses di luar sistem) | — |
| **Diterima** | Barang diterima di gudang dan stok ditambahkan | Staff Gudang |

### 3.5 Mencatat Transaksi Stok

1. Klik menu **Stock Management**
2. Klik **Catat Transaksi**
3. Pilih produk, jenis transaksi:
   - **Pemasukan** — barang masuk dari supplier (PO diterima)
   - **Pengeluaran** — barang keluar untuk produksi/penjualan
   - **Penyesuaian** — koreksi stok (stock opname)
4. Isi jumlah dan catatan
5. Klik **Simpan**

---

## 4. Fitur Tambahan

### 4.1 Profil Pengguna

1. Klik ikon **User** di pojok kanan atas → **Profil**, atau klik menu **Profil** di sidebar
2. Lihat informasi akun: nama, email, username, role, status, terakhir login
3. Klik **Edit** untuk mengubah nama dan email
4. Klik **Simpan** untuk menyimpan perubahan

### 4.2 Notifikasi

1. Klik ikon **Lonceng** di pojok kanan atas, atau klik menu **Notifikasi** di sidebar
2. Lihat daftar notifikasi:
   - **Stok Menipis** — peringatan stok di bawah minimum
   - **Purchase Order Pending** — PO yang menunggu persetujuan
   - **Transaksi Stok** — riwayat transaksi terbaru
3. Filter: klik **Belum Dibaca** untuk melihat yang belum dibaca saja
4. Klik **Tandai Semua Dibaca** untuk membersihkan semua notifikasi
5. Klik **Hapus** (icon sampah) untuk menghapus notifikasi individual

### 4.3 Menghitung Ulang EOQ

1. Klik menu **EOQ Parameters**
2. Pada baris produk yang ingin dihitung ulang, klik **Hitung Ulang**
3. Sistem akan menghitung ulang Q* berdasarkan parameter terbaru

---

## 5. Alur Lengkap: Dari Stok Rendah hingga PO Diterima

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Dashboard menampilkan alert "Perlu Pesan"                │
│    → Stok produk X sudah di bawah Reorder Point             │
│    → Sistem menampilkan EOQ: 250 unit                        │
├─────────────────────────────────────────────────────────────┤
│ 2. Staff Pembelian klik "Buat PO dari EOQ"                  │
│    → Form PO otomatis terisi:                               │
│      • Supplier: PT Supplier ABC                             │
│      • Jumlah: 250 unit (dari EOQ)                           │
│      • Estimasi tiba: 7 hari (dari lead time)               │
│    → Status: Draft                                           │
├─────────────────────────────────────────────────────────────┤
│ 3. Staff Pembelian klik "Kirim"                              │
│    → Status berubah: Diajukan                                │
├─────────────────────────────────────────────────────────────┤
│ 4. Manager klik "Setujui"                                    │
│    → Status berubah: Disetujui                               │
│    → PO dikirim ke supplier                                  │
├─────────────────────────────────────────────────────────────┤
│ 5. Barang diterima di gudang                                 │
│    → Staff Gudang catat transaksi "Pemasukan"                │
│    → Stok bertambah 250 unit                                 │
│    → Status di Dashboard kembali "Aman"                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Tips & Best Practice

| Praktik | Keterangan |
|---------|------------|
| **Update demand secara rutin** | Catat demand bulanan agar tren di dashboard akurat |
| **Review parameter EOQ berkala** | Biaya pemesanan dan penyimpanan bisa berubah, update parameter minimal 3 bulan sekali |
| **Set stok minimum dengan tepat** | Stok minimum yang terlalu rendah berisiko kehabisan, terlalu tinggi meningkatkan biaya simpan |
| **Gunakan notifikasi** | Cek notifikasi setiap hari untuk mengetahui stok yang perlu reorder |
| **Stock opname rutin** | Lakukan penyesuaian stok secara berkala untuk memastikan data akurat |
