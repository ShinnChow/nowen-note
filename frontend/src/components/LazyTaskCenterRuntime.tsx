import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyTaskCenter = React.lazy(() => import("./TaskCenter"));
type Props = React.ComponentProps<(typeof import("./TaskCenter"))["default"]>;

export default function LazyTaskCenterRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载任务中心…" />}>
      <LazyTaskCenter {...props} />
    </Suspense>
  );
}
