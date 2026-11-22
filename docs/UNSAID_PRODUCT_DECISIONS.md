# UNSAID — Product Decisions & Alignment Baseline

**Status Dokumen:** Task 001 — Foundation Alignment  
**Tagline:** *Speak freely. Remain unknown.*  
**Bahasa Utama:** Bahasa Indonesia (Pasar Utama: Indonesia)

---

## 1. Visi dan Prinsip Produk

UNSAID adalah platform publikasi digital berbasis privasi untuk pengguna di Indonesia yang ingin menyampaikan puisi, opini, kritik, cerita, pemikiran filosofis, dan keresahan secara bebas tanpa harus membuka identitas asli.

### Prinsip Utama
1. **Kebebasan Berekspresi:** Ruang aman bagi pemikiran independen, kritik konstruktif, dan opini tidak populer.
2. **Privasi dan Anonimitas by Design:** Pemisahan struktural antara identitas publik dan identitas akun internal.
3. **Anti-Vanity Metrics:** Platform tidak dirancang sebagai media sosial konvensional; tidak ada sistem follower, pangkat popularitas, atau personal branding berbasis clout.
4. **Identitas Visual Editorial Minimalis:** Antarmuka minimalis, bersih, elegan, didominasi hitam dan putih dengan aksen halus seperlunya, *typography-led*, banyak ruang kosong (*whitespace*), dan nyaman dibaca di desktop, tablet, maupun mobile.
5. **Moderasi Berbasis Perlindungan Ekspresi:** Moderasi menindak pelanggaran berbahaya (doxxing, ancaman kekerasan, CSAM, spam otomatis), namun **melindungi kritik politik dan opini tidak populer**.

---

## 2. Keputusan yang Sudah Disetujui

### A. Sistem Identitas
- **Mode Publikasi Utama:** **Anonymous** adalah mode default saat menerbitkan tulisan.
- **Dukungan Alias Samaran:** Pengguna dapat memilih menggunakan alias samaran secara opsional.
- **Multi-Alias per Akun:** Satu akun diperbolehkan memiliki beberapa alias berbeda.
- **Pemisahan Persona vs. Akun:** Alias adalah persona publik, bukan identitas akun.
- **Keterputusan Antar-Alias:** Publik tidak boleh mengetahui bahwa beberapa alias dimiliki oleh akun yang sama.
- **Keterputusan Anonymous:** Tulisan berstatus Anonymous tidak boleh terhubung ke alias maupun persona lainnya.
- **Kerahasiaan Akun:** Email dan identitas akun selalu bersifat privat dan tidak pernah ditampilkan ke publik.
- **Tanpa Profil Publik Penulis:** Tidak ada halaman profil publik yang menghubungkan atau mengumpulkan seluruh aktivitas seorang penulis.

### B. Arah Teknis & Keamanan
- **Stack Utama:** Astro + React + TypeScript + Tailwind CSS.
- **Backend Data & Auth:** Supabase (PostgreSQL + Supabase Auth + Edge Functions + Row Level Security).
- **Arsitektur:** Modular monolith (menghindari kompleksitas microservice prematur).
- **Blockchain Non-MVP:** Blockchain tidak menjadi dependensi MVP; integrasi masa depan bersifat *chain-agnostic* (kandidat EVM seperti Base/Ethereum).
- **Pemisahan Kepemilikan di Database & API:** Jangan menaruh identitas pemilik tulisan (`author_user_id` / `owner_user_id`) di tabel publik atau respons API publik.
- **Validasi Server-Side:** Semua operasi sensitif (publikasi, edit, hapus, moderasi, pelaporan, manajemen akun) wajib divalidasi di server.
- **Verifikasi RLS:** Kebijakan Row Level Security (RLS) wajib diuji secara aktif (termasuk query langsung ke PostgREST), bukan sekadar diaktifkan.
- **Keamanan Secret:** `SUPABASE_SERVICE_ROLE_KEY` dan kredensial privat lainnya tidak boleh pernah masuk ke kode frontend maupun repository Git.

---

## 3. Persyaratan Anonimitas dan Alias

| Aspek | Persyaratan Wajib |
| :--- | :--- |
| **Mode Default** | Setiap tulisan baru di editor otomatis berada pada mode `Anonymous` (`Anonim`). |
| **Isolasi Data Publik** | Tabel/view publik dan API publik (`GET /feed`, `GET /posts/:id`, `GET /search`) tidak boleh memiliki atau mengembalikan kolom `owner_user_id`, `email`, metadata autentikasi, atau IP address. |
| **Isolasi Antar-Tulisan Anonymous** | Dua tulisan `Anonymous` dari akun yang sama tidak boleh memiliki token korelasi publik (tidak ada `public_author_id` atau hash deterministik dari `user_id`). |
| **Isolasi Multi-Alias** | Satu akun dapat memiliki > 1 alias tanpa ada tautan publik di database, URL, maupun respons API yang menunjukkan alias A dan alias B berasal dari akun yang sama. |
| **Isolasi Alias ke Anonymous** | Tulisan di bawah Alias X tidak boleh pernah dapat ditelusuri atau dihubungkan ke tulisan `Anonymous` milik akun yang sama. |
| **Edukasi Penulis** | UI wajib menjelaskan dengan jelas sebelum publikasi bahwa pemakaian ulang alias yang sama memungkinkan pembaca mengenali keterkaitan antar-tulisan di bawah alias tersebut, sementara identitas akun tetap tersembunyi. |
| **Kepemilikan Internal** | Kepemilikan internal dipertahankan secara privat untuk keperluan edit, hapus, pencegahan penyalahgunaan, dan penghapusan akun—terpisah total dari lapisan baca publik. |

