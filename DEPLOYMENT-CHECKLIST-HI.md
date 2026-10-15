# Checklist deployment KITA (Indonesia)

## Wajib sebelum deploy
- Gunakan Node.js 22+.
- Isi `JWT_SECRET` dengan secret acak kuat minimal 32 karakter; jangan gunakan fallback development.
- Buat admin pertama melalui `KITA_BOOTSTRAP_ADMIN_EMAIL` dan password unik minimal 14 karakter, lalu hapus secret bootstrap dari environment setelah akun tercipta.
- Jalankan `npm install`, `npm run lint`, `npm test`, dan `npm run build`; jangan deploy bila salah satu gagal.
- Gunakan HTTPS dan persistent volume untuk `data/kita.sqlite` serta `data/private-resumes/`. Jangan expose `data/` sebagai static directory.
- Siapkan backup terenkripsi, akses operasional terbatas, retensi/penghapusan CV, dan pemantauan kapasitas disk.
- Uji pendaftaran/login, role seeker/employer/admin, pembuatan lowongan, lamaran, upload CV invalid/terlalu besar, akses CV lintas pengguna, dan mobile browser.
- Siapkan email verification, password reset, serta provider email yang benar-benar mengirim pesan sebelum mempromosikan fitur tersebut.
- Hubungkan API/feed lowongan resmi atau berizin yang memberi URL iklan individual, tanggal publikasi, dan status aktif. Sampai saat itu, portal eksternal hanya dibuka lewat link pencarian; sinkronisasi live belum aktif.

## Environment variables
Lihat `.env.example`. Jangan simpan secrets di source control atau kirimkannya melalui chat.
