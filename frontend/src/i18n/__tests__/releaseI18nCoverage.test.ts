import { describe, expect, it } from "vitest";
import zhBase from "../locales/zh-CN.json";
import enBase from "../locales/en.json";
import {
  enAdditionalTranslations,
  zhCNAdditionalTranslations,
} from "../additionalTranslations";

type TranslationTree = Record<string, unknown>;

function merge(base: TranslationTree, patch: TranslationTree): TranslationTree {
  const result: TranslationTree = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      result[key] = merge(current as TranslationTree, value as TranslationTree);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function getPath(tree: TranslationTree, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    return (value as TranslationTree)[key];
  }, tree);
}

function leafEntries(tree: unknown, prefix = ""): Array<[string, string]> {
  if (!tree || typeof tree !== "object" || Array.isArray(tree)) return [];
  const result: Array<[string, string]> = [];
  for (const [key, value] of Object.entries(tree as TranslationTree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") result.push([path, value]);
    else result.push(...leafEntries(value, path));
  }
  return result.sort(([a], [b]) => a.localeCompare(b));
}

function interpolationNames(value: string): string[] {
  return Array.from(value.matchAll(/{{\s*([\w.-]+)\s*}}/g), (match) => match[1]).sort();
}

const zh = merge(zhBase as TranslationTree, zhCNAdditionalTranslations as unknown as TranslationTree);
const en = merge(enBase as TranslationTree, enAdditionalTranslations as unknown as TranslationTree);

const criticalNamespaces = [
  "editorError",
  "workspaceMembers",
  "attachmentDetail",
  "settings.versionCompare",
  "dataManager.sync",
  "dataManager.desktopData",
] as const;

describe("release i18n coverage", () => {
  it.each(criticalNamespaces)("keeps %s key and interpolation parity", (namespace) => {
    const zhEntries = leafEntries(getPath(zh, namespace));
    const enEntries = leafEntries(getPath(en, namespace));

    expect(zhEntries.map(([path]) => path)).toEqual(enEntries.map(([path]) => path));

    const enByPath = new Map(enEntries);
    for (const [path, zhValue] of zhEntries) {
      const enValue = enByPath.get(path);
      expect(enValue, `${namespace}.${path} must exist in English`).toBeTypeOf("string");
      expect(interpolationNames(zhValue)).toEqual(interpolationNames(enValue!));
    }
  });

  it("patches the known sidebar locale drift in both directions", () => {
    for (const key of [
      "emptyTrash",
      "emptyTrashConfirmTitle",
      "emptyTrashConfirm",
      "emptyTrashSuccess",
      "emptyTrashSkipped",
      "emptyTrashEmpty",
      "emptyTrashFailed",
      "taskCount",
      "taskCount_plural",
    ]) {
      expect(getPath(zh, `sidebar.${key}`), `zh-CN sidebar.${key}`).toBeTypeOf("string");
      expect(getPath(en, `sidebar.${key}`), `en sidebar.${key}`).toBeTypeOf("string");
    }
  });
});
