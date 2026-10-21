"use client";

import { useEffect, useRef, useState } from "react";
import mqtt, { type MqttClient } from "mqtt";
import TelemetryView from "@/components/TelemetryView";
import { telemetryInput, type Telemetry } from "@/types/telemetry";

const BROKER = "wss://broker.emqx.io:8084/mqtt";
const DEVICE = "drone01";
const TOPIC_DATA = `irc/${DEVICE}/telemetry`;
const TOPIC_CMD = `irc/${DEVICE}/cmd`;

type Status = "connecting" | "connected" | "reconnecting" | "offline" | "error";
const STATUS_COLOR: Record<Status, string> = {
  connecting: "#fab219",
  reconnecting: "#fab219",
  connected: "#0ca30c",
  offline: "#d03b3b",
  error: "#d03b3b",
};

export default function MqttPage() {
  const [rows, setRows] = useState<Telemetry[]>([]);
  const [status, setStatus] = useState<Status>("connecting");
  const [led, setLed] = useState(false);
  const client = useRef<MqttClient>(null);

  useEffect(() => {
    const c = mqtt.connect(BROKER, { reconnectPeriod: 3000 });
    client.current = c;
    c.on("connect", () => {
      setStatus("connected");
      c.subscribe(TOPIC_DATA);
    });
    c.on("reconnect", () => setStatus("reconnecting"));
    c.on("offline", () => setStatus("offline"));
    c.on("error", () => setStatus("error"));
    c.on("message", (_topic, payload) => {
      // Broker publik: siapa pun bisa publish, jadi validasi dulu.
      let json: unknown;
      try {
        json = JSON.parse(payload.toString());
      } catch {
        return;
      }
      const parsed = telemetryInput.safeParse(json);
      if (!parsed.success) return;
      // MQTT tidak punya id/created_at; diberi cap waktu saat diterima.
      const now = Date.now();
      setRows((prev) => [...prev, { ...parsed.data, id: now, created_at: new Date(now).toISOString() }].slice(-100));
    });
    return () => {
      c.end(true);
    };
  }, []);

  const toggleLed = () => {
    const next = !led;
    client.current?.publish(TOPIC_CMD, next ? "ON" : "OFF");
    setLed(next);
  };

  return (
    <TelemetryView
      title="Drone Telemetry · MQTT"
      deviceId={DEVICE}
      rows={rows}
      extra={
        <>
          <span className="flex items-center gap-2 rounded border border-line px-3 py-1 font-mono text-sm">
            <span className="size-2.5 rounded-full" style={{ background: STATUS_COLOR[status] }} />
            broker: {status}
          </span>
          <button
            onClick={toggleLed}
            disabled={status !== "connected"}
            className="rounded border border-line bg-surface px-3 py-1 font-mono text-sm hover:border-accent disabled:opacity-40"
          >
            LED {led ? "ON" : "OFF"} → {led ? "OFF" : "ON"}
          </button>
        </>
      }
    />
  );
}
