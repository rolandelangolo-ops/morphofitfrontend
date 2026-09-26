import { useTheme } from '../../theme'

/** The supplied artwork is navy ink, which all but disappears on the obsidian
 * dark theme — so each asset ships in a cream-ink variant too, and we pick by
 * the active theme. `mark` is the monogram alone (square, for compact chrome);
 * `full` is the complete lockup including the "MorphoFit" wordmark. */
type LogoVariant = 'mark' | 'full'

const SRC: Record<LogoVariant, { light: string; dark: string }> = {
  // `light`/`dark` name the THEME, not the artwork: on the light theme we
  // want the dark-ink original.
  mark: { light: '/brand/logo-mark.png', dark: '/brand/logo-mark-light.png' },
  full: { light: '/brand/logo-full.png', dark: '/brand/logo-full-light.png' },
}

export function BrandLogo({
  variant = 'mark',
  className = '',
  alt = 'MorphoFit',
  ...rest
}: {
  variant?: LogoVariant
  className?: string
  alt?: string
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'className'>) {
  const { theme } = useTheme()
  return (
    <img
      src={SRC[variant][theme === 'dark' ? 'dark' : 'light']}
      alt={alt}
      // Decorative when it sits next to the wordmark in text; callers that
      // rely on it as the only branding pass their own alt.
      draggable={false}
      className={`select-none object-contain ${className}`}
      {...rest}
    />
  )
}

export default BrandLogo
