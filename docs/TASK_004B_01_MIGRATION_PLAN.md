# UNSAID — TASK 004B-01: Database Migration Plan & Schema Foundation Audit

**Status Dokumen:** TASK 004B-01 — Migration Plan Consolidated with Approved Founder Decisions 4a/4b/4c (Design & Planning Only — Menunggu Review Project Manager Sebelum TASK 004B-02)  
**Source of Truth:** `docs/TASK_004A_DATABASE_ARCHITECTURE_PROPOSAL.md`  
**Target Repository / Branch:** `2517020061-dot/unsaid-Platform` / `ai-studio-dev` *(stabil `main` tidak disentuh)*

---

## 1. Repository & Inventory Summary

- **Lingkungan Runtime:** Astro SSR (`astro ^6.4.8`, `@astrojs/node ^10.1.4` standalone port `3000`, `@astrojs/react ^5.0.7`, `@supabase/supabase-js ^2.119.2`, `@supabase/ssr ^0.12.7`, Zod `^4.3.6`, Vitest `~4.0.18`).
- **Status Git Lokal:** Kontainer `/app/applet` tidak memiliki direktori `.git` (`NO_LOCAL_GIT`); sinkronisasi ke branch `ai-studio-dev` dikelola via AI Studio GitHub Sync.
- **Inventaris Database Saat Ini:** **Nihil** (belum ada folder `supabase/`, `supabase/migrations/*.sql`, `supabase/config.toml`, maupun kredensial Supabase live).
- **File Terkait di Codebase:** `.env.example`, `src/validation/env.ts`, `src/config/public.ts`, `src/config/server.ts`, `src/lib/supabase/browser.ts`, `src/server/services/supabase.ts` (`createServerAnonClient` & `createServerAdminClient`; belum ada `createServerUserClient`), `src/pages/api/health.ts`, `src/domain/models/identity.ts`, dan `src/domain/logic/identity-rules.ts`.

---

## 2. Ordered Migration Sequence (`supabase/migrations/`)

> **Catatan Boundary:** Belum ada file `.sql` yang dibuat pada fase TASK 004B-01 ini. Daftar di bawah adalah rancangan sekuens migrasi terurut yang akan dibuat di TASK 004B-02 setelah disetujui Project Manager.

