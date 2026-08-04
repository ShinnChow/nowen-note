import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyFileManager = React.lazy(() => import("./FileManager"));
type Props = React.ComponentProps<(typeof import("./FileManager"))["default"]>;

export default function LazyFileManagerRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载文件管理…" />}>
      <LazyFileManager {...props} />
    </Suspense>
  );
}
