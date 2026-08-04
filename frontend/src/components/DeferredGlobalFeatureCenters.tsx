import React from "react";

import TaskDataTransferBridgeV2 from "./TaskDataTransferBridgeV2";
import SystemFullDataTransferBridge from "./SystemFullDataTransferBridge";
import BackupWebDavBridge from "./BackupWebDavBridge";
import NoteImageExportCenter from "./NoteImageExportCenter";
import DocxImportCenter from "./DocxImportCenter";
import PublicSpaceLauncher from "./PublicSpaceLauncher";
import NoteTransferCenter from "./NoteTransferCenter";
import RoundTripImportBatchCenter from "./RoundTripImportBatchCenter";
import RoundTripPermissionMappingCenter from "./RoundTripPermissionMappingCenter";
import RoundTripPermissionExportCenter from "./RoundTripPermissionExportCenter";
import SiyuanImportProgressBridge from "./SiyuanImportProgressBridge";

/**
 * Low-frequency authenticated feature centers.
 *
 * These components mostly subscribe to explicit import/export/transfer events and render nothing
 * until the user starts the corresponding operation. Keeping them in one asynchronous boundary
 * prevents JSZip, image export, migration and backup UI dependencies from joining the login chunk.
 */
export default function DeferredGlobalFeatureCenters() {
  return (
    <>
      <TaskDataTransferBridgeV2 />
      <SystemFullDataTransferBridge />
      <BackupWebDavBridge />
      <NoteImageExportCenter />
      <DocxImportCenter />
      <PublicSpaceLauncher />
      <NoteTransferCenter />
      <RoundTripImportBatchCenter />
      <RoundTripPermissionMappingCenter />
      <RoundTripPermissionExportCenter />
      <SiyuanImportProgressBridge />
    </>
  );
}
