# KITA — App readiness update

## Yang sudah diperbaiki
- Email lamaran kini punya jalur pengiriman nyata melalui Resend HTTP API; tanpa credential, aplikasi tetap aman dan hanya mencatat lamaran.
- Sinkronisasi lowongan kini mendukung official JSON feed yang dikonfigurasi melalui environment variables dan menolak item tanpa URL iklan individual/tanggal publikasi dasar.
- Scheduler 6 jam tetap aktif dan pemeriksaan konektivitas portal tidak disamakan dengan bukti adanya lowongan live.
- KITA sekarang punya Web App Manifest + Service Worker sehingga dapat dipasang sebagai aplikasi dari Chrome/Android (PWA/standalone).
- Placeholder lowongan lama tetap dinonaktifkan; sumber eksternal tanpa feed resmi tidak dipalsukan menjadi lowongan KITA.

## Yang wajib diisi oleh operator sebelum produksi
1. `JWT_SECRET`
2. `RESEND_API_KEY` dan `EMAIL_FROM` dari domain yang diverifikasi di Resend
3. `KITA_OFFICIAL_FEED_URL` atau `KITA_OFFICIAL_FEED_URLS` untuk feed lowongan resmi/berizin
4. HTTPS + persistent storage untuk `data/kita.sqlite` dan CV privat

## Android
Versi web sudah PWA-installable. APK native belum dapat dibuat di lingkungan ini karena Android SDK/Gradle build toolchain tidak tersedia dan source tidak boleh dipalsukan sebagai APK. Setelah source dideploy HTTPS, Android/Chrome dapat memasangnya sebagai standalone app; native APK build dapat dilakukan dari deployment URL dengan Android build tooling.
