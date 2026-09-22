export const HEIGHT_MIN = 100
export const HEIGHT_MAX = 260

export const isHeightValid = (h: number) => Number.isFinite(h) && h >= HEIGHT_MIN && h <= HEIGHT_MAX

/** The one input both scan methods need: the real stature that scales every estimate. */
export function HeightField({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  const valid = isHeightValid(value)
  return (
    <div className="max-w-xs">
      <label htmlFor="scan-height" className="block text-[10px] font-data font-semibold uppercase tracking-wider text-ink-subtle">
        Your height (cm)
      </label>
      <input
        id="scan-height"
        type="number"
        inputMode="decimal"
        min={HEIGHT_MIN}
        max={HEIGHT_MAX}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`mt-1.5 w-full rounded-xl border bg-surface px-3 py-2 text-sm font-bold font-data text-forest focus:outline-none focus:border-forest ${
          valid ? 'border-parchment-dark' : 'border-seal'
        }`}
      />
      <p className={`mt-1.5 text-[11px] font-body ${valid ? 'text-ink-subtle' : 'text-[var(--status-error-text)]'}`}>
        {valid ? 'This is the scale for every measurement, so use your real height.' : `Enter a height between ${HEIGHT_MIN} and ${HEIGHT_MAX} cm.`}
      </p>
    </div>
  )
}

export default HeightField
