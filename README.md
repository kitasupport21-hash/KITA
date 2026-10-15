# KITA — Platform Bursa Kerja Indonesia

Aplikasi full-stack React/Vite + Express + SQLite untuk pencari kerja dan pemberi kerja di Indonesia. Lowongan internal berasal dari akun employer; pencarian portal eksternal dibuka melalui tautan sumber.

## Menjalankan secara lokal

**Persyaratan:** Node.js 22+ dan npm.

1. Salin `.env.example` menjadi `.env` dan isi nilai yang diperlukan.
2. Instal dependensi: `npm install`.
3. Jalankan development server: `npm run dev`.
4. Buka alamat lokal yang ditampilkan server (default port 3000).
5. Untuk production build: `npm run build`, lalu jalankan dengan `NODE_ENV=production npm start`.

## Konfigurasi keamanan

- Di production, `JWT_SECRET` wajib diisi dengan secret acak minimal 32 karakter. Jangan memakai nilai contoh.
- Akun administrator tidak dapat dibuat melalui pendaftaran publik. Untuk membuat admin pertama di database baru, isi `KITA_BOOTSTRAP_ADMIN_EMAIL` dan `KITA_BOOTSTRAP_ADMIN_PASSWORD` (minimal 14 karakter) sebelum menjalankan server pertama kali. Simpan rahasia ini dengan aman dan hapus dari konfigurasi setelah bootstrap bila lingkungan deployment memungkinkan.
- Instalasi baru tidak membuat akun/job/company demo. Buat akun pencari kerja atau employer melalui pendaftaran normal; tombol demo-login dihapus.
- Database runtime berada di `data/kita.sqlite`; CV privat berada di `data/private-resumes/`. Keduanya tidak disertakan dalam arsip sumber. Jangan commit file database, CV pengguna, atau `.env`.

## Pemeriksaan

Jika memakai Bun, jalankan `bun install` untuk memperbarui `bun.lock` setelah perubahan dependency; dokumentasi utama menggunakan npm.

- Unit test: `npm test`
- TypeScript check: `npm run lint`
- Production build: `npm run build`

Status implementasi yang harus diketahui sebelum production: verifikasi email dan reset kata sandi belum tersedia; email lamaran eksternal belum dikirim (lamaran hanya dicatat di database); dan belum ada API/feed lowongan resmi yang dikonfigurasi. Jangan mengiklankan fitur-fitur tersebut sebagai aktif. CV kini diunggah sebagai PDF maksimal 5 MB dan disimpan privat; gunakan persistent disk terenkripsi, backup, serta kebijakan retensi untuk deployment.


## Separate KITA Control App

The admin dashboard UI is intentionally not part of the public KITA app anymore. Admin API routes remain protected in the backend for the future separate KITA Control app. See `ADMIN-CONTROL-APP-NOTES.md` for provisioning and API details.


## Direktori lowongan Indonesia

- Pencarian lowongan eksternal kini tersedia di beranda dan halaman pencarian dengan pilihan kata kunci serta seluruh 38 provinsi Indonesia.
- Tautan membuka hasil pencarian langsung di portal sumber (Karirhub/Pasker ID, Jobstreet, LinkedIn Jobs, Indeed, Glints, KitaLulus, Kalibrr, dan HiredToday).
- Dataset placeholder lowongan individual dihentikan agar aplikasi tidak mengklaim lowongan rekaan sebagai lowongan aktif. Placeholder lama dari versi sebelumnya ditandai kedaluwarsa saat sinkronisasi berikutnya.
- KITA belum mengambil lowongan eksternal secara otomatis karena integrasi API/feed resmi yang memberi URL iklan individual dan status aktif belum dikonfigurasi. Tanggal/status terbaru harus diperiksa di portal sumber.
