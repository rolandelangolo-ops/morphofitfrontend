import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import { type Order } from "../../api";
import { AppIcon } from "../ui/icons";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

interface NegotiationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAcceptQuote: (orderId: string, agreedPrice: number) => void;
  /** Persists a counter-offer (price + notes) via the real order-update API
   * — must throw if the request fails, so the modal doesn't claim success
   * for a negotiation entry that was never actually saved. The caller
   * applies the server's response (including the freshly appended
   * negotiationHistory entry) back onto the `order` prop, which is what
   * actually updates the trail below — this modal never fabricates entries
   * of its own. */
  onUpdateQuote?: (orderId: string, newPrice: number, notes: string) => Promise<void>;
}

const TYPE_LABEL: Record<string, string> = {
  quote: "Initial Quote",
  counter: "Counter-Offer",
  acceptance: "Accepted",
};

export default function NegotiationModal({
  order,
  isOpen,
  onClose,
  onAcceptQuote,
  onUpdateQuote,
}: NegotiationModalProps) {
  const { user } = useAuth();
  const { show } = useToast();

  const [counterPrice, setCounterPrice] = useState<number>(order?.price || 0);
  const [proposalNote, setProposalNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The modal stays mounted across different order selections (Orders.tsx
  // never unmounts it, just toggles `isOpen`) — reset the draft fields
  // whenever a DIFFERENT order is opened, so a stale price/note from the
  // previous order doesn't linger. The trail itself needs no such reseeding
  // since it's read straight from `order.negotiationHistory`, not local state.
  useEffect(() => {
    setCounterPrice(order?.price || 0);
    setProposalNote("");
  }, [order?.id]);

  if (!order) return null;

  const history = order.negotiationHistory;
  const currentAgreedPrice = history[history.length - 1]?.amount || order.price || 0;

  const handleSubmitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterPrice || submitting) return;

    setSubmitting(true);
    try {
      await onUpdateQuote?.(order.id, counterPrice, proposalNote);
      setProposalNote("");
    } catch (err) {
      show({
        title: "Couldn't record counter-offer",
        description: err instanceof Error ? err.message : "The order was not updated — please try again.",
        tone: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = () => {
    onAcceptQuote(order.id, currentAgreedPrice);
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Transparent Design & Price Negotiation" size="lg">
      <div className="space-y-5">
        {/* Order & Specification Snapshot */}
        <div className="rounded-2xl border border-parchment-dark bg-parchment p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <span className="font-data text-[10px] uppercase font-semibold tracking-wider text-forest">
                Order #{order.id.slice(-6)}
              </span>
              <h3 className="font-display text-base font-bold text-ink">
                {order.item}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-xl border border-parchment-dark bg-surface px-2.5 py-1 font-body text-xs font-semibold text-ink shadow-xs">
                Morphology: {order.morphology?.toUpperCase() || "HOURGLASS"}
              </span>
              <span className="rounded-xl border border-parchment-dark bg-surface px-2.5 py-1 font-body text-xs font-semibold text-ink shadow-xs">
                Fabric: {order.fabric || "Silk Satin"}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Cost Breakdown */}
        <div className="rounded-2xl border border-parchment-dark bg-surface p-4">
          <span className="mb-2 block font-data text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
            Artisan Cost Estimate Breakdown
          </span>
          <div className="space-y-2 font-body text-xs">
            <div className="flex justify-between">
              <span className="text-ink-muted">Fabric & Textile Sourcing (3.5m premium textile)</span>
              <span className="font-data font-semibold text-ink">
                {order.currency} {Math.round(currentAgreedPrice * 0.42).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Morphology Pattern Drafting & Hand Cutting</span>
              <span className="font-data font-semibold text-ink">
                {order.currency} {Math.round(currentAgreedPrice * 0.28).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Atelier Tailoring & Hand-finishing</span>
              <span className="font-data font-semibold text-ink">
                {order.currency} {Math.round(currentAgreedPrice * 0.30).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t border-parchment-dark pt-2 font-bold">
              <span className="font-display text-ink">Current Standing Quote</span>
              <span className="font-data text-base text-forest">
                {order.currency} {currentAgreedPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Recorded Negotiation History — the real, shared, persisted trail
            (Order.negotiationHistory), identical for both parties and kept
            live by Orders.tsx's socket subscription. */}
        <div>
          <span className="mb-2 block font-data text-[10px] uppercase tracking-[0.2em] text-ink-subtle">
            Recorded Negotiation Trail
          </span>
          <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="rounded-xl border border-dashed border-parchment-dark p-3 text-xs font-body text-ink-subtle">
                No offers recorded yet — submit the first quote below.
              </p>
            ) : (
              history.map((entry) => {
                const isMe = entry.authorId === user?.id;
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl border p-3 text-xs transition-all ${
                      entry.type === "acceptance"
                        ? "border-forest bg-forest/5"
                        : isMe
                        ? "border-parchment-dark bg-forest/5"
                        : "border-parchment-dark bg-surface"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-display font-bold text-ink">
                        {entry.authorName} ({entry.authorRole.toUpperCase()})
                      </span>
                      <span className="font-data text-[10px] text-ink-subtle">
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="font-body leading-relaxed text-ink-muted">
                      {entry.notes || TYPE_LABEL[entry.type]}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between border-t border-parchment-dark pt-1">
                      <span className="font-data text-[10px] uppercase text-ink-subtle">
                        {TYPE_LABEL[entry.type]}:
                      </span>
                      <span className="font-data font-bold text-forest">
                        {order.currency} {entry.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Counter Offer Input Form */}
        <form onSubmit={handleSubmitCounter} className="space-y-3 rounded-2xl border border-parchment-dark bg-surface p-4">
          <span className="block font-data text-[10px] uppercase tracking-wider text-ink-subtle">
            {user?.role === "tailor" ? "Revise Quote as Tailor" : "Submit Counter-Offer as Client"}
          </span>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-body text-[11px] text-ink-muted">
                Proposed Price ({order.currency})
              </label>
              <input
                type="number"
                step="1000"
                value={counterPrice}
                onChange={(e) => setCounterPrice(Number(e.target.value))}
                className="w-full rounded-xl border border-parchment-dark bg-surface px-3 py-2 font-data text-sm font-bold text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest/20"
              />
            </div>

            <div>
              <label className="mb-1 block font-body text-[11px] text-ink-muted">
                Explanation / Alteration Scope
              </label>
              <input
                type="text"
                placeholder="e.g. Include express lining, slight cuff taper..."
                value={proposalNote}
                onChange={(e) => setProposalNote(e.target.value)}
                className="w-full rounded-xl border border-parchment-dark bg-surface px-3 py-2 font-body text-xs text-ink outline-none focus:border-forest focus:ring-1 focus:ring-forest/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl border border-parchment-dark bg-surface px-4 py-2 font-body text-xs font-semibold text-ink transition-colors hover:bg-parchment disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Recording…" : "Record Counter-Offer"}
            </button>

            {/* Accept Quote Button */}
            <button
              type="button"
              onClick={handleAccept}
              className="flex items-center gap-2 rounded-xl bg-forest px-5 py-2 font-data text-xs font-bold text-white shadow-xs transition-transform active:scale-95 hover:opacity-95"
            >
              <AppIcon name="check" size={14} />
              Accept Quote & Proceed to Payment
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
