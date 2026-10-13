// The big full-width wordmark. The SVG stretches the text to fill its width at any screen size.
export function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 150" role="img" aria-label="ThreadMark" className={className} fill="currentColor">
      <text
        x="0"
        y="145"
        fontSize="205"
        fontWeight="900"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        style={{ fontFamily: "var(--font-sans-body), sans-serif" }}
      >
        THREADMARK
      </text>
    </svg>
  );
}
