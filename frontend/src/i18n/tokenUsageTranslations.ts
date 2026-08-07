export const zhCNTokenUsageTranslations = {
  tokens: {
    usage: {
      loadFail: "加载失败",
      title: "使用概览",
      subtitle: "汇总你所有令牌的调用情况",
      daysLabel: "{{n}}天",
      loading: "加载统计…",
      callsUnit: "次调用",
      compareHint: "对比上一个 {{n}} 天周期",
      chartAria: "每日令牌调用量柱状图",
      topTitle: "活跃令牌排行",
      empty: "过去 {{n}} 天还没有任何令牌调用。让你的应用开始干活吧 ✨",
    },
  },
} as const;

export const enTokenUsageTranslations = {
  tokens: {
    usage: {
      loadFail: "Failed to load usage statistics",
      title: "Usage overview",
      subtitle: "A summary of API calls across all your tokens",
      daysLabel: "{{n}} days",
      loading: "Loading statistics…",
      callsUnit: "calls",
      compareHint: "Compared with the previous {{n}}-day period",
      chartAria: "Daily token usage bar chart",
      topTitle: "Most active tokens",
      empty: "No token calls in the past {{n}} days yet. Once your apps start using tokens, activity will appear here. ✨",
    },
  },
} as const;
