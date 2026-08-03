import { readFileSync, writeFileSync } from "node:fs";

const apiPath = "frontend/src/lib/knowledgeTreeApi.ts";
let apiSource = readFileSync(apiPath, "utf8");

const queryBefore = `function workspaceQuery(includeDeleted = false): string {
  const workspaceId = getCurrentWorkspace();
  const params = new URLSearchParams({ workspaceId });
  if (includeDeleted) params.set("includeDeleted", "1");
  return params.toString();
}`;
const queryAfter = `function workspaceQuery(includeDeleted = false, workspaceIdOverride?: string): string {
  const workspaceId = workspaceIdOverride || getCurrentWorkspace();
  const params = new URLSearchParams({ workspaceId });
  if (includeDeleted) params.set("includeDeleted", "1");
  return params.toString();
}`;
if (!apiSource.includes("workspaceIdOverride?: string")) {
  if (!apiSource.includes(queryBefore)) throw new Error("knowledgeTree workspaceQuery anchor not found");
  apiSource = apiSource.replace(queryBefore, queryAfter);
}

const listBefore = `  list(includeDeleted = false) {
    return request<{ nodes: KnowledgeTreeNode[] }>(\`/?\${workspaceQuery(includeDeleted)}\`).then(withDisplaySort);
  },`;
const listAfter = `  list(includeDeleted = false) {
    return request<{ nodes: KnowledgeTreeNode[] }>(\`/?\${workspaceQuery(includeDeleted)}\`).then(withDisplaySort);
  },

  listForWorkspace(workspaceId: string, includeDeleted = false) {
    return request<{ nodes: KnowledgeTreeNode[] }>(
      \`/?\${workspaceQuery(includeDeleted, workspaceId)}\`,
    ).then(withDisplaySort);
  },`;
if (!apiSource.includes("listForWorkspace(workspaceId: string")) {
  if (!apiSource.includes(listBefore)) throw new Error("knowledgeTree list anchor not found");
  apiSource = apiSource.replace(listBefore, listAfter);
}

const createBefore = `  create(input: { parentId: string | null; nodeType: "folder" | "note" | "markdown" | "word"; title: string }) {
    return request<KnowledgeTreeNode>(\`/nodes?\${workspaceQuery()}\`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },`;
const createAfter = `  create(input: { parentId: string | null; nodeType: "folder" | "note" | "markdown" | "word"; title: string }) {
    return request<KnowledgeTreeNode>(\`/nodes?\${workspaceQuery()}\`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  createForWorkspace(
    workspaceId: string,
    input: { parentId: string | null; nodeType: "folder" | "note" | "markdown" | "word"; title: string },
  ) {
    return request<KnowledgeTreeNode>(\`/nodes?\${workspaceQuery(false, workspaceId)}\`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },`;
if (!apiSource.includes("createForWorkspace(")) {
  if (!apiSource.includes(createBefore)) throw new Error("knowledgeTree create anchor not found");
  apiSource = apiSource.replace(createBefore, createAfter);
}
writeFileSync(apiPath, apiSource);

const viewPath = "frontend/src/components/daily-records/DailyJournalView.tsx";
let viewSource = readFileSync(viewPath, "utf8");
viewSource = viewSource.replace(
  "knowledgeTreeApi.list({ workspaceId: null }).catch(() => ({ nodes: [] as KnowledgeTreeNode[] }))",
  'knowledgeTreeApi.listForWorkspace("personal").catch(() => ({ nodes: [] as KnowledgeTreeNode[] }))',
);
viewSource = viewSource.replace(
  "      const node = await knowledgeTreeApi.create({\n        parentId: journalNode.id,",
  '      const node = await knowledgeTreeApi.createForWorkspace("personal", {\n        parentId: journalNode.id,',
);
if (!viewSource.includes('knowledgeTreeApi.listForWorkspace("personal")')) {
  throw new Error("Daily journal personal list patch did not apply");
}
if (!viewSource.includes('knowledgeTreeApi.createForWorkspace("personal"')) {
  throw new Error("Daily journal personal create patch did not apply");
}
writeFileSync(viewPath, viewSource);
