import { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { api, type UserPublic } from "../../../api";

const ROLE_LABEL: Record<string, string> = {
  client: "Client",
  stylist: "Stylist",
  tailor: "Tailor",
  delivery_agent: "Delivery Agent",
  admin: "Admin",
};

export function NewChatModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (user: UserPublic) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPublic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api.users
        .search(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <Modal open={open} onClose={onClose} title="New message" size="sm">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name…"
        className="mb-3 w-full rounded-xl border border-parchment-dark bg-surface px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/15"
      />
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {loading && (
          <div className="px-2 py-4 text-center font-body text-xs text-ink-subtle">Searching…</div>
        )}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <div className="px-2 py-4 text-center font-body text-xs text-ink-subtle">No one found</div>
        )}
        {!loading && query.trim().length < 2 && (
          <div className="px-2 py-4 text-center font-body text-xs text-ink-subtle">Type at least 2 characters to search.</div>
        )}
        {results.map((person) => (
          <button
            key={person.id}
            onClick={() => onSelect(person)}
            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-parchment"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest font-display font-bold text-white shadow-xs">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                person.name[0]?.toUpperCase()
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-body text-sm font-medium text-ink">{person.name}</span>
              <span className="block font-data text-[10px] uppercase tracking-wide text-ink-subtle">
                {ROLE_LABEL[person.role] ?? person.role}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
