'use client';

import { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useUserStore } from '@/lib/store';
import { useToast } from '@/lib/toast';
import { formatNaira } from '@/lib/money';

const PRESETS = [5000, 10000, 20000, 50000];

export default function WalletPage() {
  const { wallet, verifyPayment } = useUserStore();
  const toast = useToast();
  const [amount, setAmount] = useState(10000);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const txRef = `reachly_${Date.now()}`;
  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? '',
    tx_ref: txRef,
    amount,
    currency: 'NGN',
    payment_options: 'card,ussd,banktransfer',
    customer: {
      email: 'user@example.com', // TODO: pull the real logged-in user's email once /api/auth/me exposes it here
      phone_number: '2348000000000',
      name: 'Reachly User',
    },
    customizations: {
      title: 'Reachly wallet funding',
      description: 'Fund your Reachly SMS wallet',
      logo: '',
    },
  };

  const handleFlutterPayment = useFlutterwave(flutterwaveConfig);

  const pay = () => {
    setSuccess(false);
    setError('');
    handleFlutterPayment({
      callback: async (response) => {
        closePaymentModal();
        if (response.status !== 'successful' && response.status !== 'completed') {
          setError('Payment was not completed.');
          toast.error('Payment was not completed.');
          return;
        }
        setVerifying(true);
        // Never trust the client callback alone — the backend independently
        // re-verifies this transaction with Flutterwave before crediting.
        const result = await verifyPayment(String(response.transaction_id), response.tx_ref);
        setVerifying(false);
        if (result.ok) {
          setSuccess(true);
          toast.success(`${formatNaira(amount)} added to your wallet.`);
        } else {
          setError(result.error);
          toast.error(result.error);
        }
      },
      onClose: () => {},
    });
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ink">Fund wallet</h1>
      <div className="grid max-w-3xl grid-cols-[1.2fr_1fr] gap-6">
        <div className="rounded-xl border border-border bg-surface p-7">
          <div className="mb-2 text-xs font-bold text-muted">AMOUNT (NGN)</div>
          <input
            type="number"
            min={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="mb-4 w-full rounded-lg border border-border bg-bg px-3.5 py-3.5 text-xl font-bold text-ink"
          />
          <div className="mb-6 flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-ink"
              >
                {formatNaira(p)}
              </button>
            ))}
          </div>
          <button onClick={pay} disabled={verifying} className="w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white disabled:opacity-60">
            {verifying ? 'Verifying payment...' : 'Pay with Flutterwave'}
          </button>
          {success && (
            <div className="mt-4 rounded-lg bg-accentSoft px-3.5 py-3 text-sm font-semibold text-accent">
              Payment successful — your balance has been updated.
            </div>
          )}
          {error && <div className="mt-4 rounded-lg bg-danger/10 px-3.5 py-3 text-sm font-semibold text-danger">{error}</div>}
        </div>
        <div className="h-fit rounded-xl border border-border bg-surface p-7">
          <div className="mb-2 text-xs font-bold text-muted">CURRENT BALANCE</div>
          <div className="text-3xl font-extrabold text-ink">{formatNaira(wallet)}</div>
        </div>
      </div>
    </div>
  );
}
