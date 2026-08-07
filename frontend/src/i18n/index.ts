import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import zhCN from "./locales/zh-CN.json";
import en from "./locales/en.json";

const zhCNWithRuntimeOverrides = {
  ...zhCN,
  auth: {
    ...zhCN.auth,
    ugreenAccess: {
      ...zhCN.auth.ugreenAccess,
      // Android/iOS 只能在系统浏览器中打开绿联远程工作台，不能回到当前 App 自动续登。
      button: "在系统浏览器中打开",
    },
  },
  tiptap: {
    ...zhCN.tiptap,
    indent: "增加块级缩进（代码块内 Tab 仅调整代码内容）",
    outdent: "减少块级缩进（代码块内 Shift+Tab 仅调整代码内容）",
  },
};

const enWithRuntimeOverrides = {
  ...en,
  auth: {
    ...en.auth,
    ugreenAccess: {
      ...en.auth.ugreenAccess,
      // Native mobile opens the UGREEN workspace in the system browser; it does not resume in-app sign-in.
      button: "Open in system browser",
    },
  },
  tiptap: {
    ...en.tiptap,
    indent: "Increase block indent (Tab only indents code inside code blocks)",
    outdent: "Decrease block indent (Shift+Tab only indents code inside code blocks)",
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "zh-CN": { translation: zhCNWithRuntimeOverrides },
      en: { translation: enWithRuntimeOverrides },
    },
    fallbackLng: "zh-CN",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

export default i18n;
