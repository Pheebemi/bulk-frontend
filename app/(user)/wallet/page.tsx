'use client';

import { useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useUserStore } from '@/lib/store';
import { formatNaira } from '@/lib/money';

const PRESETS = [5000, 10000, 20000, 50000];

export default function WalletPage() {
  const { wallet, fundWallet } = useUserStore();
  const [amount, setAmount] = useState(10000);
  const [success, setSuccess] = useState(false);

  const flutterwaveConfig = {
    public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? '',
    tx_ref: `reachly_${Date.now()}`,
    amount,
    currency: 'NGN',
    payment_options: 'card,ussd,banktransfer',
    customer: {
      email: 'user@example.com', // TODO: pull from authenticated user once bulk-backend exists
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
    handleFlutterPayment({
      callback: (response) => {
        // TODO: send response.transaction_id to the backend to verify server-side
        // before crediting — client-side crediting here is a placeholder until
        // bulk-backend's Flutterwave webhook exists.
        if (response.status === 'successful' || response.status === 'completed') {
          fundWallet(amount);
          setSuccess(true);
        }
        closePaymentModal();
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
          <button onClick={pay} className="w-full rounded-lg bg-accent py-3.5 text-sm font-bold text-white">
            Pay with Flutterwave
          </button>
          {success && (
            <div className="mt-4 rounded-lg bg-accentSoft px-3.5 py-3 text-sm font-semibold text-accent">
              Payment successful — your balance has been updated.
            </div>
          )}
        </div>
        <div className="h-fit rounded-xl border border-border bg-surface p-7">
          <div className="mb-2 text-xs font-bold text-muted">CURRENT BALANCE</div>
          <div className="text-3xl font-extrabold text-ink">{formatNaira(wallet)}</div>
        </div>
      </div>
    </div>
  );
}
