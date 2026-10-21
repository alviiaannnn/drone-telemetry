"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Telemetry } from "@/types/telemetry";

// Palet kategorikal mode gelap (slot 1-3, tervalidasi CVD) + warna status.
const SERIES = ["#3987e5", "#d95926", "#199e70"];
const GOOD = "#0ca30c";
const CRITICAL = "#d03b3b";
const LOW_BATTERY = 20;
const ONLINE_MS = 10_000;

const time = (iso: string) => new Date(iso).toLocaleTimeString("id-ID");

type Props = {
  title: string;
  deviceId: string;
  rows: Telemetry[]; // urut lama -> baru
  extra?: ReactNode;
};

export default function TelemetryView({ title, deviceId, rows, extra }: Props) {
  const [now, setNow] = useState(0); // 0 saat prerender; detak pertama 1 detik setelah mount
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const last = rows.at(-1);
  const online = !!last && now - new Date(last.created_at).getTime() < ONLINE_MS;
  const lowBattery = !!last && last.battery < LOW_BATTERY;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">{title}</h1>
          <p className="font-mono text-sm text-muted">device: {deviceId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {extra}
          <span className="flex items-center gap-2 rounded border border-line px-3 py-1 font-mono text-sm">
            <span className="size-2.5 rounded-full" style={{ background: online ? GOOD : CRITICAL }} />
            {online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </header>

      {lowBattery && (
        <div role="alert" className="rounded border px-4 py-3 font-medium" style={{ borderColor: CRITICAL, background: "#d03b3b22" }}>
          ⚠ Battery rendah: {last.battery}% (di bawah {LOW_BATTERY}%)
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Altitude" value={last && `${last.altitude.toFixed(1)} m`} />
        <Card label="Battery" value={last && `${last.battery}%`}>
          <div className="mt-2 h-2 overflow-hidden rounded bg-line">
            <div className="h-full rounded" style={{ width: `${last?.battery ?? 0}%`, background: lowBattery ? CRITICAL : GOOD }} />
          </div>
        </Card>
        <Card label="Temp" value={last && `${last.temp.toFixed(1)} °C`} />
        <Card label="Pressure" value={last && `${(last.pressure / 100).toFixed(1)} hPa`} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Chart title="Altitude (m)" rows={rows} keys={["altitude"]} />
        <Chart title="Battery (%)" rows={rows} keys={["battery"]} />
        <Chart title="Accel (m/s²)" rows={rows} keys={["ax", "ay", "az"]} />
        <Chart title="Gyro (rad/s)" rows={rows} keys={["gx", "gy", "gz"]} />
      </section>

      <section className="grid gap-3 lg:grid-cols-3">
        <Panel title="Posisi terakhir">
          {last ? <MapView lat={last.lat} lon={last.lon} /> : <Empty />}
        </Panel>
        <Panel title="Log (20 terbaru)" className="lg:col-span-2">
          <LogTable rows={rows.slice(-20).reverse()} />
        </Panel>
      </section>
    </main>
  );
}

function Panel({ title, className = "", children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`rounded border border-line bg-surface p-4 ${className}`}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">{title}</h2>
      {children}
    </div>
  );
}

function Card({ label, value, children }: { label: string; value?: string | false; children?: ReactNode }) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl">{value || "—"}</p>
      {children}
    </div>
  );
}

const Empty = () => <p className="text-sm text-muted">Belum ada data.</p>;

function Chart({ title, rows, keys }: { title: string; rows: Telemetry[]; keys: (keyof Telemetry)[] }) {
  return (
    <Panel title={title}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#2c2c2a" vertical={false} />
          <XAxis dataKey="created_at" tickFormatter={time} stroke="#8a897f" fontSize={11} minTickGap={40} />
          <YAxis stroke="#8a897f" fontSize={11} domain={["auto", "auto"]} />
          <Tooltip
            labelFormatter={(v) => time(String(v))}
            contentStyle={{ background: "#1a1a19", border: "1px solid #383835", color: "#f0efec" }}
            itemStyle={{ color: "#f0efec" }}
          />
          {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: "#c3c2b7" }} />}
          {keys.map((k, i) => (
            <Line key={k} dataKey={k} stroke={SERIES[i]} strokeWidth={2} dot={false} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Panel>
  );
}

function MapView({ lat, lon }: { lat: number; lon: number }) {
  // Dibulatkan ~10 m agar iframe tidak reload tiap paket.
  const [la, lo] = [lat.toFixed(4), lon.toFixed(4)];
  const d = 0.005;
  const bbox = [lon - d, lat - d, lon + d, lat + d].join(",");
  return (
    <div className="space-y-2">
      <iframe
        title="Peta posisi drone"
        className="h-56 w-full rounded border-0"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${la},${lo}`}
        key={`${la},${lo}`}
      />
      <a className="font-mono text-sm text-accent underline" href={`https://www.google.com/maps?q=${la},${lo}`} target="_blank" rel="noreferrer">
        {la}, {lo} ↗ Google Maps
      </a>
    </div>
  );
}

function LogTable({ rows }: { rows: Telemetry[] }) {
  if (!rows.length) return <Empty />;
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full font-mono text-xs">
        <thead className="sticky top-0 bg-surface text-left text-muted">
          <tr>
            {["Waktu", "Alt", "Batt", "Temp", "Press", "Lat", "Lon"].map((h) => (
              <th key={h} className="px-2 py-1 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="px-2 py-1">{time(r.created_at)}</td>
              <td className="px-2 py-1">{r.altitude.toFixed(1)}</td>
              <td className="px-2 py-1" style={r.battery < LOW_BATTERY ? { color: CRITICAL } : undefined}>{r.battery}%</td>
              <td className="px-2 py-1">{r.temp.toFixed(1)}</td>
              <td className="px-2 py-1">{r.pressure}</td>
              <td className="px-2 py-1">{r.lat.toFixed(4)}</td>
              <td className="px-2 py-1">{r.lon.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
