import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyDiaryCenter = React.lazy(() => import("./DiaryCenter"));
type Props = React.ComponentProps<(typeof import("./DiaryCenter"))["default"]>;

export default function LazyDiaryCenterRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载日记中心…" />}>
      <LazyDiaryCenter {...props} />
    </Suspense>
  );
}
