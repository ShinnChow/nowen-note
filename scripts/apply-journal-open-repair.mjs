import { readFileSync, writeFileSync } from "node:fs";

// Deterministic one-shot integration patch. Safe to run repeatedly.
const path = "frontend/src/components/daily-records/DailyJournalView.tsx";
let source = readFileSync(path, "utf8");

const buttonBefore = `                  <button
                    type="button"
                    onClick={() => openNote(journal)}
                    className="rounded-lg bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/15"
                  >`;
const buttonAfter = `                  <button
                    type="button"
                    onClick={() => void createOrOpenJournal()}
                    disabled={creating}
                    className="rounded-lg bg-accent-primary/10 px-3 py-1.5 text-xs font-medium text-accent-primary hover:bg-accent-primary/15 disabled:opacity-60"
                  >`;
if (!source.includes("disabled={creating}\n                    className=\"rounded-lg bg-accent-primary/10")) {
  if (!source.includes(buttonBefore)) throw new Error("journal edit button anchor missing");
  source = source.replace(buttonBefore, buttonAfter);
}

const cardBefore = `                <button
                  type="button"
                  onClick={() => openNote(journal)}
                  className="block min-h-[190px] w-full px-5 py-5 text-left hover:bg-app-hover/20"
                >`;
const cardAfter = `                <button
                  type="button"
                  onClick={() => void createOrOpenJournal()}
                  disabled={creating}
                  className="block min-h-[190px] w-full px-5 py-5 text-left hover:bg-app-hover/20 disabled:opacity-70"
                >`;
if (!source.includes("className=\"block min-h-[190px] w-full px-5 py-5 text-left hover:bg-app-hover/20 disabled:opacity-70\"")) {
  if (!source.includes(cardBefore)) throw new Error("journal content card anchor missing");
  source = source.replace(cardBefore, cardAfter);
}

const occurrences = source.match(/onClick=\{\(\) => void createOrOpenJournal\(\)\}/g)?.length || 0;
if (occurrences < 3) throw new Error(`expected three explicit journal open/create entrypoints, got ${occurrences}`);

writeFileSync(path, source);