| Urutan | Nama File Migrasi Rencana | Dependensi | Ringkasan Objek & Ketentuan Keamanan |
| :---: | :--- | :--- | :--- |
| **1** | `0001_extensions_schemas_and_fts_resolver.sql` | — | Ekstensi `pgcrypto`, `pg_trgm`; skema `private`, `legal_vault`; `REVOKE ALL` pada `private`/`legal_vault` dari `PUBLIC, anon, authenticated`; `private.resolve_fts_config()` (`indonesian` jika tersedia di `pg_ts_config`, fallback `'simple'`). |
| **2** | `0002_public_content_tables_and_triggers.sql` | `0001` | 5 tabel `public`: `categories`, `aliases`, `posts` (memuat **`is_deleted_by_author BOOLEAN NOT NULL DEFAULT FALSE`**, **`deleted_at TIMESTAMPTZ`**, serta `CHECK` konsistensi soft-delete + identitas publik), `comments`, `post_reaction_stats`. Trigger `trg_posts_before_write` memaksa `NEW.search_vector := NULL` saat `NEW.is_deleted_by_author = TRUE`, menekan `updated_at` via `unsaid.suppress_updated_at`, dan menyinkronkan `body_plain_text`. Indeks parsial feed/kategori/alias/FTS semuanya memfilter **`WHERE moderation_status = 'visible' AND is_deleted_by_author = FALSE`**. |
| **3** | `0003_private_identity_and_user_data_tables.sql` | `0001`, `0002`, `auth.users` | 9 tabel `private`: `user_accounts`, `deletion_jobs` (tanpa FK ke `auth.users`/`user_accounts`, partial unique `uq_deletion_jobs_active_user`), `alias_ownership` (+ trigger kuota maks 5), `alias_quarantines` (tanpa `former_owner_user_id`), `post_drafts`, `post_ownership`, `comment_ownership`, `bookmarks`, `post_reactions` (tanpa trigger `AFTER DELETE` pengurang count). |
| **4** | `0004_private_moderation_staff_and_audit_tables.sql` | `0001`–`0003` | 6 tabel `private`: `staff_roles`, `sensitive_access_requests` (`approved_by <> requested_by`), `reports` (`CHECK` anti-target silang + trigger `target_snapshot_id` + partial unique reporter), `moderation_actions`, `moderation_appeals` (`is_redacted_by_deletion`, `char_length >= 10`), `moderation_audit_logs` (`seq_id IDENTITY`, hash-chain, `REVOKE UPDATE/DELETE/TRUNCATE` + trigger anti-mutasi). |
| **5** | `0005_legal_vault_tables_and_hold_sync.sql` | `0001`, `0004` | 3 tabel `legal_vault`: `legal_preservation_holds` (`approved_by_officer_id <> created_by_officer_id`), `legal_preservation_snapshots` (AEAD `BYTEA`, `iv_nonce` 12B, `auth_tag` 16B, `purge_after`), `legal_access_logs` (immutable hash-chain) + trigger `AFTER UPDATE OF expires_at, status` yang menyinkronkan `snapshots.purge_after`. |
| **6** | `0006_rls_policies_and_public_views.sql` | `0002`–`0005` | `ENABLE` + `FORCE ROW LEVEL SECURITY` pada seluruh 23 tabel; `DENY ALL` (`false`) pada 18 tabel `private.*`/`legal_vault.*`; `public.posts` `SELECT` RLS = `moderation_status = 'visible' AND is_deleted_by_author = FALSE` (mengecualikan `search_vector` via column-level `GRANT`); `public.comments` `SELECT` RLS = `moderation_status = 'visible' AND EXISTS (parent post visible AND is_deleted_by_author = FALSE)`; `public.post_reaction_stats` `SELECT` RLS = `EXISTS (parent post visible AND is_deleted_by_author = FALSE)`; 3 view publik (`public_posts_feed`, `public_post_detail`, `public_comments_view`) dengan `security_invoker = true, security_barrier = true`. |
| **7** | `0007_security_definer_auth_helpers_and_audit.sql` | `0001`–`0006` | Helper `SECURITY DEFINER` (`postgres`, `SET search_path = ''`, nol `current_user`/`session_user` anti-pattern): `private.jwt_role()`, `private.assert_authenticated_user_context()`, `private.assert_trusted_service_context()`, `private.assert_staff_role()`, `private.append_moderation_audit_log()`, `legal_vault.append_legal_access_log()`, dan `private.handle_new_auth_user()`. |
| **8** | `0008_user_lane_content_alias_and_workspace_rpcs.sql` | `0007` | User Lane RPC (`authenticated`): `rpc_ensure_user_account`, CRUD draf, bookmark (`rpc_list_my_bookmarks` pertahankan bookmark post soft-deleted dengan placeholder `'[Tulisan telah dihapus]'`, `can_open = FALSE`, nol judul/isi/tautan buka ulang; `rpc_toggle_bookmark` izinkan hapus manual, blokir tambah baru pada post terhapus, tanpa auto-delete), `rpc_toggle_post_appreciation` (blokir mutasi `+1`/`-1` pada post soft-deleted), alias (maks 5, karantina 30 hari, `suppress_updated_at`), `rpc_publish_post`, `rpc_edit_own_post` (tolak jika `is_deleted_by_author = TRUE`), **`rpc_delete_own_post(p_post_id)`** (izinkan walau ada laporan terbuka/`hidden`/`removed` sepanjang tidak ada hold aktif tanpa snapshot `SNAPSHOT_REQUIRED`; **jangan** auto-resolve/close/dismiss `private.reports`; soft-delete & redaksi in-place), `rpc_list_my_posts` (filter `is_deleted_by_author = FALSE`), `rpc_create_comment` (izinkan komentar pada post `Anonim` terhapus-akun yang aktif, tolak post soft-deleted), **`rpc_list_my_comments()`** (tampilan aktivitas privat komentar milik sendiri, mask post induk terhapus ke placeholder `'[Tulisan induk telah dihapus]'` tanpa bocor judul/isi/identitas penulis), `rpc_delete_own_comment` (tetap diizinkan walau post induk `is_deleted_by_author = TRUE`), `rpc_submit_report`/`appeal`, dan **`rpc_search_public_posts`** (`anon` + `authenticated`, filter `visible AND is_deleted_by_author = FALSE`). |
| **9** | `0009_user_lane_deletion_status_and_recovery_rpcs.sql` | `0007` | `rpc_get_my_account_status()` & `rpc_get_my_deletion_status()` (`STABLE` read-only, terikat `auth.uid()`, lookup `deletion_jobs` lebih dulu, nol `deleteUser()`), `rpc_request_account_deletion()`, dan `rpc_resume_my_account_deletion()` (pra-`db_unlinked` resume only via `POST`, kembalikan `FINALIZING_AUTH_DELETION` bila `db_unlinked`+). |
| **10** | `0010_staff_and_legal_lane_rpcs.sql` | `0007` | Seluruh wrapper `public.rpc_staff_*` (laporan terbuka atas post soft-deleted tetap ada di `rpc_staff_list_moderation_queue`; `rpc_staff_moderate_content` `'restore'` tidak membatalkan `is_deleted_by_author = TRUE`) dan `public.rpc_legal_*` (`REVOKE PUBLIC, anon, authenticated; GRANT service_role`). |
| **11** | `0011_worker_lane_deletion_legal_and_purge_rpcs.sql` | `0007`, `0009` | Seluruh wrapper `public.rpc_worker_*` (`GRANT service_role`), termasuk `rpc_worker_get_hold_payload_for_post` (pendukung pre-redaction snapshot `rpc_delete_own_post`), `rpc_worker_execute_db_unlink`, dan `rpc_worker_mark_deletion_state` (pasca-`db_unlinked` hanya menulis `deletion_jobs.state`). |
| **12** | `0012_schema_hardening_and_verification_assertions.sql` | `0001`–`0011` | Assertions `DO $$` pasca-migrasi (23 tabel `FORCE RLS`, isolasi grant) + `supabase/seed.sql` terpisah untuk kategori publik. |

