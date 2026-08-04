import React, { Suspense } from "react";

const LazyNavRail = React.lazy(() => import("./NavRail"));
type Props = React.ComponentProps<(typeof import("./NavRail"))["default"]>;

export default function LazyNavRailRuntime(props: Props) {
  return (
    <Suspense fallback={<div className="h-full w-14 shrink-0 border-r border-app-border bg-app-sidebar" aria-hidden="true" />}>
      <LazyNavRail {...props} />
    </Suspense>
  );
}
