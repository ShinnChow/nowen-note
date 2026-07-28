# Issue 512 validation

- backend install: success
- backend typecheck: success
- root document regression: success
- frontend install: success
- frontend build: success

## backend-install
```text

added 257 packages, and audited 258 packages in 6s

47 packages are looking for funding
  run `npm fund` for details

13 vulnerabilities (1 low, 1 moderate, 11 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

## backend-typecheck
```text

> nowen-note-backend@1.4.2 build:tsc
> tsc

```

## backend-test
```text
TAP version 13
# [migrations] applied v1 (init-migration-table-anchor)
# [migrations] applied v2 (workspace-data-isolation-phase1)
# [migrations] applied v3 (workspace-data-isolation-phase2-y1-favorites)
# [migrations] applied v4 (workspace-data-isolation-phase2-y4-mindmaps)
# [migrations] applied v5 (attachments-backfill-workspace-id-from-notes)
# [migrations] applied v6 (users-personal-export-import-per-user-toggle)
# [migrations] applied v7 (embeddings-add-workspace-id-and-backfill)
# [migrations] applied v8 (attachment-content-embeddings)
# [migrations] applied v9 (ai-custom-prompts)
# [migrations] applied v10 (ai-chat-conversations)
# [migrations] v11 backfill attachment_references: scanned 0 notes, inserted 0 rows
# [migrations] applied v11 (attachment-hash-dedup-and-references)
# [migrations] applied v12 (attachment-upload-source)
# [migrations] applied v13 (share-comments-allow-guest)
# [migrations] applied v14 (notebooks-soft-delete)
# [migrations] applied v15 (users-add-isDemo)
# [migrations] applied v16 (notes-fts-rebuild)
# [migrations] applied v17 (mindmap-folders)
# [migrations] applied v18 (notebook-members)
# [migrations] applied v19 (notebook-share-links)
# [migrations] applied v20 (tasks-dueAt)
# [migrations] applied v21 (task-reminders)
# [migrations] applied v22 (task-projects)
# [migrations] applied v23 (task-repeat)
# [migrations] applied v24 (task-templates)
# [migrations] applied v25 (diaries-add-media)
# [migrations] applied v26 (tasks-add-startDate)
# [migrations] applied v27 (task-dependencies)
# [migrations] applied v28 (task-reminders-snoozedUntil)
# [migrations] applied v29 (tasks-add-description)
# [migrations] applied v30 (task-calendar-feeds)
# [migrations] applied v31 (notes-add-contentFormat)
# [migrations] applied v32 (folder-sync-files)
# [migrations] applied v33 (attachment-folders)
# [migrations] applied v34 (journal-type-and-date)
# [migrations] applied v35 (task-repeat-rule-json)
# [migrations] applied v36 (note-links)
# [migrations] applied v37 (note-links-add-fk)
# [migrations] applied v38 (note-links-block-fields)
# [migrations] applied v39 (calendar-export-targets)
# [migrations] applied v40 (note-versions-add-contentFormat)
# [migrations] applied v41 (tasks-repeat-end-count)
# [migrations] applied v42 (user-preferences)
# [migrations] applied v43 (habits-checkins)
# [migrations] applied v44 (tasks-completed-at)
# [migrations] applied v45 (task-activity-events)
# [migrations] applied v46 (repair-notes-fts-index)
# [migrations] applied v47 (user-ai-settings)
# [migrations] applied v48 (knowledge-block-index-and-source-links)
# [migrations] applied v49 (note-import-origins)
# [migrations] applied v50 (share-security-capabilities-lifecycle)
# [migrations] applied v51 (notebook-share-link-lifecycle)
# [migrations] applied v52 (repair-search-content-text)
# [migrations] applied v53 (roundtrip-import-resource-links)
# [migrations] applied v54 (roundtrip-import-batches)
# [migrations] applied v55 (block-authority-store)
# [migrations] applied v56 (yjs-subdocuments)
# [migrations] applied v57 (block-authority-stale-write-guard)
# [migrations] applied v58 (yjs-subdocument-generation)
# [migrations] applied v59 (tag-scope-unique-names)
# ⚠️  [SECURITY] JWT_SECRET 未设置（或长度 < 16），正在使用开发期默认密钥。
#    上线前请务必配置强随机密钥：openssl rand -base64 48
# Subtest: knowledge tree creates rich-text and Markdown documents at root
ok 1 - knowledge tree creates rich-text and Markdown documents at root
  ---
  duration_ms: 630.421907
  type: 'test'
  ...