---

## 3. Addendum Desain: Post Soft-Delete & Content Redaction (`[APPROVED BY FOUNDER]`)

### A. Rancangan Teknis Soft-Delete & Redaksi In-Place
1. **Kolom Baru di `public.posts`:** `is_deleted_by_author BOOLEAN NOT NULL DEFAULT FALSE` dan `deleted_at TIMESTAMPTZ`, disertai `CHECK ((is_deleted_by_author = FALSE AND deleted_at IS NULL) OR (is_deleted_by_author = TRUE AND deleted_at IS NOT NULL))`.
2. **Transaksi Atomik `public.rpc_delete_own_post(p_post_id UUID)`:**
   - Memanggil `assert_authenticated_user_context(true)` (`v_uid := auth.uid()`, `account_status = 'active'`).
   - Mengunci baris `public.posts WHERE id = p_post_id FOR UPDATE` dan memverifikasi kepemilikan di `private.post_ownership WHERE post_id = p_post_id AND owner_user_id = v_uid`.
   - Idempoten bila sudah `is_deleted_by_author = TRUE`.
   - **Keputusan 4a — Penghapusan Saat Ada Laporan Terbuka / Moderasi (`[APPROVED BY FOUNDER]`):** Penulis **diperbolehkan** menghapus tulisannya sendiri walaupun terdapat laporan terbuka (`open`/`under_review`) atau berstatus `hidden`/`removed` oleh moderasi, **selama tidak ada legal hold aktif sah yang menghalangi redaksi** (`SNAPSHOT_REQUIRED`). Penghapusan ini **tidak boleh** otomatis menyelesaikan (`'resolved'`), menutup, atau menolak (`'dismissed'`) laporan yang sudah ada — seluruh laporan eksisting pada `private.reports` wajib tetap terbuka. Bukti yang diperlukan hanya dipreservasi melalui `legal_vault` di bawah retensi terbatas dan dasar hukum yang berlaku (`[REQUIRES LEGAL REVIEW]`), tanpa arsip plaintext tak terbatas.
   - **Redaksi Permanen In-Place:** Menyetel `is_deleted_by_author = TRUE`, `deleted_at = now()`, `author_mode = 'anonymous'`, `alias_id = NULL`, `public_author_label = 'Anonim'`, `title = '[Tulisan telah dihapus oleh penulis]'`, `body_markdown = '[Tulisan telah dihapus oleh penulis]'`, `body_plain_text = '[Tulisan telah dihapus oleh penulis]'`, dan `search_vector = NULL` (dipaksa juga oleh `trg_posts_before_write`).
3. **Zero Unauthorized Retention:** Tidak ada kolom arsip plaintext dan tidak ada salinan konten terhapus bila tidak terdapat legal hold aktif yang sah dan berbatas waktu (`purge_after = hold.expires_at`).

