import { z } from "zod";

// Payload dikirim ESP32. Field tak dikenal dibuang oleh z.object.
export const telemetryInput = z.object({
  device_id: z.string().min(1).max(64),
  ax: z.number(),
  ay: z.number(),
  az: z.number(),
  gx: z.number(),
  gy: z.number(),
  gz: z.number(),
  temp: z.number(),
  pressure: z.number(),
  altitude: z.number(),
  battery: z.number().int().min(0).max(100),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export type TelemetryInput = z.infer<typeof telemetryInput>;

// Baris di tabel `telemetry`.
export type Telemetry = TelemetryInput & { id: number; created_at: string };
