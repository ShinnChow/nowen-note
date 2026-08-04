import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyAIChatPanel = React.lazy(() => import("./AIChatReliabilityShell"));
type Props = React.ComponentProps<(typeof import("./AIChatReliabilityShell"))["default"]>;

export default function LazyAIChatPanelRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载 AI 助手…" />}>
      <LazyAIChatPanel {...props} />
    </Suspense>
  );
}