1..1
# tests 1
# suites 0
# pass 1
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 1022.359608
```

## frontend-install
```text
npm warn deprecated whatwg-encoding@3.1.1: Use @exodus/bytes instead for a more spec-conformant and faster implementation

added 871 packages, and audited 872 packages in 17s

263 packages are looking for funding
  run `npm fund` for details

20 vulnerabilities (1 low, 5 moderate, 13 high, 1 critical)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

## frontend-build
```text
[2mdist/[22m[2massets/[22m[36mpython-BuPzkPfP.js                        [39m[1m[2m    6.48 kB[22m[1m[22m[2m │ gzip:     2.73 kB[22m
[2mdist/[22m[2massets/[22m[36mxquery-CQfU5ijd.js                        [39m[1m[2m    6.62 kB[22m[1m[22m[2m │ gzip:     2.56 kB[22m
[2mdist/[22m[2massets/[22m[36mpug-BwbokVvC.js                           [39m[1m[2m    6.68 kB[22m[1m[22m[2m │ gzip:     1.94 kB[22m
[2mdist/[22m[2massets/[22m[36mtextile-CnDTJFAw.js                       [39m[1m[2m    6.80 kB[22m[1m[22m[2m │ gzip:     2.44 kB[22m
[2mdist/[22m[2massets/[22m[36mnsis-LdVXkNf5.js                          [39m[1m[2m    6.81 kB[22m[1m[22m[2m │ gzip:     2.99 kB[22m
[2mdist/[22m[2massets/[22m[36mnginx-DdIZxoE0.js                         [39m[1m[2m    7.34 kB[22m[1m[22m[2m │ gzip:     2.72 kB[22m
[2mdist/[22m[2massets/[22m[36mpowershell-CFHJl5sT.js                    [39m[1m[2m    7.77 kB[22m[1m[22m[2m │ gzip:     3.33 kB[22m
[2mdist/[22m[2massets/[22m[36mhaxe-H-WmDvRZ.js                          [39m[1m[2m    7.89 kB[22m[1m[22m[2m │ gzip:     2.95 kB[22m
[2mdist/[22m[2massets/[22m[36mgherkin-heZmZLOM.js                       [39m[1m[2m    7.96 kB[22m[1m[22m[2m │ gzip:     5.09 kB[22m
[2mdist/[22m[2massets/[22m[36merlang-BNw1qcRV.js                        [39m[1m[2m    8.07 kB[22m[1m[22m[2m │ gzip:     2.89 kB[22m
[2mdist/[22m[2massets/[22m[36mverilog-C6RDOZhf.js                       [39m[1m[2m    8.24 kB[22m[1m[22m[2m │ gzip:     3.52 kB[22m
[2mdist/[22m[2massets/[22m[36msas-B4kiWyti.js                           [39m[1m[2m    9.33 kB[22m[1m[22m[2m │ gzip:     4.11 kB[22m
[2mdist/[22m[2massets/[22m[36mperl-CdXCOZ3F.js                          [39m[1m[2m    9.75 kB[22m[1m[22m[2m │ gzip:     3.46 kB[22m
[2mdist/[22m[2massets/[22m[36mstateDiagram-AJRCARHV-CnLscOj_.js         [39m[1m[2m   10.43 kB[22m[1m[22m[2m │ gzip:     3.66 kB[22m
[2mdist/[22m[2massets/[22m[36mclojure-BMjYHr_A.js                       [39m[1m[2m   10.82 kB[22m[1m[22m[2m │ gzip:     3.99 kB[22m
[2mdist/[22m[2massets/[22m[36mdiagram-KO2AKTUF-qplAITmo.js              [39m[1m[2m   11.12 kB[22m[1m[22m[2m │ gzip:     4.29 kB[22m
[2mdist/[22m[2massets/[22m[36mdagre-BM42HDAG-N16HJIDE.js                [39m[1m[2m   11.47 kB[22m[1m[22m[2m │ gzip:     4.24 kB[22m
[2mdist/[22m[2massets/[22m[36midl-BEugSyMb.js                           [39m[1m[2m   11.63 kB[22m[1m[22m[2m │ gzip:     4.52 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-i6lL0QQy.js                         [39m[1m[2m   12.74 kB[22m[1m[22m[2m │ gzip:     5.63 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-CiFxXPea.js                         [39m[1m[2m   14.83 kB[22m[1m[22m[2m │ gzip:     6.00 kB[22m
[2mdist/[22m[2massets/[22m[36mdiagram-OG6HWLK6-C3xVVYvd.js              [39m[1m[2m   16.25 kB[22m[1m[22m[2m │ gzip:     5.83 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-D_rIdQWM.js                         [39m[1m[2m   16.29 kB[22m[1m[22m[2m │ gzip:     7.45 kB[22m
[2mdist/[22m[2massets/[22m[36mjavascript-qCveANmP.js                    [39m[1m[2m   17.08 kB[22m[1m[22m[2m │ gzip:     5.75 kB[22m
[2mdist/[22m[2massets/[22m[36mishikawaDiagram-YF4QCWOH-BZEbHCdL.js      [39m[1m[2m   17.76 kB[22m[1m[22m[2m │ gzip:     6.77 kB[22m
[2mdist/[22m[2massets/[22m[36mkanban-definition-UN3LZRKU-K_YKShG6.js    [39m[1m[2m   20.84 kB[22m[1m[22m[2m │ gzip:     7.35 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DxSmnmV0.js                         [39m[1m[2m   21.15 kB[22m[1m[22m[2m │ gzip:     9.73 kB[22m
[2mdist/[22m[2massets/[22m[36mclike-B9uivgTg.js                         [39m[1m[2m   22.30 kB[22m[1m[22m[2m │ gzip:     7.86 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DN4oVlqO.js                         [39m[1m[2m   23.04 kB[22m[1m[22m[2m │ gzip:    10.39 kB[22m
[2mdist/[22m[2massets/[22m[36mmindmap-definition-RKZ34NQL-oCN8Nlrc.js   [39m[1m[2m   23.54 kB[22m[1m[22m[2m │ gzip:     7.98 kB[22m
[2mdist/[22m[2massets/[22m[36mjourneyDiagram-JHISSGLW-C8kaPOev.js       [39m[1m[2m   23.67 kB[22m[1m[22m[2m │ gzip:     8.40 kB[22m
[2mdist/[22m[2massets/[22m[36msankeyDiagram-5OEKKPKP-CzqOihH5.js        [39m[1m[2m   23.75 kB[22m[1m[22m[2m │ gzip:     8.76 kB[22m
[2mdist/[22m[2massets/[22m[36mgraph-GNroL1jB.js                         [39m[1m[2m   23.96 kB[22m[1m[22m[2m │ gzip:     8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mDocxAttachmentPreview-CZBhLkRt.js         [39m[1m[2m   24.90 kB[22m[1m[22m[2m │ gzip:     9.20 kB[22m
[2mdist/[22m[2massets/[22m[36mstylus-B533Al4x.js                        [39m[1m[2m   25.80 kB[22m[1m[22m[2m │ gzip:     8.60 kB[22m
[2mdist/[22m[2massets/[22m[36mwardleyDiagram-YWT4CUSO-BM-qfoE1.js       [39m[1m[2m   26.65 kB[22m[1m[22m[2m │ gzip:     7.19 kB[22m
[2mdist/[22m[2massets/[22m[36merDiagram-TEJ5UH35-C2zjiNbt.js            [39m[1m[2m   27.11 kB[22m[1m[22m[2m │ gzip:     9.45 kB[22m
[2mdist/[22m[2massets/[22m[36mcss-BnMrqG3P.js                           [39m[1m[2m   27.13 kB[22m[1m[22m[2m │ gzip:     8.47 kB[22m
[2mdist/[22m[2massets/[22m[36mgitGraphDiagram-PVQCEYII-CBKgz0pD.js      [39m[1m[2m   30.39 kB[22m[1m[22m[2m │ gzip:     9.02 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DOJ0vkae.js                         [39m[1m[2m   30.82 kB[22m[1m[22m[2m │ gzip:    12.66 kB[22m
[2mdist/[22m[2massets/[22m[36mrequirementDiagram-4Y6WPE33-Bfs5mchR.js   [39m[1m[2m   31.38 kB[22m[1m[22m[2m │ gzip:     9.91 kB[22m
[2mdist/[22m[2massets/[22m[36mtimeline-definition-PNZ67QCA-DA5gNRTj.js  [39m[1m[2m   31.66 kB[22m[1m[22m[2m │ gzip:    10.56 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DZuVzjDy.js                         [39m[1m[2m   32.35 kB[22m[1m[22m[2m │ gzip:    13.09 kB[22m
[2mdist/[22m[2massets/[22m[36mquadrantDiagram-W4KKPZXB-DtJOoM6I.js      [39m[1m[2m   34.66 kB[22m[1m[22m[2m │ gzip:    10.21 kB[22m
[2mdist/[22m[2massets/[22m[36mlayout-DrLK6b4Y.js                        [39m[1m[2m   35.84 kB[22m[1m[22m[2m │ gzip:    12.87 kB[22m
[2mdist/[22m[2massets/[22m[36msql-D0XecflT.js                           [39m[1m[2m   37.05 kB[22m[1m[22m[2m │ gzip:    10.94 kB[22m
[2mdist/[22m[2massets/[22m[36mchunk-AQP2D5EJ-h_yQ6cb9.js                [39m[1m[2m   37.68 kB[22m[1m[22m[2m │ gzip:    12.28 kB[22m
[2mdist/[22m[2massets/[22m[36mwordNoteService-DYHBo4ow.js               [39m[1m[2m   39.05 kB[22m[1m[22m[2m │ gzip:    13.05 kB[22m
[2mdist/[22m[2massets/[22m[36mxychartDiagram-2RQKCTM6-DdEBJPeq.js       [39m[1m[2m   40.48 kB[22m[1m[22m[2m │ gzip:    11.61 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-XxebVvxu.js                         [39m[1m[2m   40.77 kB[22m[1m[22m[2m │ gzip:    16.77 kB[22m
[2mdist/[22m[2massets/[22m[36mvennDiagram-CIIHVFJN-qfrTKp41.js          [39m[1m[2m   42.09 kB[22m[1m[22m[2m │ gzip:    15.72 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-7iXv65SN.js                         [39m[1m[2m   45.14 kB[22m[1m[22m[2m │ gzip:    19.18 kB[22m
[2mdist/[22m[2massets/[22m[36mchunk-727SXJPM-D-pDYSGO.js                [39m[1m[2m   49.18 kB[22m[1m[22m[2m │ gzip:    15.80 kB[22m
[2mdist/[22m[2massets/[22m[36mflowDiagram-I6XJVG4X-CDa3A8Me.js          [39m[1m[2m   61.45 kB[22m[1m[22m[2m │ gzip:    19.64 kB[22m
[2mdist/[22m[2massets/[22m[36mganttDiagram-6RSMTGT7-CCh_pU4B.js         [39m[1m[2m   69.48 kB[22m[1m[22m[2m │ gzip:    23.41 kB[22m
[2mdist/[22m[2massets/[22m[36mc4Diagram-AAUBKEIU-BZ_UNv7X.js            [39m[1m[2m   70.02 kB[22m[1m[22m[2m │ gzip:    19.67 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-Cre47R0Q.js                         [39m[1m[2m   70.84 kB[22m[1m[22m[2m │ gzip:    25.87 kB[22m
[2mdist/[22m[2massets/[22m[36mblockDiagram-GPEHLZMM-CWbs8Cwq.js         [39m[1m[2m   75.44 kB[22m[1m[22m[2m │ gzip:    21.81 kB[22m
[2mdist/[22m[2massets/[22m[36mcose-bilkent-S5V4N54A-B9_VMJkl.js         [39m[1m[2m   81.69 kB[22m[1m[22m[2m │ gzip:    22.53 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-txLG8_Fd.js                         [39m[1m[2m   97.81 kB[22m[1m[22m[2m │ gzip:    28.45 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-BsiMCJ9r.js                         [39m[1m[2m  100.59 kB[22m[1m[22m[2m │ gzip:    33.65 kB[22m
[2mdist/[22m[2massets/[22m[36msequenceDiagram-3UESZ5HK-C_5ajOzi.js      [39m[1m[2m  117.76 kB[22m[1m[22m[2m │ gzip:    31.38 kB[22m
[2mdist/[22m[2massets/[22m[36marchitectureDiagram-3BPJPVTR-BS-9YAnc.js  [39m[1m[2m  149.75 kB[22m[1m[22m[2m │ gzip:    42.39 kB[22m
[2mdist/[22m[2massets/[22m[36mindex.es-Bx1ju8j8.js                      [39m[1m[2m  150.87 kB[22m[1m[22m[2m │ gzip:    51.63 kB[22m
[2mdist/[22m[2massets/[22m[36mhtml2canvas.esm-CNr84Lfu.js               [39m[1m[2m  201.44 kB[22m[1m[22m[2m │ gzip:    48.04 kB[22m
[2mdist/[22m[2massets/[22m[36mkatex-jSfFzGJk.js                         [39m[1m[2m  258.48 kB[22m[1m[22m[2m │ gzip:    77.57 kB[22m
[2mdist/[22m[2massets/[22m[36mjspdf.es.min-BR_SGyb5.js                  [39m[1m[2m  390.42 kB[22m[1m[22m[2m │ gzip:   128.80 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DoMMf5Wg.js                         [39m[1m[2m  396.02 kB[22m[1m[22m[2m │ gzip:   100.22 kB[22m
[2mdist/[22m[2massets/[22m[36mpdf-Crs-i_2s.js                           [39m[1m[2m  409.71 kB[22m[1m[22m[2m │ gzip:   123.28 kB[22m
[2mdist/[22m[2massets/[22m[36mcytoscape.esm-CNLVT6tp.js                 [39m[1m[2m  442.66 kB[22m[1m[22m[2m │ gzip:   142.00 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-tiptap-B0Fpqnfy.js                 [39m[1m[2m  548.80 kB[22m[1m[22m[2m │ gzip:   176.24 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-lib-DbXFBwMr.js                    [39m[1m[2m  593.04 kB[22m[1m[22m[2m │ gzip:   171.80 kB[22m
[2mdist/[22m[2massets/[22m[36mmermaid.core-BtMVa-8I.js                  [39m[1m[2m  597.77 kB[22m[1m[22m[2m │ gzip:   140.46 kB[22m
[2mdist/[22m[2massets/[22m[36mwardley-L42UT6IY-xnwfAHH6.js              [39m[1m[2m  616.46 kB[22m[1m[22m[2m │ gzip:   148.89 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-BjUXkf5V.js                         [39m[1m[33m4,407.66 kB[39m[22m[2m │ gzip: 1,353.19 kB[22m
[33m
(!) Some chunks are larger than 2000 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.[39m
[32m✓ built in 34.04s[39m
```
