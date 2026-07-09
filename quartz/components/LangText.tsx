// Renders both language variants inline; the active one is shown via the
// `saved-lang` attribute on <html> plus the CSS rules in langtoggle.scss.
// This is a plain Preact component (used inside other components), not a
// QuartzComponentConstructor.
export function T({ en, ko }: { en: string; ko: string }) {
  return (
    <>
      <span class="i18n-en">{en}</span>
      <span class="i18n-ko">{ko}</span>
    </>
  )
}
