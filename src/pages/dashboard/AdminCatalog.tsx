import { useState, useMemo } from 'react'
import { Card, PillButton } from '../../components/ui/primitives'
import { AppIcon } from '../../components/ui/icons'
import { PageShell } from '../../components/ui/PageShell'
import { useToast } from '../../components/ui/Toast'

interface CatalogGarment {
  id: string
  name: string
  category: string
  basePrice: number
  currency: string
  recommendedMorphologies: string[]
  fabrics: string[]
  active: boolean
}

const DEFAULT_CATALOG: CatalogGarment[] = [
  {
    id: 'cat-1',
    name: 'Architectural Wrap Midi Dress',
    category: 'Dresses',
    basePrice: 65000,
    currency: 'XAF',
    recommendedMorphologies: ['Hourglass', 'Pear'],
    fabrics: ['Silk Satin', 'Linen', 'Ankara Wax'],
    active: true,
  },
  {
    id: 'cat-2',
    name: 'Bespoke Structured Blazer & Trouser',
    category: 'Suiting',
    basePrice: 85000,
    currency: 'XAF',
    recommendedMorphologies: ['Rectangle', 'Inverted Triangle', 'Oval'],
    fabrics: ['Worsted Wool', 'Raw Linen'],
    active: true,
  },
  {
    id: 'cat-3',
    name: 'A-Line Boatneck Evening Gown',
    category: 'Evening',
    basePrice: 95000,
    currency: 'XAF',
    recommendedMorphologies: ['Pear', 'Rectangle'],
    fabrics: ['Royal Velvet', 'Silk Satin'],
    active: true,
  },
  {
    id: 'cat-4',
    name: 'Regal Empire-Waist Pleated Gown',
    category: 'Gala',
    basePrice: 110000,
    currency: 'XAF',
    recommendedMorphologies: ['Oval', 'Inverted Triangle'],
    fabrics: ['Silk Satin', 'Chiffon'],
    active: true,
  },
  {
    id: 'cat-5',
    name: 'Sculpted Peplum & Pencil Cut',
    category: 'Couture',
    basePrice: 78000,
    currency: 'XAF',
    recommendedMorphologies: ['Hourglass', 'Rectangle'],
    fabrics: ['Ankara Wax', 'Velvet'],
    active: true,
  },
]

export default function AdminCatalog() {
  const { show } = useToast()
  const [catalog, setCatalog] = useState<CatalogGarment[]>(DEFAULT_CATALOG)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const categories = ['all', 'Dresses', 'Suiting', 'Evening', 'Gala', 'Couture']

  const filtered = useMemo(() => {
    return catalog.filter((item) => {
      const matchCat =
        categoryFilter === 'all' || item.category === categoryFilter
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.fabrics.some((f) => f.toLowerCase().includes(search.toLowerCase()))
      return matchCat && matchSearch
    })
  }, [catalog, categoryFilter, search])

  const handleToggleActive = (id: string) => {
    setCatalog((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    )
    show({
      title: 'Catalog Status Updated (Preview Only)',
      description: "This toggle isn't connected to a live catalog yet — it won't affect what clients see.",
      tone: 'info',
    })
  }

  const headerActions = (
    <PillButton
      variant="primary"
      size="sm"
      icon="sparkles"
      onClick={() =>
        show({
          title: 'Not available yet',
          description: 'Adding a new silhouette requires a live catalog backend, which is not built yet.',
          tone: 'info',
        })
      }
    >
      Add Silhouette
    </PillButton>
  )

  return (
    <PageShell
      title="Service Catalog & Style Registry"
      subtitle="Manage digital tailoring silhouettes, morphology matching algorithms & baseline pricing"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Preview Notice — no live catalog backend exists yet */}
        <Card className="flex items-start gap-3 p-4 border-parchment-dark bg-parchment">
          <AppIcon name="info" size={16} className="mt-0.5 flex-shrink-0 text-ink-subtle" />
          <p className="text-xs font-body text-ink-muted leading-relaxed">
            <strong className="text-ink">Preview —</strong> this catalog isn't connected to a live backend yet.
            The silhouettes below are illustrative and editing them here doesn't change what clients see.
          </p>
        </Card>

        {/* Controls toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <AppIcon
              name="search"
              size={15}
              className="absolute left-3.5 top-3 text-ink-subtle"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search silhouettes, fabrics..."
              className="w-full rounded-xl border border-parchment-dark bg-surface pl-9 pr-4 py-2 text-xs font-body text-ink placeholder:text-ink-subtle focus:border-forest focus:outline-none shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoryFilter(c)}
                className={`rounded-full px-3 py-1 text-[10px] font-data font-semibold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  categoryFilter === c
                    ? 'bg-forest text-white'
                    : 'bg-parchment text-ink-muted hover:bg-parchment-dark/60'
                }`}
              >
                {c === 'all' ? 'All Silhouettes' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Card List */}
        <Card className="overflow-hidden" padding="none">
          <div className="flex items-center justify-between border-b border-parchment-dark px-6 py-3.5 bg-surface">
            <span className="text-[10px] font-data font-semibold text-ink-subtle uppercase tracking-wider">
              {filtered.length} of {catalog.length} 3D Garment Models
            </span>
          </div>

          <div className="divide-y divide-parchment-dark">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-parchment/60"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-bold font-display text-ink truncate">
                      {item.name}
                    </span>
                    <span className="rounded-full border border-parchment-dark bg-parchment px-2.5 py-0.5 text-[9px] font-bold font-data uppercase text-forest">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[10px] font-data text-ink-subtle uppercase">
                      Morphology Fits:
                    </span>
                    {item.recommendedMorphologies.map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium font-body text-emerald-800"
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
                    <span className="text-[10px] font-data text-ink-subtle uppercase">
                      Fabrics:
                    </span>
                    <span className="font-body text-xs">{item.fabrics.join(', ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span className="block text-[9px] font-data text-ink-subtle uppercase">
                      Baseline Benchmark
                    </span>
                    <span className="text-base font-bold font-data text-ink">
                      {item.currency} {item.basePrice.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(item.id)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold font-data uppercase tracking-wider transition-colors ${
                      item.active
                        ? 'border-forest bg-forest/10 text-forest'
                        : 'border-parchment-dark bg-surface text-ink-subtle'
                    }`}
                  >
                    {item.active ? 'Published' : 'Draft'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageShell>
  )
}
