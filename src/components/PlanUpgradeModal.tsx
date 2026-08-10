import { Check, Crown, Diamond, Plus, Sparkles, X } from 'lucide-react';
import type { PlanType } from '@/lib/supabase';
import { PLANS } from '@/lib/plans';
import { Modal } from '@/components/Modal';
import { useState } from 'react';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

export function PlanUpgradeModal({
  open,
  onClose,
  currentPlan,
}: {
  open: boolean;
  onClose: () => void;
  currentPlan: PlanType;
}) {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const checkout = async (planId: PlanType) => {
    if (planId === 'free') return;
    setLoadingPlan(planId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast('Você precisa estar logado.', 'error');
        return;
      }
      const apiUrl = `${SUPABASE_URL}/functions/v1/mercadopago-checkout`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          plan: planId,
          success_url: window.location.origin,
        }),
      });
      const raw = await res.text();
      let data: { init_point?: string; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        toast(data.error || `Erro ao iniciar pagamento (${res.status}).`, 'error');
        return;
      }
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        toast('Erro ao obter link de pagamento.', 'error');
      }
    } catch {
      toast('Erro de conexão.', 'error');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Escolha seu plano" maxWidth="max-w-3xl">
      <div className="mb-4 text-center text-sm text-grape-200/70">
        Você atingiu o limite diário de mensagens do seu plano. Faça upgrade para continuar conversando com o Dante!
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.filter((p) => p.id !== 'free').map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const Icon = plan.badgeIcon === 'plus' ? Plus : plan.badgeIcon === 'crown' ? Crown : Diamond;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-5 transition ${
                plan.highlight
                  ? 'border-sky2-400/50 bg-sky2-400/10'
                  : 'border-white/10 bg-white/5'
              } ${isCurrent ? 'ring-2 ring-grape-400' : ''}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky2-400 to-rose-400 px-3 py-0.5 text-[10px] font-bold text-white">
                  MAIS POPULAR
                </span>
              )}
              <div
                className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
              >
                <Icon size={24} strokeWidth={2.5} />
              </div>
              <h3 className="font-display text-lg font-semibold text-grape-50">{plan.name}</h3>
              <p className="text-2xl font-bold text-grape-50">
                {plan.priceLabel.split('/')[0]}
                <span className="text-sm font-normal text-grape-200/60">/mês</span>
              </p>
              <p className="mt-1 text-sm text-grape-200/70">{plan.dailyLimit} mensagens/dia</p>
              <button
                onClick={() => checkout(plan.id)}
                disabled={isCurrent || loadingPlan === plan.id}
                className={`mt-4 w-full rounded-full py-2.5 text-sm font-semibold transition ${
                  isCurrent
                    ? 'cursor-default border border-white/20 bg-white/5 text-grape-200/50'
                    : 'bg-gradient-to-r from-sky2-400 to-rose-400 text-white hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {isCurrent
                  ? 'Plano atual'
                  : loadingPlan === plan.id
                    ? 'Redirecionando...'
                    : 'Assinar agora'}
              </button>
            </div>
          );
        })}
      </div>
      <button
        onClick={onClose}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 py-2.5 text-sm text-grape-200/70 hover:bg-white/5"
      >
        <X size={16} /> Fechar
      </button>
    </Modal>
  );
}

export function PlanComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-grape-200/70">
            <th className="py-3 pr-4 font-semibold">Plano</th>
            <th className="py-3 px-4 font-semibold">Preço</th>
            <th className="py-3 px-4 font-semibold">Mensagens/dia</th>
            <th className="py-3 pl-4 font-semibold">Selo</th>
          </tr>
        </thead>
        <tbody>
          {PLANS.map((plan) => {
            const Icon =
              plan.badgeIcon === 'plus'
                ? Plus
                : plan.badgeIcon === 'crown'
                  ? Crown
                  : plan.badgeIcon === 'diamond'
                    ? Diamond
                    : Sparkles;
            return (
              <tr key={plan.id} className="border-b border-white/5">
                <td className="py-3 pr-4 font-medium text-grape-50">{plan.name}</td>
                <td className="py-3 px-4 text-grape-200/80">{plan.priceLabel}</td>
                <td className="py-3 px-4 text-grape-200/80">{plan.dailyLimit}</td>
                <td className="py-3 pl-4">
                  {plan.badgeLabel ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
                    >
                      <Icon size={10} strokeWidth={3} />
                      {plan.badgeLabel}
                    </span>
                  ) : (
                    <span className="text-grape-200/40">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
