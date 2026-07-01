/**
 * Feellog keepalive Worker
 *
 * 무료 Supabase는 7일간 활동이 없으면 자동 일시정지된다(데모/심사 때 "안 열림" 사고).
 * 이 Worker가 8시간마다 public.ping() RPC를 호출해 DB를 "활동 중"으로 유지한다.
 * (Supabase 자체 스케줄러는 이미 잠들면 자기를 못 깨우므로 바깥에서 찔러야 한다.)
 *
 * Pro로 전환하면 자동 일시정지가 없어지므로 이 Worker는 그때 삭제해도 된다.
 */
interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export default {
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/ping`, {
      method: 'POST',
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    console.log(`[keepalive] ping → HTTP ${res.status}`);
  },
};
