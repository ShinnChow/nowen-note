import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyEditorSplitView = React.lazy(() => import("./EditorSplitView"));
type Props = React.ComponentProps<(typeof import("./EditorSplitView"))["default"]>;

export default function LazyEditorSplitViewRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载分屏编辑器…" />}>
      <LazyEditorSplitView {...props} />
    </Suspense>
  );
}
