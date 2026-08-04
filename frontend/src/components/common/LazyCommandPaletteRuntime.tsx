import React, { Suspense } from "react";

const LazyCommandPalette = React.lazy(() => import("./CommandPalette"));
type Props = React.ComponentProps<(typeof import("./CommandPalette"))["default"]>;

/** SearchCenter and command-search helpers are not needed until the palette is actually opened. */
export default function LazyCommandPaletteRuntime(props: Props) {
  if (!props.open) return null;
  return (
    <Suspense fallback={null}>
      <LazyCommandPalette {...props} />
    </Suspense>
  );
}
