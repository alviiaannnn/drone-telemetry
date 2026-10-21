// Nilai latensi = placeholder. Ganti dengan hasil ukur sendiri.
const ROWS = [
  { name: "HTTP (POST → API)", latency: "± 300–800 ms", pattern: "Request/response", direction: "Device → server", persist: "Ya (via API)", note: "Sederhana, overhead header per paket" },
  { name: "MQTT (EMQX publik)", latency: "± 50–200 ms", pattern: "Publish/subscribe", direction: "Dua arah", persist: "Tidak", note: "Ringan, cocok untuk perintah ke device" },
  { name: "Supabase Realtime", latency: "± 200–600 ms", pattern: "DB change → WebSocket", direction: "Server → browser", persist: "Ya (Postgres)", note: "Data tersimpan + live tanpa polling" },
];

const COLS: [keyof (typeof ROWS)[number], string][] = [
  ["name", "Arsitektur"],
  ["latency", "Latensi (placeholder)"],
  ["pattern", "Pola"],
  ["direction", "Arah"],
  ["persist", "Tersimpan"],
  ["note", "Catatan"],
];

export default function ComparePage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-wide">Perbandingan Arsitektur</h1>
      <div className="overflow-x-auto rounded border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted">
            <tr>{COLS.map(([, h]) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} className="border-t border-line">
                {COLS.map(([k]) => <td key={k} className="px-4 py-3">{r[k]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