### B. Penanganan Komentar, Reaksi, & Bookmark (Integritas FK & Keputusan Founder 4b/4c)
- **Komentar (`public.comments` — Keputusan 4b `[APPROVED BY FOUNDER]`):**
  - Baris `public.posts` dipertahankan sehingga FK `comments.post_id` dan `parent_comment_id` tetap valid tanpa *orphaned records*.
  - RLS `public.comments` (`SELECT`) mengecek `EXISTS` parent post `moderation_status = 'visible' AND is_deleted_by_author = FALSE`, dan `rpc_create_comment` menolak komentar baru ke post soft-deleted (`404 POST_NOT_FOUND`), sehingga komentar tidak lagi muncul di publik. Komentar pengguna lain tidak ditimpa secara massal demi menjaga bukti laporan/moderasi.
  - **Tampilan Aktivitas/Riwayat Privat & Hapus Mandiri:** Komentator tetap dapat menemukan komentar miliknya sendiri melalui `public.rpc_list_my_comments()` (`authenticated` JWT) dan tetap dapat menghapus komentarnya sendiri melalui `public.rpc_delete_own_comment(p_comment_id)` (meskipun post induk sudah di-soft-delete). Untuk post induk berstatus `is_deleted_by_author = TRUE`, `rpc_list_my_comments()` **wajib** hanya menampilkan placeholder persis **`'[Tulisan induk telah dihapus]'`** tanpa judul asli, isi tulisan, identitas penulis, ataupun konten asli lainnya.
- **Reaksi (`public.post_reaction_stats` & `private.post_reactions`):** FK tetap utuh tanpa pengurangan hitungan paksa atau *orphaned rows*. RLS `public.post_reaction_stats` (`SELECT`) menyembunyikan statistik post yang di-soft-delete dari REST publik, dan `rpc_toggle_post_appreciation` menolak mutasi `+1`/`-1` pada post soft-deleted (angka membeku secara konsisten).
- **Bookmark (`private.bookmarks` — Keputusan 4c `[APPROVED BY FOUNDER]`):**
  - Bookmark yang sudah ada **tetap terlihat** di daftar bookmark privat pengguna (`public.rpc_list_my_bookmarks()`) dan **tidak boleh** dihapus diam-diam hanya karena tulisannya dihapus penulis.
  - Untuk post yang di-soft-delete (`is_deleted_by_author = TRUE`), `rpc_list_my_bookmarks()` **wajib** menampilkan hanya placeholder persis **`'[Tulisan telah dihapus]'`** (`can_open = FALSE`, `target_url = NULL`), tanpa judul asli, isi tulisan, identitas penulis, ataupun tautan/aksi untuk membuka ulang konten asli.
  - Pengguna tetap dapat menghapus bookmark secara manual melalui `rpc_toggle_bookmark`, sedangkan penambahan bookmark baru pada post terhapus ditolak.

### C. Dampak Lintas Sistem (Feed, Pencarian, Rekomendasi, Cache, Moderasi, Legal Hold)
- **Feed, Halaman Publik & Rekomendasi:** RLS `public.posts` + view `security_invoker = true` + indeks parsial `WHERE moderation_status = 'visible' AND is_deleted_by_author = FALSE` langsung mengeluarkan post terhapus; SSR `GET /posts/:id` membalas `404`.
- **Pencarian:** `search_vector = NULL` dan filter `rpc_search_public_posts` menjamin post redaksi tidak pernah muncul di hasil pencarian maupun indeks GIN/trigram aktif.
- **Cache HTTP/SSR:** Endpoint publik detail/feed memakai `Cache-Control: no-store` atau cache pendek dengan invalidasi langsung pasca-`rpc_delete_own_post`; rute terautentikasi memakai `Cache-Control: private, no-store`.
- **Moderasi & Legal Hold:** FK `reports.target_post_id` dan `moderation_actions.target_post_id` tetap valid (`target_snapshot_id` tidak patah). Laporan terbuka tetap berada di antrean moderasi (`4a`), `'restore'` moderasi tidak membatalkan `is_deleted_by_author = TRUE`, dan preservasi konten hanya dilakukan melalui ciphertext AES-256-GCM berbatas waktu `purge_after` saat ada legal hold sah.

---

## 4. Konsolidasi Keputusan Founder & Sisa Prasyarat Teknis/Hukum

