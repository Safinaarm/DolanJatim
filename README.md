# 🌴 DolanJatim - Smart Travel Budget & Recommender Se-Jawa Timur

Aplikasi web perencana liburan cerdas dan estimasi anggaran wisata untuk seluruh 38 Kota/Kabupaten di Jawa Timur. Menggunakan **OpenStreetMap (OSRM API)** untuk kalkulasi rute dan jarak nyata antar kota, kalkulasi bensin & tarif tol Trans-Jawa, serta rekomendasi lengkap tempat wisata, hotel, resto, dan cafe dari dataset Jawa Timur.

---

## ✨ Fitur Utama

1. **Input Interaktif:**
   - **Dropdown Kota Asal & Kota Tujuan**: Mengikuti 38 kota/kabupaten di Jawa Timur (Surabaya, Malang, Batu, Banyuwangi, Mojokerto/Trawas, Bromo/Probolinggo, Pacitan, dsb.).
   - **Input Budget (Rp)**: Masking otomatis format mata uang Rupiah.
   - **Pilihan Transportasi**:
     - 🏍️ **Motor**: Tanpa tol, bensin irit (~40 km/L).
     - 🚗 **Mobil**: Bensin (~11 km/L) + Estimasi tarif tol Trans-Jawa Golongan 1.
   - **Pilihan Penginapan (Yes / No)**:
     - Jika dicentang: Hotel 1 malam dimasukkan ke kalkulasi biaya wajib.
     - Jika tidak dicentang: Mode Day Trip (biaya hotel Rp 0).

2. **Kalkulasi Rute via OpenStreetMap API:**
   - Menghitung jarak mengemudi riil (km) dan durasi tempuh menggunakan **Open Source Routing Machine (OSRM)** dengan OpenStreetMap.
   - Dilengkapi fallback formula Haversine + faktor belokan jalan jika mode offline/rate limit.
   - Visualisasi peta interaktif **Leaflet.js + OpenStreetMap tiles** lengkap dengan pin titik asal, titik tujuan, dan garis rute jalan raya.

3. **Catatan Perhitungan Biaya ("Skirane Kayak Catatan"):**
   - Tampilan nota/struk anggaran perjalanan yang elegan dan transparan:
     - Jarak Tempuh (km) & Waktu Tempuh
     - Estimasi Biaya Bensin (PP)
     - Estimasi Tarif Tol (Mobil)
     - Estimasi Tiket Wisata
     - Estimasi Penginapan
     - Total Estimasi Biaya Wajib vs Budget Pengguna
     - Sisa Saldo / Defisit dengan status peringatan cerdas
     - **Catatan Khusus Resto & Cafe**: Secara eksplisit diinfokan bahwa kuliner & cafe bersifat opsional sehingga tidak membebani anggaran wajib.
     - Tombol **Salin Rincian ke WhatsApp** dan **Cetak / Simpan PDF**.

4. **Koleksi Rekomendasi Terpadu:**
   - 🏞️ **Wisata**: 382 destinasi dengan harga tiket resmi, kategori (Alam, Pantai, Air Terjun, Theme Park, Sejarah), lokasi, dan rating.
   - 🏨 **Hotel & Penginapan**: 609 hotel/hostel/homestay dengan tarif per malam dan rating.
   - 🍽️ **Resto Kuliner Lokal**: 503 restoran kuliner khas (Opsional).
   - ☕ **Cafe & Tongkrongan**: 769 cafe estetik (Opsional).
   - Fitur pencarian instan dan tombol langsung buka titik lokasi di Google Maps.

---

## 🚀 Cara Menjalankan Lokal

Karena aplikasi dibuat menggunakan bahasa pemrograman sederhana (HTML5, CSS3, Vanilla JavaScript), Anda **tidak memerlukan instalasi Node.js atau build tools rumit**.

Cukup buka file `index.html` langsung di browser favorit Anda:
- Double click `index.html`, atau
- Gunakan live server sederhana di PowerShell / Terminal:
  ```bash
  python -m http.server 8000
  ```
  Lalu buka [http://localhost:8000](http://localhost:8000).

---

## 🌐 Cara Hosting Gratis di Netlify

Aplikasi ini 100% siap dihosting di Netlify:

### Cara 1: Netlify Drop (Paling Cepat - 1 Menit)
1. Buka [https://app.netlify.com/drop](https://app.netlify.com/drop).
2. Login atau register gratis.
3. Tarik (drag & drop) seluruh folder `DolanJatim` ke area upload browser.
4. Website Anda langsung online dengan link URL aktif!

### Cara 2: Netlify via GitHub
1. Upload folder ini ke repository GitHub Anda.
2. Di dashboard Netlify, klik **"Add new site"** ➔ **"Import an existing project"** ➔ Pilih GitHub.
3. Pilih repository ini. Netlify akan otomatis membaca konfigurasi dari `netlify.toml`.
4. Klik **Deploy site**.
