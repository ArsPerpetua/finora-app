// A16: endpoint ringan untuk uptime monitor eksternal (mis. UptimeRobot, Better Stack).
// Publik, tanpa secret — hanya melapor status hidup/mati dan apakah database terjangkau,
// tidak membocorkan data apa pun. Query paling murah yang bisa dijalankan: satu kolom, satu baris.
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const db = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_SERVICE_ROLE_KEY || 'kosong', { auth: { persistSession: false } });

export default async () => {
  const startedAt = Date.now();
  const { error } = await db.from('profiles').select('id').limit(1);
  const body = {
    status: error ? 'degraded' : 'ok',
    db: !error,
    checked_at: new Date().toISOString(),
    latency_ms: Date.now() - startedAt,
  };
  return new Response(JSON.stringify(body), {
    status: error ? 503 : 200,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
