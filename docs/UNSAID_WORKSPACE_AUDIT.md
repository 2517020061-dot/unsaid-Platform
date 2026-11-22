# UNSAID — Workspace Audit Report

**Status Dokumen:** Task 001 — Workspace Audit  
**Lokasi Workspace:** `/app/applet`  
**Tanggal Audit:** 2026-11-22

---

## 1. Kondisi Workspace Saat Ini

Workspace saat ini masih berupa **template awal kosong berbasis Vite + React + TypeScript** (`"name": "react-example"`), **bukan** proyek Astro. Belum terdapat satu pun implementasi fitur UNSAID, skema database Supabase, migrasi SQL, autentikasi Passkey, maupun konfigurasi SSR.

### Ringkasan Lingkungan Runtime
- **Node.js:** `v22.23.2`
- **npm:** `10.9.8`
- **Bun:** `1.4.4` (tersedia `bun.lock` di root)
- **Git:** `2.34.1` (terpasang di sistem, namun workspace belum menjadi repository Git)

### Status Environment & Kredensial
- **`.env.example`:** Ada. Berisi placeholder variabel `GEMINI_API_KEY` dan `APP_URL` (tanpa nilai rahasia).
- **`.env`, `.env.local`, `.env.development`, `.env.production`:** **Tidak ditemukan** di workspace.
- **Kredensial Supabase:** Belum ada `SUPABASE_URL`, `SUPABASE_ANON_KEY`, maupun `SUPABASE_SERVICE_ROLE_KEY` yang terkonfigurasi.
- **`.gitignore`:** Sudah mengecualikan `.env*` dengan pengecualian `!.env.example`, serta mengecualikan `node_modules/`, `build/`, `dist/`, `coverage/`, `.DS_Store`, dan `*.log`.

### Status Integrasi Git & GitHub
- **Status `.git`:** Direktori `.git` **tidak ditemukan** (`fatal: not a git repository`).
- **Branch `ai-studio-dev` & `main`:** **Belum tersedia** di workspace lokal karena Git belum diinisialisasi dan tidak ada remote repository GitHub yang terhubung.
- **Tindakan Git pada Task 001:** Sesuai aturan workflow Task 001 (*"Jika belum tersedia, laporkan sebelum membuat branch baru"*), **belum dilakukan** `git init`, pembuatan branch baru, maupun commit.

---

## 2. Struktur Proyek Saat Ini

Seluruh file dan direktori yang ada sebelum penambahan dokumen Task 001:

```text
/
├── .env.example          # Template variabel lingkungan (GEMINI_API_KEY, APP_URL)
├── .gitignore            # Aturan pengecualian Git (.env*, node_modules, dist, dll.)
├── bun.lock              # Lockfile Bun (69.4 KB)
├── index.html            # Entry HTML Vite SPA (masih placeholder "My Google AI Studio App")
├── metadata.json         # Metadata AI Studio applet (name & description masih kosong)
├── package.json          # Manifes paket ("react-example", Vite + React 19 + Express)
├── tsconfig.json         # Konfigurasi TypeScript (JSX react-jsx, path alias @/*)
├── vite.config.ts        # Konfigurasi Vite (React plugin, Tailwind v4 plugin, asset copy)
├── node_modules/         # Dependensi terpasang
└── src/
    ├── App.tsx           # Komponen placeholder kosong (<div></div>)
    ├── index.css         # Hanya berisi `@import "tailwindcss";`
    └── main.tsx          # Mount React 19 SPA (`createRoot`)
```

---

## 3. Framework, Package Manager, Dependencies & Scripts

### Framework & Package Manager
- **Framework aktif:** **Vite + React 19** (Client-Side SPA). **Bukan Astro.**
- **Express terpasang di dependencies (`express: ^4.21.2`):** Tercantum di `package.json`, namun **belum ada** file `server.ts` atau `server.js` di workspace.
- **Package manager:** Lockfile menggunakan **`bun.lock`**, sementara `npm` (`10.9.8`) dan `bun` (`1.4.4`) sama-sama tersedia di container.

### Scripts (`package.json`)
| Script | Perintah | Catatan |
| :--- | :--- | :--- |
| `dev` | `vite --port=3000 --host=0.0.0.0` | Berjalan di port `3000` (syarat preview runtime AI Studio). |
| `build` | `vite build` | Membangun bundle SPA ke `dist/`. |
| `preview` | `vite preview` | Preview hasil build statis Vite. |
| `clean` | `rm -rf dist server.js` | Membersihkan artefak build. |
| `lint` | `tsc --noEmit` | Hanya type-check TypeScript; belum ada ESLint. |

### Dependencies Terpasang
- **Runtime:**
  - `react` (`^19.0.1`), `react-dom` (`^19.0.1`)
  - `vite` (`^8.3.0`), `@vitejs/plugin-react` (`^6.1.1`)
  - `@tailwindcss/vite` (`^4.3.3`)
  - `express` (`^4.21.2`), `dotenv` (`^17.2.3`)
  - `@google/genai` (`^2.4.0`) — bawaan template AI Studio (tidak diperlukan untuk core UNSAID MVP)
  - `lucide-react` (`^0.546.0`), `motion` (`^12.23.24`)
- **DevDependencies:**
  - `typescript` (`^7.0.2`), `tsx` (`^4.21.0`), `esbuild` (`^0.25.0`)
  - `tailwindcss` (`^4.3.3`), `autoprefixer` (`^10.4.21`)
  - `@types/node` (`^22.14.0`), `@types/react` (`^19.3.0`), `@types/react-dom` (`^19.3.0`), `@types/express` (`^4.17.21`)

