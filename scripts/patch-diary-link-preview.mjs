import { readFileSync, writeFileSync } from "node:fs";

const path = "frontend/src/components/daily-records/DailyJournalView.tsx";
let source = readFileSync(path, "utf8").replace(/^\uFEFF/, "");

const importAnchor = 'import { confirm as confirmDialog } from "@/components/ui/confirm";\n';
const importReplacement = `${importAnchor}import DailyJournalContentPreview from "@/components/daily-records/DailyJournalContentPreview";\n`;
if (!source.includes(importAnchor)) throw new Error("DailyJournalView import anchor not found");
source = source.replace(importAnchor, importReplacement);

const oldBlock = `              {journal ? (
                <button
                  type="button"
                  onClick={() => void createOrOpenJournal()}
                  disabled={creating}
                  className="block min-h-[190px] w-full px-5 py-5 text-left hover:bg-app-hover/20 disabled:opacity-70"
                >
                  {preview ? (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-tx-secondary">{preview}</p>
                  ) : (
                    <div className="flex min-h-[130px] flex-col items-center justify-center text-center">
                      <Sparkles size={24} className="mb-2 text-accent-primary/60" />
                      <p className="text-sm text-tx-secondary">这一天还没有正文</p>
                      <p className="mt-1 text-xs text-tx-tertiary">点击开始记录或整理当天的瞬间</p>
                    </div>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-[11px] text-tx-tertiary">
                    <Clock3 size={12} />
                    <span>{journal.updatedAt ? \`更新于 \${new Date(journal.updatedAt).toLocaleString()}\` : ""}</span>
                  </div>
                </button>
              ) : (
`;

const newBlock = `              {journal ? (
                <div className="min-h-[190px]">
                  {preview ? (
                    <DailyJournalContentPreview
                      note={journal}
                      onOpenEditor={() => void createOrOpenJournal()}
                      className={creating ? "pointer-events-none opacity-70" : undefined}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => void createOrOpenJournal()}
                      disabled={creating}
                      className="flex min-h-[150px] w-full flex-col items-center justify-center px-5 py-5 text-center hover:bg-app-hover/20 disabled:opacity-70"
                    >
                      <Sparkles size={24} className="mb-2 text-accent-primary/60" />
                      <p className="text-sm text-tx-secondary">这一天还没有正文</p>
                      <p className="mt-1 text-xs text-tx-tertiary">点击开始记录或整理当天的瞬间</p>
                    </button>
                  )}
                  <div className="flex items-center gap-2 border-t border-app-border/70 px-5 py-3 text-[11px] text-tx-tertiary">
                    <Clock3 size={12} />
                    <span>{journal.updatedAt ? \`更新于 \${new Date(journal.updatedAt).toLocaleString()}\` : ""}</span>
                  </div>
                </div>
              ) : (
`;

if (!source.includes(oldBlock)) throw new Error("DailyJournalView preview block anchor not found");
source = source.replace(oldBlock, newBlock);
writeFileSync(path, source, "utf8");
console.log("DailyJournalView link preview patch applied");
