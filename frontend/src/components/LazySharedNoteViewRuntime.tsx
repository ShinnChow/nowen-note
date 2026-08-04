import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazySharedNoteView = React.lazy(() => import("./SharedNoteCommentDisplayRuntime"));
type Props = React.ComponentProps<(typeof import("./SharedNoteCommentDisplayRuntime"))["default"]>;

export default function LazySharedNoteViewRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载分享内容…" />}>
      <LazySharedNoteView {...props} />
    </Suspense>
  );
}
