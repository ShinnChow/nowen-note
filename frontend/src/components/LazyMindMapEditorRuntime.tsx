import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyMindMapEditor = React.lazy(() => import("./MindMapEditor"));
type Props = React.ComponentProps<(typeof import("./MindMapEditor"))["default"]>;

export default function LazyMindMapEditorRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载思维导图…" />}>
      <LazyMindMapEditor {...props} />
    </Suspense>
  );
}
