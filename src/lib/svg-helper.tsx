// Wraps a raw SVG string in a div that React can render via
// dangerouslySetInnerHTML. Used by mechanic-animations.tsx so we don't
// have to maintain JSX copies of every SVG separately.
//
// Forces width=100% and height=100% on the inner <svg> element so it
// fills its container regardless of whether the SVG string declared
// explicit dimensions. Without this, an SVG with only viewBox falls
// back to its default 300×150 size (per the SVG spec) and won't
// stretch to a constrained container.

import type { ReactNode } from "react"

export function dangerousSvg(svgString: string): ReactNode {
  // Inject style="width:100%;height:100%;display:block" inline on the
  // <svg> tag — inline style beats any external CSS that might be
  // setting width/height to auto. The display:block also kills the
  // baseline gap that inline-block elements get by default.
  const responsive = svgString.replace(
    /<svg\b/,
    '<svg style="width:100%;height:100%;display:block" preserveAspectRatio="xMidYMid meet"'
  )
  return (
    <div
      style={{ width: "100%", height: "100%", display: "block" }}
      dangerouslySetInnerHTML={{ __html: responsive }}
    />
  )
}
