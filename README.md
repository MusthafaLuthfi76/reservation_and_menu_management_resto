# 月 Tsuki — Restaurant Reservation & Menu Management

Sistem reservasi & manajemen menu untuk restoran Jepang. Customer scan QR code di meja → buka menu → order → bayar (cashier / QRIS mock). Admin/staff kelola menu, meja, dan reservasi via dashboard.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, React Router 7, Tailwind CSS, shadcn/ui, axios, sonner, qrcode.react |
| **Backend** | Node.js + Express.js, JWT auth (jsonwebtoken + bcryptjs) |
| **Database** | MongoDB (native `mongodb` driver) |
| **Bahasa UI** | English |
| **Currency** | JPY (¥) |

---

## Fitur Utama

- 🔐 **Admin login** dengan JWT (auto-seed admin user di first run)
- 🍣 **Menu management** — CRUD menu dengan kategori (appetizer, main, dessert, drinks), harga JPY, image, status available
- 🪑 **Table management** — generate QR code per meja, downloadable PNG
- 📋 **Reservations dashboard** — daftar order aktif, stats revenue, detail & mark-as-paid
- 📱 **Customer flow** (no auth) — scan QR → menu → cart → checkout → tambah pesanan → bayar
- 💴 **Payment** — Pay at Cashier atau QRIS (mock simulation)
- 📱 **Fully responsive** — HP & desktop

---

## Prerequisites

Pastikan tools berikut sudah ter-install di laptop kamu:

| Tool | Versi | Cek dengan |
|---|---|---|
| **Node.js** | v18+ | `node --version` |
| **Yarn** | latest | `yarn --version` |
| **Git** | latest | `git --version` |
| **MongoDB Community Server** | v6+ | `mongosh --version` |

### Cara Install MongoDB Community Server

> ⚠️ **MongoDB Compass saja tidak cukup.** Compass cuma GUI client. Kamu wajib install **Community Server** yang menjalankan database engine-nya di `localhost:27017`.