- **Status Keputusan Founder (`[APPROVED BY FOUNDER]` — Nihil Tertunda):** Seluruh keputusan produk termasuk **4a** (penghapusan saat ada laporan/moderasi; laporan tetap terbuka), **4b** (komentar tersembunyi publik namun ada di riwayat privat dengan `'[Tulisan induk telah dihapus]'` + dapat dihapus pemiliknya), dan **4c** (bookmark eksisting tetap tampil di daftar privat dengan `'[Tulisan telah dihapus]'`, tanpa judul/isi/tautan buka ulang + hapus manual) telah disetujui Founder. **Tidak ada lagi keputusan Founder yang tertunda.**
- **Prasyarat Teknis & Hukum yang Masih Menunggu Sebelum Implementasi Penuh:**
  1. **`[REQUIRES LEGAL REVIEW]`:** Penetapan durasi retensi terbatas untuk laporan tertutup, log moderasi/audit non-PII, metadata baris tombstone kosong `public.posts` pasca-redaksi, serta dasar hukum/batas `expires_at` dan cakupan `auth_identity` pada `legal_vault` (`TASK 004A` Bagian 15.A).
  2. **`[TECHNICAL POLICY PENDING]`:** Penetapan angka batas *rate limit* harian klaim/pelepasan alias (`TASK 004A` Bagian 15.C).
  3. **Pre-Flight Lingkungan Supabase Live:** Verifikasi `pg_ts_config` `'indonesian'`, trigger `auth.users`, konfigurasi SMTP OTP & *feature flag* Passkeys Beta sebelum TASK 004B-02.

---

## 5. Rencana Pengujian Integritas & Keamanan Khusus Soft-Delete + Recovery

1. **Integritas FK & Zero Orphaned Records:** Uji penghapusan tulisan yang memiliki komentar bertingkat, reaksi aktif, bookmark, laporan terbuka, dan tindakan moderasi; verifikasi nol error FK, nol *orphaned rows*, dan nol penurunan salah pada `retained_appreciation_count`.
2. **Eksklusi Seketika dari Publik, REST, Pencarian, Rekomendasi & Cache:** Verifikasi langsung pasca-`rpc_delete_own_post`: `/rest/v1/posts`, `/rest/v1/comments?post_id=eq.<id>`, `/rest/v1/post_reaction_stats?post_id=eq.<id>`, `public_posts_feed`, `public_post_detail`, `public_comments_view`, `rpc_search_public_posts`, rekomendasi kategori, serta `GET /posts/:id` mengembalikan 0 baris / `404` tanpa cache publik basi (`rpc_edit_own_post` ditolak dan `'restore'` tidak memunculkan kembali).
3. **Pengujian Eksplisit Keputusan 4a, 4b, dan 4c:**
   - **Uji 4a:** Penulis menghapus tulisan yang memiliki laporan `'open'`/`'under_review'` atau status `'hidden'`/`'removed'` (tanpa hold aktif) -> redaksi berhasil, namun baris `private.reports` tetap `'open'`/`'under_review'` (tidak auto-resolved/closed/dismissed); jika ada hold aktif -> `SNAPSHOT_REQUIRED` & snapshot AES-256-GCM berbatas `purge_after`, tanpa arsip plaintext tak terbatas.
   - **Uji 4b:** Komentar Pengguna B pada post yang di-soft-delete Penulis A hilang dari publik, namun muncul di `rpc_list_my_comments()` milik Pengguna B dengan label parent persis `'[Tulisan induk telah dihapus]'` (nol judul asli, isi, identitas penulis, atau tautan konten) dan berhasil dihapus lewat `rpc_delete_own_comment()`.
   - **Uji 4c:** Bookmark Pengguna C pada post soft-deleted **tidak terhapus otomatis**, tetap tampil di `rpc_list_my_bookmarks()` dengan placeholder persis `'[Tulisan telah dihapus]'` (`can_open = FALSE`, nol judul/isi/tautan buka ulang), berhasil dihapus manual via `rpc_toggle_bookmark()`, dan penambahan bookmark baru ditolak.
4. **Zero Plaintext Retention, Legal Hold TOCTOU & Skenario Deletion/Recovery (`TASK 004A` Bagian 14):** Verifikasi nol sisa plaintext tanpa hold, penolakan non-pemilik & `suspended` pada `rpc_delete_own_post`, `GET` status murni *read-only* tanpa `deleteUser()`, idempotensi klik ganda `POST`, worker retry tanpa `user_accounts`, dan isolasi `auth.uid()`.

---

**Status:** `TASK 004B-01 — CONSOLIDATED WITH APPROVED FOUNDER DECISIONS 4A/4B/4C — PENDING PROJECT MANAGER REVIEW BEFORE TASK 004B-02`
