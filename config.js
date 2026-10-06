const CONFIG = {
  // 选题类型标签
  topicTypes: ["日常", "搞笑", "剧情", "好物", "其他"],

  // 主指标：列表显示、「待补数据」判断、统计图表都用它
  mainMetric: "plays",

  // 运营数据字段（补数据时填），按顺序显示
  metrics: [
    { key: "plays",      label: "播放",     unit: "",  accounts: ["内容号", "带货号"], stat: "avg" },
    { key: "finishRate", label: "完播率",   unit: "%", accounts: ["内容号", "带货号"], stat: "avg", min: 0, max: 100, decimal: true },
    { key: "likes",      label: "点赞",     unit: "",  accounts: ["内容号", "带货号"] },
    { key: "comments",   label: "评论",     unit: "",  accounts: ["内容号", "带货号"] },
    { key: "favorites",  label: "收藏",     unit: "",  accounts: ["内容号", "带货号"] },
    { key: "shares",     label: "分享",     unit: "",  accounts: ["内容号", "带货号"] },
    { key: "newFans",    label: "涨粉",     unit: "",  accounts: ["内容号", "带货号"] },
    { key: "orders",     label: "出单数",   unit: "",  accounts: ["带货号"], stat: "sum" },
    { key: "commission", label: "佣金",     unit: "元", accounts: ["带货号"], stat: "sum", decimal: true },
  ],
};