**Windows:**
1. Download dari [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community) (pilih MSI installer)
2. Run installer → pilih **"Complete"** → centang **"Install MongoDB as a Service"** (biar auto-start)
3. Verifikasi: buka Command Prompt, ketik `mongosh` → harusnya masuk shell MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**(Opsional)** Install **MongoDB Compass** dari [mongodb.com/products/compass](https://www.mongodb.com/products/compass) untuk GUI database viewer.

---

## Setup

### 1. Clone Repository

```bash
git clone https://github.com/MusthafaLuthfi76/reservation_and_menu_management_resto.git
cd reservation_and_menu_management_resto
```

### 2. Setup Backend

```bash
cd backend
```

Buat file `.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=restaurant_jp_db
JWT_SECRET=supersecret123
ADMIN_EMAIL=admin@restaurant.jp
ADMIN_PASSWORD=admin123
CORS_ORIGINS=http://localhost:3000
```

Install dependencies:

```bash
yarn install
```

### 3. Setup Frontend

Buka terminal baru, lalu:

```bash
cd frontend
```

Buat file `.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

Install dependencies:

``` npm install xlsx-js-style --legacy-peer-deps
```bash
yarn install
```

---

## Jalankan Aplikasi

Butuh **2 terminal** dibuka bersamaan.

### Terminal 1 — Backend

```bash
cd backend
node server.js
```

Output yang diharapkan:
```
Connected to MongoDB restaurant_jp_db
Seeded admin user admin@restaurant.jp
Seeded sample menu items
Seeded sample tables
Tsuki API listening on http://0.0.0.0:8001
```

> 💡 **Tips dev**: pakai `nodemon` untuk auto-reload saat file berubah:
> ```bash
> npm install -g nodemon
> nodemon server.js
> ```

### Terminal 2 — Frontend

```bash
cd frontend
yarn start
```

Browser akan otomatis buka di **http://localhost:3000**.

---

## Akses Aplikasi

### Admin Panel
- URL: **http://localhost:3000/admin/login**
- Email: `admin@restaurant.jp`
- Password: `admin123`

Setelah login, kamu masuk ke:
- `/admin` — Reservations dashboard
- `/admin/menu` — Menu management
- `/admin/tables` — Tables & QR code generator

### Customer Menu (no auth)
- URL: **http://localhost:3000/menu?table=1** (ganti `1` dengan nomor meja)
- Atau scan QR code yang di-generate dari halaman Tables di admin panel

---

## Data Awal (Auto-Seed)

Saat backend pertama kali start dengan database kosong, otomatis dibuat:

- ✅ **1 admin user** (sesuai `ADMIN_EMAIL` & `ADMIN_PASSWORD` di `.env`)
- ✅ **7 sample menu items** — Edamame, Salmon Sashimi, Tonkotsu Ramen, Chirashi Don, Matcha Warabimochi, Hojicha Latte, Sapporo Draft
- ✅ **6 sample tables** — Table 1–6

---

## Struktur Folder

```
reservation_and_menu_management_resto/
├── backend/
│   ├── server.js              # Express.js + semua endpoint /api
│   ├── package.json
│   ├── .env                   # (kamu buat sendiri, tidak ter-commit)
│   └── _python_backup/        # Sisa FastAPI lama (boleh dihapus)
├── frontend/
│   ├── src/
│   │   ├── App.js             # Routes utama
│   │   ├── pages/             # Login, Reservations, MenuManagement, TableManagement, CustomerMenu, AdminLayout
│   │   ├── components/ui/     # shadcn/ui components
│   │   ├── contexts/          # AuthContext.js
│   │   └── lib/api.js         # axios instance + formatJPY helper
│   ├── package.json
│   └── .env                   # (kamu buat sendiri)
└── README.md
```

---

## API Endpoints

Semua endpoint di-prefix dengan `/api`. Auth pakai header `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login admin, return access_token |
| GET | `/api/auth/me` | ✅ | Get current user |

### Menu
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/menu` | ❌ | List semua menu |
| POST | `/api/menu` | ✅ | Tambah menu |
| PUT | `/api/menu/:id` | ✅ | Update menu |
| DELETE | `/api/menu/:id` | ✅ | Hapus menu |

### Tables
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| GET | `/api/tables` | ✅ | List meja |
| POST | `/api/tables` | ✅ | Tambah meja |
| DELETE | `/api/tables/:id` | ✅ | Hapus meja |

### Orders
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/orders` | ❌ | Buat order baru (status: ordered) |
| GET | `/api/orders/active?table_number=N` | ❌ | Get order aktif untuk meja N |
| POST | `/api/orders/:id/items` | ❌ | Tambah item ke order existing |
| POST | `/api/orders/:id/pay` | ❌ | Bayar order (`payment_method`: `cashier` / `qris`) |
| GET | `/api/orders` | ✅ | List semua order (filter `?status=`) |
| GET | `/api/orders/:id` | ❌ | Detail order |

---

## Lihat Data di Database

### Via Terminal (mongosh)
```bash
mongosh
use restaurant_jp_db
show collections
db.menu_items.find().pretty()
db.orders.find({ status: "ordered" }).pretty()
db.users.find().pretty()
```

### Via MongoDB Compass (GUI)
1. Buka Compass
2. Connection string: `mongodb://localhost:27017`
3. Klik database `restaurant_jp_db`
4. Browse collection: `users`, `menu_items`, `tables`, `orders`

---

## Reset Database

Kalau mau hapus semua data dan re-seed dari awal:

```bash
mongosh
use restaurant_jp_db
db.dropDatabase()
```

Lalu restart backend (`node server.js`) → auto re-seed admin + sample data.

---

## Troubleshooting

| Masalah | Penyebab & Solusi |
|---|---|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB server belum jalan. **Windows**: cek Services → "MongoDB Server" status Running. **macOS**: `brew services list`. **Linux**: `sudo systemctl status mongod`. |
| Port 8001 already in use | Ada proses lain pakai port itu. Matikan, atau ubah `const PORT = 8001` di `backend/server.js` jadi port lain & update `REACT_APP_BACKEND_URL` di frontend. |
| Frontend error "Network Error" / CORS | Cek `REACT_APP_BACKEND_URL` di frontend `.env` & `CORS_ORIGINS` di backend `.env` sudah pas. Restart kedua server setelah ubah `.env`. |
| Login gagal "Invalid email or password" | Pastikan `ADMIN_EMAIL` & `ADMIN_PASSWORD` di `.env` cocok dengan yang kamu input. Atau drop database & restart backend supaya re-seed. |
| `mongosh: command not found` | MongoDB Community Server belum ter-install. Compass saja tidak cukup. |
| QR code di Tables page tidak muncul | Hard refresh browser (Ctrl+Shift+R). Pastikan `qrcode.react` ter-install (`yarn install` di frontend). |

---

## Workflow Development

1. Edit code di `backend/server.js` atau `frontend/src/**/*.{js,jsx}`
2. Frontend punya hot-reload (langsung refresh)
3. Backend pakai `nodemon` untuk auto-restart, atau manual restart `node server.js`

---

## Build untuk Production

### Frontend
```bash
cd frontend
yarn build
```
Output ada di `frontend/build/` — serve dengan nginx / Apache / Vercel / Netlify.

### Backend
Backend Express bisa di-deploy ke:
- VPS biasa (PM2 + nginx reverse proxy)
- Railway / Render / Fly.io (Node.js hosting)
- Atau pakai Docker (perlu setup sendiri)

Pastikan environment variables production di-set di hosting provider, bukan committed ke repo.

---

## 🛠️ Maintenance Guide

Bagian ini menjelaskan **dimana harus ngedit kalau mau ubah fungsi atau tampilan**. Disusun supaya kamu tidak perlu baca seluruh codebase tiap kali mau ubah satu hal kecil.

### 📍 Code Map — File Mana untuk Apa

#### Backend (`backend/server.js`)

Semua backend hanya satu file `server.js`. Pakai search (Ctrl+F) untuk lompat ke section:

| Section di `server.js` | Cari keyword | Tugasnya |
|---|---|---|
| Config & ENV | `JWT_SECRET`, `MONGO_URL` | Load environment variables, validasi |
| Helper functions | `hashPassword`, `createAccessToken`, `requireAuth` | Bcrypt, JWT sign/verify, auth middleware |
| Auth routes | `/auth/login`, `/auth/me` | Login & current user |
| Menu routes | `api.get("/menu"`, `api.post("/menu"` | CRUD menu items |
| Tables routes | `api.get("/tables"` | CRUD meja |
| Orders routes | `api.post("/orders"`, `/orders/:id/pay` | Lifecycle order: buat, tambah item, bayar |
| Seed function | `async function seed()` | Data awal: admin user, sample menu, sample tables |
| Bootstrap | `async function main()` | Connect Mongo + start Express |

#### Frontend (`frontend/src/`)

| File | Tugasnya |
|---|---|
| `App.js` | **Routing utama** — semua URL aplikasi didefinisikan di sini |
| `index.css` | **Global styles** — font, color CSS variables, utility classes (`.btn-aka`, `.label-eyebrow`, dll) |
| `lib/api.js` | **Axios instance** + helper `formatJPY()` untuk format currency |
| `contexts/AuthContext.js` | State login/logout + token management |
| `components/ProtectedRoute.jsx` | Wrapper untuk route yang butuh login |
| `components/ui/` | shadcn/ui components (Button, Dialog, Input, dll) — **jangan edit langsung**, override via className |
| `pages/Login.jsx` | Halaman login admin |
| `pages/AdminLayout.jsx` | Layout admin: sidebar + topbar mobile |
| `pages/Reservations.jsx` | Dashboard order/reservations |
| `pages/MenuManagement.jsx` | CRUD menu (table desktop + card mobile) |
| `pages/TableManagement.jsx` | CRUD meja + QR generator |
| `pages/CustomerMenu.jsx` | Halaman customer (scan QR → menu → cart → checkout → bayar) |

---

### 📚 Cookbook — Resep Perubahan Umum

#### 1. Ubah Warna Theme / Branding

📁 `frontend/src/index.css` (bagian `:root { ... }` paling atas)

```css
:root {
  --aka: #C93A3E;          /* Merah utama (tombol primary) */
  --aka-hover: #A32A2D;    /* Merah hover */
  --bg-base: #F9F8F6;      /* Background utama */
  --text-primary: #1C1C1C; /* Teks utama */
  --koge: #2E2520;         /* Sidebar admin (coklat tua) */
  /* ... dll ... */
}
```

Ubah hex code → seluruh app otomatis pakai warna baru.

#### 2. Ubah Font

📁 `frontend/src/index.css` (bagian `@import url(...)` paling atas)

```css
@import url('https://fonts.googleapis.com/css2?family=YOUR_FONT&display=swap');
```

Lalu di body / utility class:
```css
body { font-family: 'YOUR_FONT', sans-serif; }
.font-serif-jp { font-family: 'YOUR_SERIF', serif; }
```

#### 3. Ganti Currency dari JPY ke USD/EUR/IDR

📁 `frontend/src/lib/api.js` (function `formatJPY`)

```js
// Sebelum:
export const formatJPY = (n) =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(n || 0);

// Sesudah (contoh USD):
export const formatJPY = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);
```

> 💡 Atau rename function jadi `formatPrice` biar lebih netral. Update import di pages yang pakai.

#### 4. Tambah Kategori Menu Baru (Misal: "Side Dish")

📁 `frontend/src/pages/MenuManagement.jsx` (constant `CATEGORIES`)
📁 `frontend/src/pages/CustomerMenu.jsx` (constant `CATEGORIES`)

```js
const CATEGORIES = [
  { value: "appetizer", label: "Appetizer" },
  { value: "side", label: "Side Dish" },  // ← tambahkan
  { value: "main", label: "Main Course" },
  // ...
];
```

> ⚠️ Update di **kedua file**.

#### 5. Tambah Field Baru di Menu Item (Misal: "allergens")

**Backend** — `backend/server.js`:
- Helper `menuInputOk` → tambah validasi
- Route `POST /menu` & `PUT /menu/:id` → tambah field di object yang di-insert/update
- Sample data di `seed()` → tambah field di samples

**Frontend** — `frontend/src/pages/MenuManagement.jsx`:
- Constant `emptyForm` → tambah `allergens: ""`
- Dialog form → tambah `<Input>` untuk allergens
- Function `openEdit` → set value dari item

**Customer view** — `frontend/src/pages/CustomerMenu.jsx`:
- Render `item.allergens` di card menu

#### 6. Ubah Default Admin Credentials

📁 `backend/.env`

```env
ADMIN_EMAIL=your-email@domain.com
ADMIN_PASSWORD=your-new-password
```

Lalu **drop database** untuk re-seed dengan credentials baru:
```bash
mongosh
use restaurant_jp_db
db.users.deleteMany({})
```

Restart backend → admin baru otomatis ke-create.

#### 7. Ubah Sample Data Awal (Menu / Tables)

📁 `backend/server.js` (function `seed()`)

```js
const samples = [
  { name: "Edamame", description: "...", price: 480, category: "appetizer",
    image_url: "https://..." },
  // ↑ ubah/hapus/tambah di sini
];
```

Untuk jumlah meja:
```js
for (let n = 1; n <= 6; n++) {  // ← ganti 6 ke jumlah meja yg kamu mau
  await db.collection("tables").insertOne({ ... });
}
```

#### 8. Ubah Durasi JWT Token

📁 `backend/server.js` (function `createAccessToken`)

```js
jwt.sign(
  { sub: userId, email, type: "access" },
  JWT_SECRET,
  { algorithm: JWT_ALGORITHM, expiresIn: "12h" }  // ← ubah ini (e.g., "1d", "30m", "7d")
);
```

#### 9. Tambah Endpoint API Baru

📁 `backend/server.js`

```js
api.get("/stats", requireAuth, asyncH(async (req, res) => {
  const totalRevenue = await db.collection("orders")
    .aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]).toArray();
  res.json({ revenue: totalRevenue[0]?.total || 0 });
}));
```

> Pakai `requireAuth` middleware kalau butuh login. Pakai `asyncH(...)` wrapper supaya error otomatis ke-catch.

Di frontend, panggil:
```js
import api from "../lib/api";
const { data } = await api.get("/stats");
```

#### 10. Tambah Halaman Admin Baru

**Step 1** — Buat file `frontend/src/pages/MyNewPage.jsx`:
```jsx
export default function MyNewPage() {
  return <div className="p-4 md:p-8 lg:p-12">My New Page</div>;
}
```

**Step 2** — Register di `frontend/src/App.js`:
```jsx
import MyNewPage from "./pages/MyNewPage";
// ...
<Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
  <Route index element={<Reservations />} />
  <Route path="menu" element={<MenuManagement />} />
  <Route path="tables" element={<TableManagement />} />
  <Route path="my-page" element={<MyNewPage />} />   {/* ← tambah */}
</Route>
```

**Step 3** — Tambah link sidebar di `frontend/src/pages/AdminLayout.jsx`:
```jsx
const navItems = [
  { to: "/admin", label: "Reservations", icon: ScrollText, end: true, testId: "nav-reservations" },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed, testId: "nav-menu" },
  { to: "/admin/tables", label: "Tables · QR", icon: QrCode, testId: "nav-tables" },
  { to: "/admin/my-page", label: "My Page", icon: Settings, testId: "nav-my-page" },  // ← tambah
];
```

#### 11. Ubah Logo / Nama Brand "Tsuki"

Cari `Tsuki` di seluruh project:
```bash
grep -r "Tsuki" frontend/src/
```

Lokasi utama:
- `frontend/src/pages/AdminLayout.jsx` — sidebar header "月 Tsuki"
- `frontend/src/pages/Login.jsx` — hero text "TSUKI RESTAURANT"
- `frontend/src/pages/CustomerMenu.jsx` — hero "月 · Tsuki Restaurant" & "Welcome" fallback
- `frontend/public/index.html` — `<title>` tag (kalau perlu ubah judul tab browser)

#### 12. Ubah Gambar Hero / Background Login

📁 `frontend/src/pages/Login.jsx` — cari `backgroundImage:` → ganti URL
📁 `frontend/src/pages/CustomerMenu.jsx` — cari `<img src="https://images.unsplash..."` di Hero section → ganti URL

> 💡 Pakai Unsplash search atau upload gambar sendiri ke object storage / CDN.

#### 13. Ubah Teks Halaman (Copywriting)

Semua teks ada di JSX file. Contoh untuk ubah judul "Reservations" di dashboard:

📁 `frontend/src/pages/Reservations.jsx`:
```jsx
<h1 className="font-serif-jp text-3xl md:text-4xl lg:text-5xl">Reservations</h1>
//                                                              ↑ ganti di sini
```

#### 14. Ubah Status Order (Tambah Status Baru selain "ordered" / "paid")

Misal mau tambah status "preparing", "served":

**Backend** — `backend/server.js`:
- Logic di `POST /orders/:id/pay` → kondisi & nilai status
- Mungkin tambah endpoint `POST /orders/:id/status` baru

**Frontend** — `frontend/src/pages/Reservations.jsx`:
- Component `StatusBadge` → tambah case warna baru
- Filter buttons → tambah opsi filter

#### 15. Hapus Demo Credentials di Login Form

📁 `frontend/src/pages/Login.jsx`

```jsx
// Hapus baris ini:
<p className="text-xs text-[#8A817C]">
  Demo: admin@restaurant.jp · admin123
</p>

// Dan ubah default state (biar form kosong):
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
```

---

### 🧩 Tips Maintenance

| Tips | Detail |
|---|---|
| **Hot reload aktif** | Edit file → save → langsung refresh otomatis di browser (frontend) atau pakai nodemon (backend) |
| **Pakai search dulu sebelum scroll** | Ctrl+F dengan keyword unik (misal `data-testid="menu-add-button"`) lebih cepat daripada scroll |
| **`data-testid` jaga identitas elemen** | Setiap tombol/input penting punya `data-testid` unik. Berguna untuk testing & debugging. Pertahankan saat refactor |
| **Jangan edit `components/ui/`** | File shadcn jangan diubah. Override styling lewat className di tempat pakainya |
| **Cek browser console** | Error frontend muncul di DevTools (F12) → Console tab. Network tab untuk lihat request/response API |
| **Cek backend log** | Error backend muncul di terminal yang jalanin `node server.js` |
| **MongoDB Compass untuk debug data** | Lebih cepat lihat struktur data via GUI daripada query manual |
| **Backup `.env` di tempat aman** | Jangan commit `.env` ke git. Simpan terpisah (password manager, dll) |

---

### 🐛 Debugging Workflow

Misal ada bug: "Tombol Place Order tidak respond"

1. **Buka DevTools (F12) → Console**
   - Lihat ada error JS? → biasanya error import / typo
2. **DevTools → Network tab → klik tombol lagi**
   - Apakah request `POST /api/orders` muncul?
   - Lihat status code: 200/400/500?
   - Lihat response body untuk error detail
3. **Cek backend terminal**
   - Apakah ada error log?
   - Apakah request masuk sama sekali?
4. **Cek source code**
   - Frontend handler `submitOrder` di `CustomerMenu.jsx`
   - Backend endpoint `POST /orders` di `server.js`
5. **Cek database (Compass)**
   - Apakah order tersimpan tapi UI gagal update?

---

## Lisensi

Private project — All rights reserved © 2026 Musthafa Luthfi.
