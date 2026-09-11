import { useState } from "react";
import { type Order } from "../../api";
import { AppIcon } from "../ui/icons";
import { Modal } from "../ui/Modal";

interface PaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  /** Persists the real order-status update — must throw on failure so this
   * modal doesn't show "Payment Confirmed" for an update that never
   * actually happened. */
  onPaymentSuccess: (orderId: string) => Promise<void>;
}

export default function PaymentModal({ order, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<"mtn" | "orange" | "card">("mtn");
  const [phone, setPhone] = useState("677 89 45 12");
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [processing, setProcessing] = useState(false);
  const [stepState, setStepState] = useState<"form" | "authorizing" | "success">("form");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!order) return null;

  const basePrice = order.price || 65000;
  const deliveryFee = 3500;
  const totalAmount = basePrice + deliveryFee;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setPaymentError(null);
    setStepState("authorizing");

    // The gateway handshake itself is simulated (no real MTN MoMo / Orange
    // Money / card processor is integrated) — but the order update it leads
    // to is real, and the modal only reaches the success screen if that
    // actually persists.
    setTimeout(async () => {
      try {
        await onPaymentSuccess(order.id);
        setStepState("success");
        setTimeout(() => {
          setProcessing(false);
          onClose();
        }, 1200);
      } catch (err) {
        setProcessing(false);
        setStepState("form");
        setPaymentError(err instanceof Error ? err.message : "Payment could not be confirmed — please try again.");
      }
    }, 1800);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Secure Escrow Checkout" size="md">
      {stepState === "authorizing" ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-forest opacity-25" />
            <div className="flex h-full w-full items-center justify-center rounded-full bg-forest text-white">
              <AppIcon name="refresh" size={26} className="animate-spin" />
            </div>
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            Authorizing Payment API
          </h3>
          <p className="max-w-xs font-body text-xs text-ink-muted">
            {method === "card"
              ? "Verifying 3D Secure bank handshake..."
              : `Pushing USSD payment prompt to +237 ${phone}... Please confirm PIN on your phone.`}
          </p>
        </div>
      ) : stepState === "success" ? (
        <div className="flex flex-col items-center justify-center space-y-3 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <AppIcon name="checkCircle" size={32} />
          </div>
          <h3 className="font-display text-lg font-bold text-ink">
            Payment Confirmed & Escrowed!
          </h3>
          <p className="font-body text-xs text-ink-muted">
            Order #{order.id.slice(-6)} is confirmed. Tailor has been notified to commence fabric cutting and production.
          </p>
        </div>
      ) : (
        <form onSubmit={handlePay} className="space-y-5">
          {/* Item & Price Summary */}
          <div className="space-y-2.5 rounded-2xl border border-parchment-dark bg-parchment p-4 font-body text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Garment: {order.item}</span>
              <span className="font-data font-semibold text-ink">
                {order.currency} {basePrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Smart Courier Delivery (Dynamic Match)</span>
              <span className="font-data font-semibold text-ink">
                {order.currency} {deliveryFee.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-forest">
                MorphoFit Escrow Buyer Guarantee
              </span>
              <span className="font-data font-bold text-forest">
                FREE (Protected)
              </span>
            </div>
            <div className="flex justify-between border-t border-parchment-dark pt-2 font-bold">
              <span className="font-display text-sm text-ink">
                Total Payable
              </span>
              <span className="font-data text-base font-bold text-forest">
                {order.currency} {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <span className="mb-2 block font-data text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
              Select Payment Method
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "mtn", label: "MTN MoMo", sub: "Mobile Money" },
                { id: "orange", label: "Orange Money", sub: "Mobile Money" },
                { id: "card", label: "Credit Card", sub: "Visa / Mastercard" },
              ].map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as "mtn" | "orange" | "card")}
                    className={`flex flex-col items-center rounded-2xl border p-2.5 text-center transition-all ${
                      active
                        ? "border-forest bg-parchment ring-2 ring-forest/30"
                        : "border-parchment-dark bg-surface hover:bg-parchment/50"
                    }`}
                  >
                    <span className="font-display text-xs font-bold text-ink">
                      {m.label}
                    </span>
                    <span className="font-body text-[10px] text-ink-muted">
                      {m.sub}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Details Inputs */}
          {method === "card" ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-body text-[11px] text-ink-muted">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full rounded-xl border border-parchment-dark bg-surface px-3 py-2 font-data text-xs text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  defaultValue="12/28"
                  className="rounded-xl border border-parchment-dark bg-surface px-3 py-2 font-data text-xs text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
                <input
                  type="password"
                  placeholder="CVC"
                  defaultValue="888"
                  className="rounded-xl border border-parchment-dark bg-surface px-3 py-2 font-data text-xs text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1 block font-body text-[11px] text-ink-muted">
                {method === "mtn" ? "MTN Mobile Money Number" : "Orange Money Number"}
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border border-parchment-dark bg-parchment px-2.5 py-2 font-data text-xs text-ink">
                  +237
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-parchment-dark bg-surface px-3 py-2 font-data text-xs text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest/20"
                />
              </div>
            </div>
          )}

          {/* Escrow Badge Notice */}
          <div className="flex items-start gap-2.5 rounded-xl border border-forest/20 bg-forest/5 p-3">
            <AppIcon name="shieldCheck" size={16} className="mt-0.5 flex-shrink-0 text-forest" />
            <p className="font-body text-[11px] leading-relaxed text-ink">
              <strong>Escrow Protection Active:</strong> Your payment of {order.currency} {totalAmount.toLocaleString()} will be held in escrow until the dress is tailored and delivered to your doorstep.
            </p>
          </div>

          {/* Sandbox Notice — no real payment gateway is wired up yet */}
          <div className="flex items-start gap-2.5 rounded-xl border border-parchment-dark bg-parchment p-3">
            <AppIcon name="info" size={16} className="mt-0.5 flex-shrink-0 text-ink-subtle" />
            <p className="font-body text-[11px] leading-relaxed text-ink-muted">
              <strong>Sandbox payment:</strong> no real MTN MoMo, Orange Money, or card charge is made. Confirming here updates the order to "Confirmed (Escrow Paid)" for demo purposes only.
            </p>
          </div>

          {paymentError && (
            <div className="rounded-xl border border-seal/20 bg-[var(--status-error-bg)] p-3 text-xs font-body text-[var(--status-error-text)]">
              {paymentError}
            </div>
          )}

          <button
            type="submit"
            disabled={processing}
            className="w-full rounded-2xl bg-forest py-3 font-data text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all hover:opacity-95 active:scale-98 disabled:opacity-50"
          >
            Authorize Payment ({order.currency} {totalAmount.toLocaleString()})
          </button>
        </form>
      )}
    </Modal>
  );
}
