import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';

const PLANS: Record<string, { title: string; price: number }> = {
  dante_plus: { title: 'Dante Plus', price: 4.9 },
  dante_premium: { title: 'Dante Premium', price: 9.9 },
  dante_premium_plus: { title: 'Dante Premium+', price: 19.9 },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const Route = createFileRoute('/api/public/mercadopago-checkout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = process.env['MERCADOPAGO_ACCESS_TOKEN'];
          if (!token) {
            return json({ error: 'Pagamento não configurado (MERCADOPAGO_ACCESS_TOKEN ausente).' }, 500);
          }

          const authHeader = request.headers.get('Authorization') ?? '';
          if (!authHeader.startsWith('Bearer ')) return json({ error: 'Não autenticado.' }, 401);

          const supabaseUrl = (process.env['MEU_SUPABASE_URL'] ?? '')
            .replace(/\/rest\/v1\/?$/, '')
            .replace(/\/$/, '');
          const supabase = createClient(
            supabaseUrl,
            process.env['MEU_SUPABASE_ANON_KEY']!,
            { auth: { persistSession: false, autoRefreshToken: false } },
          );
          const { data: userData, error: userErr } = await supabase.auth.getUser(
            authHeader.slice(7),
          );
          if (userErr || !userData.user) {
            return json({ error: 'Sessão inválida. Faça login novamente.' }, 401);
          }

          const body = (await request.json().catch(() => ({}))) as {
            plan?: string;
            success_url?: string;
          };
          const planId = String(body.plan ?? '');
          const plan = PLANS[planId];
          if (!plan) return json({ error: `Plano inválido: ${planId}` }, 400);

          // back_urls precisa ser https absoluto, senão o Mercado Pago rejeita auto_return.
          const successUrl = /^https:\/\//.test(body.success_url ?? '') ? body.success_url! : '';

          const preference: Record<string, unknown> = {
            items: [
              {
                id: planId,
                title: plan.title,
                description: `Assinatura mensal ${plan.title}`,
                quantity: 1,
                currency_id: 'BRL',
                unit_price: plan.price,
              },
            ],
            payer: { email: userData.user.email },
            external_reference: `${userData.user.id}:${planId}`,
            metadata: { user_id: userData.user.id, plan: planId },
          };

          if (successUrl) {
            preference['back_urls'] = {
              success: successUrl,
              failure: successUrl,
              pending: successUrl,
            };
            preference['auto_return'] = 'approved';
          }

          const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(preference),
          });

          const raw = await mpRes.text();
          if (!mpRes.ok) {
            console.error('Mercado Pago erro', mpRes.status, raw);
            let msg = `Mercado Pago recusou a solicitação (${mpRes.status}).`;
            try {
              const e = JSON.parse(raw) as {
                message?: string;
                error?: string;
                cause?: Array<{ description?: string }>;
              };
              if (e.cause?.[0]?.description) msg = e.cause[0].description;
              else if (e.message) msg = e.message;
              else if (e.error) msg = e.error;
            } catch {
              /* mantém mensagem padrão */
            }
            return json({ error: msg }, 400);
          }

          const data = JSON.parse(raw) as {
            init_point?: string;
            sandbox_init_point?: string;
            id?: string;
          };
          return json({
            init_point: data.init_point ?? data.sandbox_init_point,
            id: data.id,
          });
        } catch (err) {
          console.error('Falha no checkout Mercado Pago:', err);
          return json(
            { error: `Falha no checkout: ${err instanceof Error ? err.message : String(err)}` },
            500,
          );
        }
      },
    },
  },
});
