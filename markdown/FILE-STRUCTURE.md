eoq-inventory-system/
├── .env.local                      # Variabel lingkungan (database, auth secret)
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js              # Jika menggunakan Tailwind CSS
├── postcss.config.js
├── prisma/
│   ├── schema.prisma               # Prisma schema dari database PostgreSQL
│   ├── seed.ts                     # Seed data awal (opsional)
│   └── migrations/                 # Folder migrasi Prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (auth provider, sidebar, header)
│   │   ├── page.tsx                # Redirect ke /dashboard
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Halaman utama dashboard (stok, rekomendasi EOQ, grafik)
│   │   ├── products/
│   │   │   ├── page.tsx            # Daftar produk (tabel + search)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Detail produk, edit, hapus
│   │   │   └── new/
│   │   │       └── page.tsx        # Form tambah produk
│   │   ├── categories/
│   │   │   ├── page.tsx            # CRUD kategori
│   │   │   └── [id]/page.tsx
│   │   ├── units/
│   │   │   └── page.tsx            # CRUD satuan
│   │   ├── suppliers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── eoq/
│   │   │   ├── parameters/
│   │   │   │   ├── page.tsx        # Daftar parameter EOQ per produk
│   │   │   │   └── [productId]/
│   │   │   │       └── page.tsx    # Form input/edit parameter EOQ
│   │   │   └── calculations/
│   │   │       └── page.tsx        # Histori perhitungan EOQ
│   │   ├── purchase-orders/
│   │   │   ├── page.tsx            # Daftar PO (filter status)
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Detail PO, approval, penerimaan barang
│   │   │   └── new/
│   │   │       └── page.tsx        # Form buat PO (pilih produk, qty dari EOQ)
│   │   ├── stock/
│   │   │   ├── page.tsx            # Stok terkini (v_stock_overview)
│   │   │   └── transactions/
│   │   │       └── page.tsx        # Log transaksi stok
│   │   ├── demand-history/
│   │   │   └── page.tsx            # Input demand bulanan, tampilkan summary
│   │   ├── users/
│   │   │   └── page.tsx            # Manajemen user (admin only)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.ts        # NextAuth.js konfigurasi
│   │   │   ├── products/
│   │   │   │   ├── route.ts        # GET (list), POST (create)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # GET, PUT, DELETE
│   │   │   ├── categories/
│   │   │   │   └── route.ts
│   │   │   ├── units/
│   │   │   │   └── route.ts
│   │   │   ├── suppliers/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/route.ts
│   │   │   ├── eoq/
│   │   │   │   ├── parameters/
│   │   │   │   │   ├── route.ts    # GET, POST
│   │   │   │   │   └── [productId]/
│   │   │   │   │       └── route.ts # PUT (update parameter)
│   │   │   │   └── calculate/
│   │   │   │       └── route.ts    # POST panggil sp_calculate_eoq
│   │   │   ├── purchase-orders/
│   │   │   │   ├── route.ts        # GET, POST
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts    # GET, PUT (update status)
│   │   │   │       └── receive/
│   │   │   │           └── route.ts # POST untuk penerimaan barang (update stok)
│   │   │   ├── stock/
│   │   │   │   ├── route.ts        # GET current stock
│   │   │   │   └── transactions/
│   │   │   │       └── route.ts    # POST untuk transaksi manual (keluar/masuk)
│   │   │   ├── demand-history/
│   │   │   │   └── route.ts        # GET, POST, PUT
│   │   │   └── users/
│   │   │       └── route.ts        # CRUD user (admin only)
│   │   ├── login/
│   │   │   └── page.tsx            # Halaman login
│   │   └── (auth)/                 # Group layout untuk halaman auth (opsional)
│   ├── components/
│   │   ├── ui/                     # Komponen shadcn/ui (button, card, table, dialog, form)
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Navbar, user menu
│   │   │   ├── Sidebar.tsx         # Menu navigasi (dynamic based on role)
│   │   │   └── Footer.tsx
│   │   ├── products/
│   │   │   ├── ProductForm.tsx     # Form produk (react-hook-form + zod)
│   │   │   └── ProductTable.tsx    # DataTable untuk produk
│   │   ├── eoq/
│   │   │   ├── EoqParameterForm.tsx
│   │   │   ├── EoqCalculationTable.tsx
│   │   │   └── ReorderRecommendation.tsx  # Menampilkan "PERLU PESAN"
│   │   ├── purchase-orders/
│   │   │   ├── POForm.tsx
│   │   │   ├── POStatusBadge.tsx
│   │   │   └── POItemList.tsx
│   │   ├── stock/
│   │   │   ├── StockCard.tsx       # Kartu stok per produk
│   │   │   └── StockTransactionForm.tsx
│   │   ├── demand/
│   │   │   └── DemandInputForm.tsx
│   │   ├── common/
│   │   │   ├── DataTable.tsx       # Generic table dengan sorting, pagination
│   │   │   ├── SearchBar.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── providers/
│   │       ├── AuthProvider.tsx    # Session provider
│   │       └── QueryProvider.tsx   # React Query provider
│   ├── lib/
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── auth.ts                 # NextAuth options (credential provider)
│   │   ├── utils.ts                # Helper functions (format currency, date)
│   │   └── validations/            # Zod schemas
│   │       ├── product.schema.ts
│   │       ├── eoq.schema.ts
│   │       └── purchase-order.schema.ts
│   ├── hooks/
│   │   ├── useAuth.ts              # useSession wrapper
│   │   ├── useProducts.ts          # useQuery, useMutation untuk produk
│   │   ├── useEoq.ts
│   │   ├── usePurchaseOrders.ts
│   │   └── useStock.ts
│   ├── services/                   # Layer API calls (fetch)
│   │   ├── productService.ts
│   │   ├── eoqService.ts
│   │   ├── purchaseOrderService.ts
│   │   └── stockService.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── product.ts
│   │   ├── eoq.ts
│   │   ├── purchase-order.ts
│   │   └── user.ts
│   └── middleware.ts               # Auth & role-based routing
├── public/
│   ├── favicon.ico
│   └── images/
└── README.md