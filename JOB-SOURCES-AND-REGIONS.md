# KITA — sumber lowongan Indonesia dan cakupan wilayah

## Yang diubah
- Menambahkan pencarian lowongan dari portal Indonesia di beranda dan halaman pencarian.
- Pengguna dapat memasukkan kata kunci dan memilih salah satu dari 38 provinsi Indonesia atau seluruh Indonesia.
- Pencarian pada Indeed, LinkedIn Jobs, Jobstreet, dan Glints membawa kata kunci serta lokasi yang dipilih. Portal nasional lainnya tetap dapat dibuka langsung.
- Memperluas filter provinsi di halaman pencarian ke seluruh 38 provinsi.
- Menghentikan dataset lowongan contoh yang tidak memiliki URL iklan individual yang dapat diverifikasi. Placeholder lama dari versi sebelumnya ditandai kedaluwarsa saat sinkronisasi dijalankan.

## Batasan yang transparan
Tautan portal adalah tautan pencarian ke sumber eksternal, bukan feed API yang disalin ke database KITA. Karena itu, hasil terbaru dan status lowongan aktif dikelola oleh masing-masing portal. KITA tidak boleh mengklaim sinkronisasi live sampai ada integrasi API/feed yang sah dan mengembalikan URL iklan individual, tanggal publikasi, serta status aktif.

## Portal yang ditautkan
- Pasker ID / Karirhub Kemnaker: https://paskerid.kemnaker.go.id/
- Jobstreet Indonesia: https://id.jobstreet.com/id/
- LinkedIn Jobs Indonesia: https://id.linkedin.com/jobs/
- Indeed Indonesia: https://id.indeed.com/
- Glints Indonesia: https://glints.com/id
- KitaLulus: https://www.kitalulus.com/
- Kalibrr: https://www.kalibrr.com/
- HiredToday: https://www.hiredtoday.com/

## Keamanan dan data contoh
- Endpoint POST `/api/sync/trigger` sekarang hanya dapat digunakan oleh pengguna yang sudah masuk dengan peran `admin`.
- Direktori perusahaan hanya menampilkan employer profile yang benar-benar terdaftar. Perusahaan tidak dianggap terverifikasi otomatis.
- Pencarian KitaLulus, Kalibrr, dan HiredToday menggunakan pencarian web terbatas domain saat URL pencarian publik yang stabil tidak tersedia; ini bukan integrasi API atau sinkronisasi lowongan otomatis.

- Instalasi baru tidak menanam akun perusahaan atau lowongan contoh.
- Pencarian kata kunci/lokasi pada portal tanpa URL pencarian stabil memakai hasil web yang dibatasi ke domain sumber, termasuk Pasker ID. Ini membantu pencarian, tetapi bukan bukti bahwa semua hasil masih aktif; verifikasi tanggal dan status di sumber sebelum melamar.

## Status fitur backend
- CV: unggahan PDF asli maksimal 5 MB, disimpan privat dan akses dibatasi kepada pemilik, employer penerima lamaran, atau admin.
- Notifikasi: dibaca dari API/database pengguna, tidak lagi berisi contoh palsu.
- Email lamaran: belum dikirim ke luar; sistem hanya mencatat lamaran di database. Verifikasi email dan reset kata sandi belum tersedia.
