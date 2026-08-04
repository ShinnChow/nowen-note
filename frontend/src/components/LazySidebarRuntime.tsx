import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazySidebar = React.lazy(() => import("./Sidebar"));
type Props = React.ComponentProps<(typeof import("./Sidebar"))["default"]>;

export default function LazySidebarRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载目录…" />}>
      <LazySidebar {...props} />
    </Suspense>
  );
}
