import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-server";
import { telemetryInput } from "@/types/telemetry";

const error = (status: number, message: string, details?: unknown) =>
  NextResponse.json({ error: message, details }, { status });

function validKey(given: string | null) {
  const a = Buffer.from(given ?? "");
  const b = Buffer.from(process.env.DEVICE_KEY!);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!process.env.DEVICE_KEY) return error(500, "DEVICE_KEY belum di-set di server");
  if (!validKey(req.headers.get("x-api-key"))) return error(401, "API key salah");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(400, "Body bukan JSON valid");
  }

  const parsed = telemetryInput.safeParse(body);
  if (!parsed.success) return error(400, "Payload tidak valid", z.flattenError(parsed.error).fieldErrors);

  const { data, error: dbError } = await supabaseAdmin()
    .from("telemetry")
    .insert(parsed.data)
    .select()
    .single();
  if (dbError) return error(500, "Gagal menyimpan", dbError.message);

  return NextResponse.json(data, { status: 201 });
}

const query = z.object({
  device_id: z.string().min(1).max(64).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

export async function GET(req: NextRequest) {
  const parsed = query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return error(400, "Query tidak valid", z.flattenError(parsed.error).fieldErrors);
  const { device_id, limit } = parsed.data;

  let q = supabaseAdmin().from("telemetry").select("*").order("created_at", { ascending: false }).limit(limit);
  if (device_id) q = q.eq("device_id", device_id);

  const { data, error: dbError } = await q;
  if (dbError) return error(500, "Gagal membaca", dbError.message);

  return NextResponse.json(data);
}
