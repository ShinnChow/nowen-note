import React, { Suspense } from "react";
import LazyWorkspaceFallback from "./LazyWorkspaceFallback";

const LazyNoteList = React.lazy(() => import("./NoteList"));
type Props = React.ComponentProps<(typeof import("./NoteList"))["default"]>;

export default function LazyNoteListRuntime(props: Props) {
  return (
    <Suspense fallback={<LazyWorkspaceFallback label="正在加载笔记列表…" />}>
      <LazyNoteList {...props} />
    </Suspense>
  );
}