### Dependensi Target UNSAID yang Belum Ada
- **Framework & SSR:** `astro`, `@astrojs/react`, `@astrojs/node` (atau adapter SSR pilihan).
- **Backend & Validasi:** `@supabase/supabase-js` (`>= 2.105.0` wajib untuk dukungan Beta Passkeys), `@supabase/ssr`, `zod`, sanitizer Markdown/HTML (`remark`/`rehype` + `sanitize-html` atau `isomorphic-dompurify`).
- **Testing:** `vitest`, `@playwright/test` (catatan: container sudah memiliki `playwright-cli` & headless Chromium, namun package test proyek belum terpasang).

---

## 4. Identifikasi Kode & Konfigurasi yang Tersedia

1. **`vite.config.ts`:**
   - Mengaktifkan `@vitejs/plugin-react`, `@tailwindcss/vite`, serta plugin khusus `copy-unbundled-src-assets` untuk build produksi.
   - Menonaktifkan HMR saat `DISABLE_HMR === 'true'` (kebutuhan khusus lingkungan preview AI Studio).
2. **`index.html` & `metadata.json`:**
   - Masih memakai nilai default (`"My Google AI Studio App"` dan field `name`/`description` kosong di `metadata.json`).
   - `metadata.json` mencantumkan `"MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"` bawaan template.
3. **`src/index.css`:**
   - Sudah memakai sintaks Tailwind CSS v4 (`@import "tailwindcss";`), selaras dengan strategi styling modern tanpa CSS terpisah yang berlebihan.
4. **`src/App.tsx` & `src/main.tsx`:**
   - Hanya stub kosong; belum ada routing, layout, komponen, maupun state management.

---

## 5. Temuan Risiko

### Risiko Tinggi
1. **Kesenjangan Framework (Vite SPA vs. Astro SSR):**
   Workspace saat ini dikonfigurasi untuk Vite SPA di port `3000`. Mengganti ke **Astro SSR** (`astro` + `@astrojs/node` + `@astrojs/react`) mengharuskan perubahan skrip `dev`/`build`/`start`, `tsconfig.json`, entry point, dan konfigurasi adapter agar tetap melayani port `3000` dengan mulus di preview AI Studio.
2. **Ketidakcocokan Versi Dependencies Template (`typescript ^7.0.2` & `vite ^8.3.0`):**
   Versi `typescript: ^7.0.2` dan `vite: ^8.3.0` pada template dapat memicu konflik peer dependency saat menginstal ekosistem Astro (`astro`, `@astrojs/react`, `@astrojs/node`) atau Vitest. Perlu verifikasi kompatibilitas sebelum migrasi stack.
3. **Ketiadaan Repository Git & Branch `ai-studio-dev`:**
   Tanpa `.git` dan remote GitHub yang terhubung, workflow branching (`ai-studio-dev` vs `main`) belum dapat dijalankan secara otomatis hingga repository diinisialisasi atau dihubungkan ke remote target.
4. **Pengujian WebAuthn/Passkeys di Lingkungan Preview & Iframe:**
   AI Studio Preview berjalan di domain cloud run/iframe tertentu. WebAuthn (`navigator.credentials`) sensitif terhadap Relying Party ID (RP ID), RP Origin, dan kebijakan `Permissions-Policy` iframe lintas-origin. Pengujian Passkey nyata memerlukan domain/origin yang cocok dengan konfigurasi Supabase Auth Dashboard (`Authentication → Passkeys`).

### Risiko Menengah
5. **Dual Package Manager (`bun.lock` vs `npm`):**
   Kehadiran `bun.lock` sementara beberapa tooling menjalankan `npm` berisiko menimbulkan ketidaksinkronan `node_modules` jika tidak menetapkan satu package manager standar untuk proyek.
6. **Risiko Keamanan Jika Langsung Memakai Supabase Client Tanpa BFF:**
   Jika developer langsung mengonsumsi tabel Supabase dari client SPA sebelum lapisan Astro SSR + RLS teruji penuh, field sensitif atau operasi mutasi berisiko terekspos.
7. **Ketidaksinkronan SDK Passkeys Supabase (Beta):**
   Dukungan Passkeys di `@supabase/supabase-js` (`>= 2.105.0`) berstatus **Beta/Experimental** dengan flag `experimental: { passkey: true }`. Tanpa lapisan adapter internal, perubahan API minor upstream dapat berdampak ke banyak komponen UI.

---

## 6. Rekomendasi Langkah Implementasi Selanjutnya

1. **Selesaikan Persetujuan Git & Keputusan Produk (`PENDING_PRODUCT_APPROVAL`):**
   - Konfirmasi apakah Git lokal perlu diinisialisasi dengan branch `main` + `ai-studio-dev` (atau dihubungkan ke remote GitHub tertentu).
   - Finalisasi 5 item `PENDING_PRODUCT_APPROVAL` pada `docs/UNSAID_PRODUCT_DECISIONS.md`.
2. **Task 002 — Stack Migration & Foundation Verification (Usulan):**
   - Verifikasi kompatibilitas instalasi **Astro + `@astrojs/react` + `@astrojs/node` + Tailwind v4** di port `3000` tanpa merusak environment runtime.
   - Siapkan struktur modular monolith (`src/lib/`, `src/pages/`, `src/components/`, `supabase/migrations/`), skrip test (`vitest`), dan `.env.example` yang diperbarui (tanpa secret).
   - Verifikasi langsung tipe TypeScript dan API signature dari `@supabase/supabase-js >= 2.105.0` (`experimental: { passkey: true }`) sebelum menulis UI autentikasi.
