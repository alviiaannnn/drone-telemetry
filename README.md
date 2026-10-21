# Drone Telemetry Dashboard

Simulasi IoT: ESP32 (Wokwi) mengirim data sensor drone setiap 3 detik, dashboard Next.js menampilkannya live. Proyek ini membandingkan tiga arsitektur IoT.

## Arsitektur

```
                  HTTP POST (x-api-key)                 INSERT (service role)
ESP32 (Wokwi) ───────────────────────────► /api/telemetry ─────────────────────► Supabase Postgres
      │                                                                              │
      │ MQTT publish irc/drone01/telemetry                     Realtime (postgres_changes INSERT)
      ▼                                                                              ▼
broker.emqx.io ◄──── wss (mqtt.js) ──── /mqtt                               /  (dashboard)
      ▲                                   │
      └──── publish irc/drone01/cmd ──────┘ (LED ON/OFF)
```

| Halaman | Sumber data |
|---|---|
| `/` | 100 data awal dari `GET /api/telemetry`, lalu live via Supabase Realtime |
| `/mqtt` | Langsung dari broker EMQX (tidak tersimpan) + tombol LED |
| `/compare` | Tabel perbandingan HTTP / MQTT / Supabase Realtime (nilai placeholder) |

Struktur:

```
app/api/telemetry/route.ts   POST (simpan) + GET (baca)
app/page.tsx                 dashboard Supabase Realtime
app/mqtt/page.tsx            dashboard MQTT
app/compare/page.tsx         tabel perbandingan
components/TelemetryView.tsx kartu, grafik, peta, log, alert (dipakai / dan /mqtt)
components/RealtimeDashboard.tsx fetch awal + subscribe Realtime
lib/supabase.ts              client anon (browser)
lib/supabase-server.ts       client service role (server only)
types/telemetry.ts           schema zod + tipe Telemetry
supabase/schema.sql          tabel, index, RLS, Realtime
```

## Setup

1. **Supabase:** buat project, buka SQL Editor, jalankan `supabase/schema.sql`.
   Ini membuat tabel `telemetry`, index `(device_id, created_at desc)`, RLS (publik hanya `select`; insert hanya lewat service role), dan menambahkan tabel ke publikasi Realtime.
2. **Env:** salin `.env.example` ke `.env.local`, isi nilainya (Supabase → Project Settings → API).
   `SUPABASE_SERVICE_ROLE_KEY` dan `DEVICE_KEY` hanya dibaca di server; jangan beri prefix `NEXT_PUBLIC_`.
3. **Jalankan:**
   ```bash
   npm install
   npm run dev
   ```
4. **Vercel:** import repo, isi 4 env var yang sama di Project Settings → Environment Variables, deploy.

## Tes dengan curl

```bash
URL=http://localhost:3000/api/telemetry   # atau https://<app>.vercel.app/api/telemetry
KEY=isi-DEVICE_KEY

# 201: tersimpan, mengembalikan baris baru
curl -i -X POST $URL -H "Content-Type: application/json" -H "x-api-key: $KEY" -d '{
  "device_id":"drone01","ax":0.1,"ay":0.0,"az":9.8,"gx":0.0,"gy":0.0,"gz":0.0,
  "temp":28.5,"pressure":100800,"altitude":12.4,"battery":80,"lat":-6.5944,"lon":106.7892}'

# Battery < 20 → banner alert muncul di dashboard
curl -X POST $URL -H "x-api-key: $KEY" -d '{
  "device_id":"drone01","ax":0,"ay":0,"az":9.8,"gx":0,"gy":0,"gz":0,
  "temp":30,"pressure":100700,"altitude":15,"battery":15,"lat":-6.5944,"lon":106.7892}'

# 401: key salah
curl -i -X POST $URL -H "x-api-key: salah" -d '{}'

# 400: payload tidak valid (detail per field di "details")
curl -i -X POST $URL -H "x-api-key: $KEY" -d '{"device_id":"drone01","battery":150}'

# GET data terbaru (urut terbaru dulu, limit 1–1000, default 100)
curl "$URL?device_id=drone01&limit=100"
```

Kode respons: `201` tersimpan, `400` JSON/payload/query salah, `401` key salah, `500` `DEVICE_KEY` belum di-set atau error database.

## Catatan ESP32

- HTTP: `POST /api/telemetry` dengan header `Content-Type: application/json` dan `x-api-key: <DEVICE_KEY>`. Untuk HTTPS Vercel di Wokwi, `WiFiClientSecure` dengan `setInsecure()` sudah cukup untuk simulasi.
- MQTT: publish JSON yang sama ke `irc/drone01/telemetry`. Subscribe `irc/drone01/cmd`; payload perintah berupa teks `ON` atau `OFF`.
- Status "ONLINE" di dashboard = data terakhir berumur < 10 detik.
- Broker EMQX bersifat publik: siapa pun bisa publish ke topik yang sama. Halaman `/mqtt` memvalidasi tiap pesan dengan schema zod dan membuang yang tidak cocok.