---

## 4. Keputusan yang Masih Pending (`PENDING_PRODUCT_APPROVAL`)

Daftar berikut belum diputuskan secara final dan memerlukan keputusan Founder sebelum implementasi skema database serta alur autentikasi dimulai:

1. **`PENDING_PRODUCT_APPROVAL — Kebijakan Kepemilikan & Keunikan Alias`**
   - *Pertanyaan:* Apakah alias harus diklaim secara privat dan unik secara global (mencegah pengguna lain meniru/mengaku sebagai alias tertentu), atau bebas diisi tanpa klaim global?
   - *Opsi & Implikasi:* Klaim privat mencegah impersonasi namun memerlukan pencatatan pemetaan privat `(alias_id -> owner_user_id)` serta aturan apakah alias dilepas atau dipensiunkan saat akun dihapus.

2. **`PENDING_PRODUCT_APPROVAL — Kebijakan Penghapusan Akun dan Tulisan`**
   - *Pertanyaan:* Ketika pengguna menghapus akun, apakah seluruh tulisan terbit ikut dihapus permanen (*hard delete*), atau tulisan tetap ada sebagai arsip `Anonim` yang terputus dari akun (*orphaned*)?
   - *Opsi & Implikasi:* Penghapusan penuh paling selaras dengan hak penghapusan data (UU PDP) dan kontrol penulis, sedangkan retensi terputus menjaga arsip diskusi publik namun menghilangkan kendali hapus penulis di masa depan.

3. **`PENDING_PRODUCT_APPROVAL — Aturan Autentikasi Komentar & Reaksi serta Identitas Komentar`**
   - *Pertanyaan:* (a) Apakah komentar dan reaksi wajib login atau boleh oleh pengunjung tanpa akun? (b) Apakah komentar selalu `Anonymous` saja atau juga mendukung mode `Alias`?
   - *Opsi & Implikasi:* Wajib login menekan spam, manipulasi reaksi, dan *brigading* sementara tampilan publik tetap `Anonim`; tanpa login menurunkan friksi tetapi membutuhkan proteksi anti-bot/rate-limit yang jauh lebih ketat.

4. **`PENDING_PRODUCT_APPROVAL — Kebijakan Email OTP Setelah Passkey Terdaftar`**
   - *Pertanyaan:* Setelah pengguna mendaftarkan Passkey, apakah login/pemulihan via Email OTP tetap aktif secara permanen (untuk kasus perangkat hilang atau browser in-app yang tidak mendukung WebAuthn), atau pengguna boleh memilih mode *Passkey-Only*?
   - *Opsi & Implikasi:* Email OTP permanen mencegah pengguna terkunci permanen (*lockout*), tetapi keamanan akun menjadi bergantung pada keamanan email pengguna.

5. **`PENDING_PRODUCT_APPROVAL — Kesiapan Kredensial dan Proyek Supabase`**
   - *Pertanyaan:* Apakah proyek Supabase (cloud atau self-hosted), region database, serta konfigurasi domain Relying Party (RP ID & RP Origins) untuk Passkeys sudah tersedia untuk pengembangan dan pengujian?

---

## 5. Batasan MVP

### Masuk Lingkup MVP
- Halaman publik: Landing/Feed Publik, Jelajah, Kategori, Pencarian, Detail Tulisan, Tulisan Terkait (berdasarkan topik/kategori, bukan penulis), Komentar Anonim, Reaksi, Pelaporan.
- Pengalaman menulis: Editor bebas distraksi, simpan draf, pratinjau, hitung karakter, validasi input, pemilihan `Anonymous` (default) / `Alias`, konfirmasi terbit, publikasi langsung pasca-cek otomatis.
- Dasbor privat: Tulisan Saya (draf & terbit), Bookmark, Pengaturan Akun, Manajemen Passkey, Hapus Akun.
- Moderasi & keamanan: Sistem lapor, Dasbor Admin, sembunyikan/pulihkan tulisan, hapus komentar pelanggar, log tindakan moderasi, deteksi spam dasar, dan *rate limiting*.

### Di Luar Lingkup MVP (Ditunda Pasca-MVP)
- Integrasi blockchain, *Merkle batching*, *smart contract*, dan UI verifikasi bukti on-chain (hanya antarmuka abstraksi *chain-agnostic* yang dipersiapkan secara konseptual).
- Wallet kripto, token, atau transaksi on-chain bagi pengguna.
- Fitur sosial konvensional: sistem follower, feed berbasis algoritma popularitas/clout, profil publik penulis, atau pesan langsung (*DM*).
- Model AI moderasi otomatis skala besar (MVP mengandalkan validasi deterministik, heuristik spam, rate limit, dan tinjauan moderator manusia).
