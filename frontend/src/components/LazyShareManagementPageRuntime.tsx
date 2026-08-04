import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyShareManagementPage = React.lazy(() => import("./ShareManagementPage"));
type Props = React.ComponentProps<(typeof import("./ShareManagementPage"))["default"]>;

export default function LazyShareManagementPageRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载分享管理…" />}>
      <LazyShareManagementPage {...props} />
    </Suspense>
  );
}
