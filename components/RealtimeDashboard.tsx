"use client";

import { useEffect, useState } from "react";
import TelemetryView from "@/components/TelemetryView";
import { supabaseBrowser } from "@/lib/supabase";
import type { Telemetry } from "@/types/telemetry";

const MAX = 100;

// Gabung, buang duplikat (insert realtime bisa tiba sebelum fetch awal selesai), sisakan 100 terakhir.
const merge = (a: Telemetry[], b: Telemetry[]) =>
  [...new Map([...a, ...b].map((r) => [r.id, r])).values()].sort((x, y) => x.id - y.id).slice(-MAX);

export default function RealtimeDashboard({ deviceId }: { deviceId: string }) {
  const [rows, setRows] = useState<Telemetry[]>([]);
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [error, setError] = useState(configured ? undefined : "env Supabase belum di-set (lihat .env.example)");

  useEffect(() => {
    if (!configured) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`telemetry:${deviceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "telemetry", filter: `device_id=eq.${deviceId}` },
        (p) => setRows((prev) => merge(prev, [p.new as Telemetry])),
      )
      .subscribe();

    fetch(`/api/telemetry?device_id=${encodeURIComponent(deviceId)}&limit=${MAX}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setRows((prev) => merge(prev, body));
      })
      .catch((e) => setError(String(e.message ?? e)));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, configured]);

  return (
    <>
      {error && <p className="mx-auto max-w-7xl px-4 pt-4 text-sm text-red-400 sm:px-6">Gagal memuat data awal: {error}</p>}
      <TelemetryView title="Drone Telemetry · Supabase Realtime" deviceId={deviceId} rows={rows} />
    </>
  );
}
