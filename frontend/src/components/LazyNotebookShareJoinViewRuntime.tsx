import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyNotebookShareJoinView = React.lazy(() => import("./NotebookShareJoinView"));
type Props = React.ComponentProps<(typeof import("./NotebookShareJoinView"))["default"]>;

export default function LazyNotebookShareJoinViewRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载共享笔记本…" />}>
      <LazyNotebookShareJoinView {...props} />
    </Suspense>
  );
}
