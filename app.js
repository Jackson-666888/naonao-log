(function () {
  "use strict";

  const STORAGE_KEYS = {
    records: "naonao.records",
    lastAccount: "naonao.lastAccount",
    lastBackupAt: "naonao.lastBackupAt",
  };

  const ACCOUNT_CONTENT = "内容号";
  const ACCOUNT_COMMERCE = "带货号";
  const VALID_ACCOUNTS = [ACCOUNT_CONTENT, ACCOUNT_COMMERCE];
  const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  const form = document.querySelector("#record-form");
  const publishedAtInput = document.querySelector("#published-at");
  const accountInput = document.querySelector("#account");
  const accountButtons = Array.from(document.querySelectorAll("#account-options [data-account]"));
  const titleInput = document.querySelector("#title");
  const productField = document.querySelector("#product-field");
  const productInput = document.querySelector("#product");
  const productSuggestions = document.querySelector("#product-suggestions");
  const topicOptions = document.querySelector("#topic-options");
  const topicTypeInput = document.querySelector("#topic-type");
  const productionHoursInput = document.querySelector("#production-hours");
  const notesInput = document.querySelector("#notes");
  const formMessage = document.querySelector("#form-message");
  const navButtons = Array.from(document.querySelectorAll(".nav-button"));
  const pages = Array.from(document.querySelectorAll(".page"));
  const listView = document.querySelector("#list-view");
  const detailView = document.querySelector("#detail-view");
  const recordList = document.querySelector("#record-list");
  const listEmpty = document.querySelector("#list-empty");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const detailForm = document.querySelector("#detail-form");
  const detailIdInput = document.querySelector("#detail-id");
  const detailPublishedAtInput = document.querySelector("#detail-published-at");
  const detailAccountInput = document.querySelector("#detail-account");
  const detailAccountButtons = Array.from(document.querySelectorAll("[data-detail-account]"));
  const detailTitleInput = document.querySelector("#detail-title");
  const detailProductField = document.querySelector("#detail-product-field");
  const detailProductInput = document.querySelector("#detail-product");
  const detailTopicOptions = document.querySelector("#detail-topic-options");
  const detailTopicTypeInput = document.querySelector("#detail-topic-type");
  const detailProductionHoursInput = document.querySelector("#detail-production-hours");
  const detailNotesInput = document.querySelector("#detail-notes");
  const metricFields = document.querySelector("#metric-fields");
  const detailMessage = document.querySelector("#detail-message");
  const detailBackButton = document.querySelector("#detail-back");
  const deleteRecordButton = document.querySelector("#delete-record");
  const statsEmpty = document.querySelector("#stats-empty");
  const statsContent = document.querySelector("#stats-content");
  const statsDescription = document.querySelector("#stats-description");
  const statCards = document.querySelector("#stat-cards");
  const recentChartTitle = document.querySelector("#recent-chart-title");
  const recentChart = document.querySelector("#recent-chart");
  const topicChartTitle = document.querySelector("#topic-chart-title");
  const topicChart = document.querySelector("#topic-chart");
  const commissionChartCard = document.querySelector("#commission-chart-card");
  const commissionChart = document.querySelector("#commission-chart");
  const backupStatus = document.querySelector("#backup-status");
  const exportCsvButton = document.querySelector("#export-csv");
  const exportBackupButton = document.querySelector("#export-backup");
  const chooseRestoreFileButton = document.querySelector("#choose-restore-file");
  const restoreFileInput = document.querySelector("#restore-file");
  const backupMessage = document.querySelector("#backup-message");

  let activeFilter = "全部";
  let editingRecord = null;
  let detailMetricDraft = {};

  init();

  function init() {
    renderTopicOptions();
    renderProductSuggestions();
    renderList();
    bindEvents();
    setAccount(loadLastAccount());
    resetPublishedAt();
    registerServiceWorker();
  }

  function registerServiceWorker() {
    const canRegister = "serviceWorker" in navigator
      && (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    if (!canRegister) {
      return;
    }

    navigator.serviceWorker.register("./sw.js", { scope: "./" })
      .catch((error) => console.warn("离线功能注册失败。", error));
  }

  function bindEvents() {
    accountButtons.forEach((button) => {
      button.addEventListener("click", () => setAccount(button.dataset.account));
    });

    form.addEventListener("submit", saveRecord);

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => setListFilter(button.dataset.filter));
    });

    recordList.addEventListener("click", (event) => {
      const recordButton = event.target instanceof Element
        ? event.target.closest("[data-record-id]")
        : null;
      if (recordButton) {
        openDetail(recordButton.dataset.recordId);
      }
    });

    detailAccountButtons.forEach((button) => {
      button.addEventListener("click", () => {
        captureMetricDraft();
        setDetailAccount(button.dataset.detailAccount);
      });
    });

    detailForm.addEventListener("submit", updateRecord);
    detailBackButton.addEventListener("click", showListView);
    deleteRecordButton.addEventListener("click", deleteEditingRecord);
    exportCsvButton.addEventListener("click", exportCsv);
    exportBackupButton.addEventListener("click", exportBackup);
    chooseRestoreFileButton.addEventListener("click", chooseRestoreFile);
    restoreFileInput.addEventListener("change", restoreBackup);

    navButtons.forEach((button) => {
      button.addEventListener("click", () => showPage(button.dataset.target));
    });
  }

  function renderTopicOptions() {
    topicOptions.replaceChildren();

    CONFIG.topicTypes.forEach((topicType) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tag-button";
      button.textContent = topicType;
      button.dataset.topicType = topicType;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => toggleTopicType(button));
      topicOptions.append(button);
    });
  }

  function toggleTopicType(selectedButton) {
    const isAlreadySelected = selectedButton.classList.contains("is-selected");

    topicOptions.querySelectorAll(".tag-button").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });

    topicTypeInput.value = isAlreadySelected ? "" : selectedButton.dataset.topicType;
    if (!isAlreadySelected) {
      selectedButton.classList.add("is-selected");
      selectedButton.setAttribute("aria-pressed", "true");
    }
  }

  function setAccount(account) {
    const nextAccount = VALID_ACCOUNTS.includes(account) ? account : ACCOUNT_CONTENT;
    accountInput.value = nextAccount;
    localStorage.setItem(STORAGE_KEYS.lastAccount, nextAccount);

    accountButtons.forEach((button) => {
      const isSelected = button.dataset.account === nextAccount;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    const isCommerce = nextAccount === ACCOUNT_COMMERCE;
    productField.hidden = !isCommerce;
    productInput.required = isCommerce;
    if (!isCommerce) {
      productInput.value = "";
    }

    clearMessage();
  }

  function saveRecord(event) {
    event.preventDefault();
    clearMessage();

    const error = validateForm();
    if (error) {
      showMessage(error.message, false);
      error.field.focus();
      return;
    }

    const record = {
      id: createId(),
      publishedAt: publishedAtInput.value,
      account: accountInput.value,
      title: titleInput.value.trim(),
      product: accountInput.value === ACCOUNT_COMMERCE ? productInput.value.trim() : "",
      topicType: topicTypeInput.value,
      productionHours: productionHoursInput.value === "" ? null : Number(productionHoursInput.value),
      notes: notesInput.value.trim(),
      metrics: {},
      createdAt: new Date().toISOString(),
    };

    const records = loadRecords();
    records.push(record);
    saveRecords(records);

    const keptAccount = accountInput.value;
    form.reset();
    clearSelectedTopic();
    setAccount(keptAccount);
    resetPublishedAt();
    renderProductSuggestions();
    renderList();
    showMessage("记好啦", true);
    titleInput.focus();
  }

  function validateForm() {
    if (!publishedAtInput.value) {
      return { field: publishedAtInput, message: "先选一下发布时间" };
    }

    if (!titleInput.value.trim()) {
      return { field: titleInput, message: "先写一下标题或选题" };
    }

    if (accountInput.value === ACCOUNT_COMMERCE && !productInput.value.trim()) {
      return { field: productInput, message: "带货号要写带的什么品" };
    }

    if (productionHoursInput.value !== "" && Number(productionHoursInput.value) < 0) {
      return { field: productionHoursInput, message: "制作耗时不能小于 0" };
    }

    return null;
  }

  function loadRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.records) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.warn("本地记录读取失败，将从空记录继续。", error);
      return [];
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEYS.records, JSON.stringify(records));
  }

  function loadLastAccount() {
    const savedAccount = localStorage.getItem(STORAGE_KEYS.lastAccount);
    return VALID_ACCOUNTS.includes(savedAccount) ? savedAccount : ACCOUNT_CONTENT;
  }

  function renderProductSuggestions() {
    const products = new Set();

    loadRecords().forEach((record) => {
      if (typeof record.product === "string" && record.product.trim()) {
        products.add(record.product.trim());
      }
    });

    productSuggestions.replaceChildren();
    Array.from(products)
      .sort((first, second) => first.localeCompare(second, "zh-CN"))
      .forEach((product) => {
        const option = document.createElement("option");
        option.value = product;
        productSuggestions.append(option);
      });
  }

  function setListFilter(filter) {
    activeFilter = filter;

    filterButtons.forEach((button) => {
      const isSelected = button.dataset.filter === filter;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    renderList();
  }

  function renderList() {
    const records = loadRecords()
      .filter((record) => activeFilter === "全部" || record.account === activeFilter)
      .sort((first, second) => getPublishedTime(second) - getPublishedTime(first));

    recordList.replaceChildren();
    listEmpty.hidden = records.length > 0;
    listEmpty.textContent = loadRecords().length === 0
      ? "还没有记录，先去记一条吧"
      : "这个账号还没有记录";

    records.forEach((record) => {
      recordList.append(createRecordCard(record));
    });
  }

  function createRecordCard(record) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "record-card";
    button.dataset.recordId = record.id;
    button.setAttribute("aria-label", `${formatPublishedAt(record.publishedAt)} ${record.account || ""} ${record.title || "未命名"}`);

    const top = document.createElement("span");
    top.className = "record-card-top";
    top.append(
      createTextElement("span", "record-date", formatPublishedAt(record.publishedAt)),
      createTextElement("span", "record-account", record.account || "—"),
    );

    const title = createTextElement("span", "record-card-title", record.title || "未命名");

    const bottom = document.createElement("span");
    bottom.className = "record-card-bottom";

    if (record.account === ACCOUNT_COMMERCE && record.product) {
      bottom.append(createTextElement("span", "record-product", record.product));
    }

    if (isPendingData(record)) {
      bottom.append(createTextElement("span", "pending-badge", "待补数据"));
    }

    bottom.append(createTextElement("span", "record-metric", formatMainMetric(record)));
    button.append(top, title, bottom);
    return button;
  }

  function createTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function formatPublishedAt(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || "");
    if (!match) {
      return "时间未填";
    }
    return `${Number(match[2])}/${Number(match[3])} ${match[4]}:${match[5]}`;
  }

  function getPublishedTime(record) {
    const timestamp = new Date(record.publishedAt).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function getMetrics(record) {
    return record.metrics && typeof record.metrics === "object" ? record.metrics : {};
  }

  function hasMetricValue(value) {
    return value !== undefined && value !== null && value !== "";
  }

  function formatMainMetric(record) {
    const metricConfig = CONFIG.metrics.find((metric) => metric.key === CONFIG.mainMetric);
    const label = getMainMetricLabel();
    const unit = metricConfig ? metricConfig.unit : "";
    const value = getMetrics(record)[CONFIG.mainMetric];
    return `${label}：${hasMetricValue(value) ? `${value}${unit}` : "—"}`;
  }

  function isPendingData(record) {
    const publishedTime = getPublishedTime(record);
    if (!publishedTime || Date.now() - publishedTime < 3 * 24 * 60 * 60 * 1000) {
      return false;
    }
    return !hasMetricValue(getMetrics(record)[CONFIG.mainMetric]);
  }

  function openDetail(recordId) {
    const record = loadRecords().find((item) => String(item.id) === String(recordId));
    if (!record) {
      renderList();
      return;
    }

    editingRecord = record;
    detailMetricDraft = { ...getMetrics(record) };
    detailIdInput.value = record.id;
    detailPublishedAtInput.value = record.publishedAt || "";
    detailTitleInput.value = record.title || "";
    detailProductInput.value = record.product || "";
    detailProductionHoursInput.value = record.productionHours ?? "";
    detailNotesInput.value = record.notes || "";
    renderDetailTopicOptions(record.topicType || "");
    setDetailAccount(record.account);
    clearDetailMessage();

    listView.hidden = true;
    detailView.hidden = false;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function renderDetailTopicOptions(selectedTopic) {
    detailTopicOptions.replaceChildren();
    detailTopicTypeInput.value = CONFIG.topicTypes.includes(selectedTopic) ? selectedTopic : "";

    CONFIG.topicTypes.forEach((topicType) => {
      const button = document.createElement("button");
      const isSelected = topicType === detailTopicTypeInput.value;
      button.type = "button";
      button.className = `tag-button${isSelected ? " is-selected" : ""}`;
      button.textContent = topicType;
      button.dataset.detailTopicType = topicType;
      button.setAttribute("aria-pressed", String(isSelected));
      button.addEventListener("click", () => selectDetailTopic(button));
      detailTopicOptions.append(button);
    });
  }

  function selectDetailTopic(selectedButton) {
    const isAlreadySelected = selectedButton.classList.contains("is-selected");

    detailTopicOptions.querySelectorAll(".tag-button").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });

    detailTopicTypeInput.value = isAlreadySelected ? "" : selectedButton.dataset.detailTopicType;
    if (!isAlreadySelected) {
      selectedButton.classList.add("is-selected");
      selectedButton.setAttribute("aria-pressed", "true");
    }
  }

  function setDetailAccount(account) {
    const nextAccount = VALID_ACCOUNTS.includes(account) ? account : ACCOUNT_CONTENT;
    detailAccountInput.value = nextAccount;

    detailAccountButtons.forEach((button) => {
      const isSelected = button.dataset.detailAccount === nextAccount;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });

    const isCommerce = nextAccount === ACCOUNT_COMMERCE;
    detailProductField.hidden = !isCommerce;
    detailProductInput.required = isCommerce;
    renderMetricFields(nextAccount);
    clearDetailMessage();
  }

  function renderMetricFields(account) {
    metricFields.replaceChildren();

    CONFIG.metrics
      .filter((metric) => metric.accounts.includes(account))
      .forEach((metric) => {
        const field = document.createElement("div");
        field.className = "field-group";

        const inputId = `metric-${metric.key}`;
        const label = document.createElement("label");
        label.htmlFor = inputId;
        label.textContent = metric.label;

        const row = document.createElement("div");
        row.className = "metric-input-row";

        const input = document.createElement("input");
        input.id = inputId;
        input.type = "number";
        input.inputMode = metric.decimal ? "decimal" : "numeric";
        input.step = metric.decimal ? "any" : "1";
        input.dataset.metricKey = metric.key;
        input.dataset.metricLabel = metric.label;
        input.dataset.allowDecimal = String(Boolean(metric.decimal));
        if (Object.prototype.hasOwnProperty.call(metric, "min")) {
          input.min = metric.min;
        }
        if (Object.prototype.hasOwnProperty.call(metric, "max")) {
          input.max = metric.max;
        }
        if (hasMetricValue(detailMetricDraft[metric.key])) {
          input.value = detailMetricDraft[metric.key];
        }

        row.append(input);
        if (metric.unit) {
          row.append(createTextElement("span", "metric-unit", metric.unit));
        }

        field.append(label, row);
        metricFields.append(field);
      });
  }

  function captureMetricDraft() {
    metricFields.querySelectorAll("input[data-metric-key]").forEach((input) => {
      if (input.value === "") {
        delete detailMetricDraft[input.dataset.metricKey];
      } else {
        detailMetricDraft[input.dataset.metricKey] = Number(input.value);
      }
    });
  }

  function validateDetailForm() {
    if (!detailPublishedAtInput.value) {
      return { field: detailPublishedAtInput, message: "先选一下发布时间" };
    }

    if (!detailTitleInput.value.trim()) {
      return { field: detailTitleInput, message: "先写一下标题或选题" };
    }

    if (detailAccountInput.value === ACCOUNT_COMMERCE && !detailProductInput.value.trim()) {
      return { field: detailProductInput, message: "带货号要写带的什么品" };
    }

    if (detailProductionHoursInput.value !== "" && Number(detailProductionHoursInput.value) < 0) {
      return { field: detailProductionHoursInput, message: "制作耗时不能小于 0" };
    }

    const inputs = Array.from(metricFields.querySelectorAll("input[data-metric-key]"));
    for (const input of inputs) {
      if (input.value === "") {
        continue;
      }

      const value = Number(input.value);
      const label = input.dataset.metricLabel;
      if (!Number.isFinite(value)) {
        return { field: input, message: `“${label}”要填数字` };
      }
      if (input.min !== "" && value < Number(input.min)) {
        return { field: input, message: `“${label}”不能小于 ${input.min}` };
      }
      if (input.max !== "" && value > Number(input.max)) {
        return { field: input, message: `“${label}”不能大于 ${input.max}` };
      }
      if (input.dataset.allowDecimal !== "true" && !Number.isInteger(value)) {
        return { field: input, message: `“${label}”请填整数` };
      }
    }

    return null;
  }

  function updateRecord(event) {
    event.preventDefault();
    clearDetailMessage();

    const error = validateDetailForm();
    if (error) {
      showDetailMessage(error.message, false);
      error.field.focus();
      return;
    }

    captureMetricDraft();
    const records = loadRecords();
    const recordIndex = records.findIndex((record) => String(record.id) === String(detailIdInput.value));
    if (recordIndex === -1) {
      showDetailMessage("这条记录找不到了，请返回列表重试", false);
      return;
    }

    const currentRecord = records[recordIndex];
    records[recordIndex] = {
      ...currentRecord,
      publishedAt: detailPublishedAtInput.value,
      account: detailAccountInput.value,
      title: detailTitleInput.value.trim(),
      product: detailAccountInput.value === ACCOUNT_COMMERCE ? detailProductInput.value.trim() : "",
      topicType: detailTopicTypeInput.value,
      productionHours: detailProductionHoursInput.value === "" ? null : Number(detailProductionHoursInput.value),
      notes: detailNotesInput.value.trim(),
      metrics: { ...detailMetricDraft },
      updatedAt: new Date().toISOString(),
    };

    saveRecords(records);
    renderProductSuggestions();
    showListView();
  }

  function deleteEditingRecord() {
    if (!editingRecord) {
      return;
    }

    const confirmed = window.confirm("确定删除这条记录吗？删除后找不回来。");
    if (!confirmed) {
      return;
    }

    const records = loadRecords().filter((record) => String(record.id) !== String(editingRecord.id));
    saveRecords(records);
    renderProductSuggestions();
    showListView();
  }

  function showListView() {
    editingRecord = null;
    detailMetricDraft = {};
    detailView.hidden = true;
    listView.hidden = false;
    renderList();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showDetailMessage(message, isSuccess) {
    detailMessage.textContent = message;
    detailMessage.classList.toggle("is-success", isSuccess);
  }

  function clearDetailMessage() {
    showDetailMessage("", false);
  }

  function renderStats() {
    const allRecords = loadRecords()
      .sort((first, second) => getPublishedTime(first) - getPublishedTime(second));
    const completedRecords = allRecords
      .filter((record) => getNumericMetric(record, CONFIG.mainMetric) !== null)
      .sort((first, second) => getPublishedTime(first) - getPublishedTime(second));

    const mainMetricLabel = getMainMetricLabel();
    statsDescription.textContent = `只统计已经填了“${mainMetricLabel}”的视频；“发了几条”统计本月全部记录。`;
    recentChartTitle.textContent = `最近 20 条${mainMetricLabel}`;
    topicChartTitle.textContent = `各选题类型平均${mainMetricLabel}`;

    const hasData = allRecords.length > 0;
    statsEmpty.hidden = hasData;
    statsContent.hidden = !hasData;

    if (!hasData) {
      statCards.replaceChildren();
      recentChart.replaceChildren();
      topicChart.replaceChildren();
      commissionChart.replaceChildren();
      return;
    }

    const now = new Date();
    const monthRecords = allRecords.filter((record) => {
      const publishedDate = new Date(record.publishedAt);
      return Number.isFinite(publishedDate.getTime())
        && publishedDate.getFullYear() === now.getFullYear()
        && publishedDate.getMonth() === now.getMonth();
    });
    const completedMonthRecords = monthRecords.filter(
      (record) => getNumericMetric(record, CONFIG.mainMetric) !== null,
    );

    renderStatCards(monthRecords.length, completedMonthRecords);
    renderRecentChart(completedRecords);
    renderTopicChart(completedRecords);
    renderCommissionChart(completedRecords);
  }

  function renderStatCards(monthRecordCount, completedMonthRecords) {
    statCards.replaceChildren();
    statCards.append(createStatCard("recordCount", "发了几条", `${monthRecordCount} 条`));

    CONFIG.metrics
      .filter((metric) => metric.stat === "avg" || metric.stat === "sum")
      .forEach((metric) => {
        const values = completedMonthRecords
          .filter((record) => Array.isArray(metric.accounts) && metric.accounts.includes(record.account))
          .map((record) => getNumericMetric(record, metric.key))
          .filter((value) => value !== null);

        const labelPrefix = metric.stat === "avg" ? "平均" : "总";
        const value = calculateStat(values, metric.stat);
        const displayValue = value === null ? "—" : `${formatNumber(value)}${metric.unit || ""}`;
        statCards.append(createStatCard(metric.key, `${labelPrefix}${metric.label}`, displayValue));
      });
  }

  function createStatCard(key, label, value) {
    const card = document.createElement("article");
    card.className = "stat-card";
    card.dataset.statKey = key;
    card.append(
      createTextElement("p", "stat-card-label", label),
      createTextElement("p", "stat-card-value", value),
    );
    return card;
  }

  function calculateStat(values, stat) {
    if (values.length === 0) {
      return null;
    }
    const total = values.reduce((sum, value) => sum + value, 0);
    return stat === "avg" ? total / values.length : total;
  }

  function getNumericMetric(record, key) {
    const rawValue = getMetrics(record)[key];
    if (!hasMetricValue(rawValue)) {
      return null;
    }
    const value = Number(rawValue);
    return Number.isFinite(value) ? value : null;
  }

  function getMainMetricLabel() {
    const metricConfig = CONFIG.metrics.find((metric) => metric.key === CONFIG.mainMetric);
    return metricConfig ? metricConfig.label : (CONFIG.mainMetric || "数据");
  }

  function renderRecentChart(records) {
    const recentRecords = records.slice(-20);
    const metricLabel = getMainMetricLabel();
    const items = recentRecords.map((record) => ({
      label: formatChartDate(record.publishedAt),
      value: getNumericMetric(record, CONFIG.mainMetric),
      detail: `${formatPublishedAt(record.publishedAt)}，${record.title || "未命名"}`,
    }));

    renderVerticalChart(recentChart, items, `最近 ${items.length} 条${metricLabel}`);
  }

  function renderTopicChart(records) {
    const grouped = new Map();

    records.forEach((record) => {
      const topicType = record.topicType || "未分类";
      const value = getNumericMetric(record, CONFIG.mainMetric);
      if (!grouped.has(topicType)) {
        grouped.set(topicType, []);
      }
      grouped.get(topicType).push(value);
    });

    const topicOrder = new Map(CONFIG.topicTypes.map((topicType, index) => [topicType, index]));
    const items = Array.from(grouped, ([label, values]) => ({
      label,
      value: calculateStat(values, "avg"),
    })).sort((first, second) => {
      const firstOrder = topicOrder.has(first.label) ? topicOrder.get(first.label) : Number.MAX_SAFE_INTEGER;
      const secondOrder = topicOrder.has(second.label) ? topicOrder.get(second.label) : Number.MAX_SAFE_INTEGER;
      return firstOrder - secondOrder || first.label.localeCompare(second.label, "zh-CN");
    });

    renderHorizontalChart(topicChart, items, `各选题类型平均${getMainMetricLabel()}`);
  }

  function renderCommissionChart(records) {
    const commissionConfig = CONFIG.metrics.find((metric) => metric.key === "commission");
    commissionChartCard.hidden = !commissionConfig;
    commissionChart.replaceChildren();

    if (!commissionConfig) {
      return;
    }

    const grouped = new Map();
    records.forEach((record) => {
      if (record.account !== ACCOUNT_COMMERCE || !record.product) {
        return;
      }
      const value = getNumericMetric(record, commissionConfig.key);
      if (value === null) {
        return;
      }
      const product = record.product.trim();
      grouped.set(product, (grouped.get(product) || 0) + value);
    });

    const items = Array.from(grouped, ([label, value]) => ({ label, value }))
      .sort((first, second) => second.value - first.value || first.label.localeCompare(second.label, "zh-CN"));

    renderHorizontalChart(commissionChart, items, "各商品总佣金", commissionConfig.unit);
  }

  function renderVerticalChart(container, items, ariaLabel) {
    container.replaceChildren();
    if (items.length === 0) {
      renderChartEmpty(container);
      return;
    }

    const width = 360;
    const height = 260;
    const margin = { top: 30, right: 10, bottom: 44, left: 48 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const svg = createSvg(width, height, ariaLabel);

    [0, 0.5, 1].forEach((ratio) => {
      const y = margin.top + plotHeight * (1 - ratio);
      svg.append(createSvgElement("line", {
        x1: margin.left,
        y1: y,
        x2: width - margin.right,
        y2: y,
        stroke: "#e8dfd3",
        "stroke-width": 1,
      }));
    });

    svg.append(
      createSvgElement("text", { x: margin.left - 6, y: margin.top + 5, "text-anchor": "end", fill: "#756f68" }, formatCompactNumber(maxValue)),
      createSvgElement("text", { x: margin.left - 6, y: margin.top + plotHeight + 5, "text-anchor": "end", fill: "#756f68" }, "0"),
    );

    const slotWidth = plotWidth / items.length;
    const barWidth = Math.max(4, slotWidth * 0.62);
    items.forEach((item, index) => {
      const barHeight = item.value <= 0 ? 0 : Math.max(2, (item.value / maxValue) * plotHeight);
      const x = margin.left + index * slotWidth + (slotWidth - barWidth) / 2;
      const y = margin.top + plotHeight - barHeight;
      const bar = createSvgElement("rect", {
        x,
        y,
        width: barWidth,
        height: barHeight,
        rx: 3,
        fill: "#e85d3f",
      });
      bar.append(createSvgElement("title", {}, `${item.detail}：${formatNumber(item.value)}`));
      svg.append(bar);

      if (items.length <= 8 || index % 4 === 0 || index === items.length - 1) {
        svg.append(createSvgElement("text", {
          x: x + barWidth / 2,
          y: height - 13,
          "text-anchor": "middle",
          fill: "#756f68",
        }, item.label));
      }
    });

    container.append(svg);
  }

  function renderHorizontalChart(container, items, ariaLabel, unit = "") {
    container.replaceChildren();
    if (items.length === 0) {
      renderChartEmpty(container);
      return;
    }

    const width = 360;
    const rowHeight = 44;
    const height = Math.max(96, items.length * rowHeight + 24);
    const labelWidth = 96;
    const valueWidth = 62;
    const plotWidth = width - labelWidth - valueWidth;
    const maxValue = Math.max(...items.map((item) => item.value), 1);
    const svg = createSvg(width, height, ariaLabel);

    items.forEach((item, index) => {
      const y = 12 + index * rowHeight;
      const barWidth = item.value <= 0 ? 0 : Math.max(2, (item.value / maxValue) * plotWidth);
      svg.append(
        createSvgElement("text", { x: 0, y: y + 24, fill: "#2c2925" }, shortenChartLabel(item.label)),
        createSvgElement("rect", {
          x: labelWidth,
          y: y + 7,
          width: plotWidth,
          height: 24,
          rx: 6,
          fill: "#f3eee7",
        }),
        createSvgElement("rect", {
          x: labelWidth,
          y: y + 7,
          width: barWidth,
          height: 24,
          rx: 6,
          fill: "#e85d3f",
        }),
        createSvgElement("text", {
          x: labelWidth + plotWidth + 7,
          y: y + 24,
          fill: "#756f68",
        }, `${formatCompactNumber(item.value)}${unit}`),
      );
    });

    container.append(svg);
  }

  function createSvg(width, height, ariaLabel) {
    return createSvgElement("svg", {
      class: "svg-chart",
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": ariaLabel,
      preserveAspectRatio: "xMidYMid meet",
    });
  }

  function createSvgElement(tagName, attributes, text = "") {
    const element = document.createElementNS(SVG_NAMESPACE, tagName);
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function renderChartEmpty(container) {
    container.append(createTextElement("p", "chart-empty", "这部分还没有数据"));
  }

  function formatChartDate(value) {
    const match = /^\d{4}-(\d{2})-(\d{2})/.exec(value || "");
    return match ? `${Number(match[1])}/${Number(match[2])}` : "—";
  }

  function shortenChartLabel(label) {
    const text = String(label);
    return text.length > 7 ? `${text.slice(0, 6)}…` : text;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatCompactNumber(value) {
    if (Math.abs(value) >= 10000) {
      const digits = Math.abs(value) >= 100000 ? 0 : 1;
      return `${(value / 10000).toFixed(digits)}万`;
    }
    return formatNumber(value);
  }

  function exportCsv() {
    const baseHeaders = ["发布时间", "账号", "标题或选题", "带的什么品", "选题类型", "制作耗时（小时）", "备注"];
    const headers = baseHeaders.concat(CONFIG.metrics.map((metric) => metric.label));
    const rows = loadRecords().map((record) => {
      const baseValues = [
        formatExportDate(record.publishedAt),
        record.account || "",
        record.title || "",
        record.product || "",
        record.topicType || "",
        record.productionHours ?? "",
        record.notes || "",
      ];
      const metricValues = CONFIG.metrics.map((metric) => {
        const value = getMetrics(record)[metric.key];
        return hasMetricValue(value) ? value : "";
      });
      return baseValues.concat(metricValues);
    });

    const csvLines = [headers, ...rows]
      .map((row) => row.map((value) => toCsvCell(value, true)).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csvLines], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `闹闹数据_${formatFileDate(new Date())}.csv`);
    showBackupMessage("Excel 文件已导出", true);
  }

  function exportBackup() {
    const exportedAt = new Date().toISOString();
    const payload = {
      app: "naonao-log",
      version: 1,
      exportedAt,
      lastAccount: loadLastAccount(),
      records: loadRecords(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `闹闹数据备份_${formatFileDate(new Date())}.json`);
    localStorage.setItem(STORAGE_KEYS.lastBackupAt, exportedAt);
    updateBackupStatus();
    showBackupMessage("备份文件已下载", true);
  }

  function chooseRestoreFile() {
    restoreFileInput.value = "";
    restoreFileInput.click();
  }

  async function restoreBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    clearBackupMessage();
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      if (!isValidBackupPayload(payload)) {
        throw new Error("invalid backup");
      }

      const confirmed = window.confirm("会覆盖现在的数据，确定吗？");
      if (!confirmed) {
        return;
      }

      saveRecords(payload.records);
      localStorage.setItem(STORAGE_KEYS.lastAccount, payload.lastAccount);
      localStorage.setItem(STORAGE_KEYS.lastBackupAt, payload.exportedAt);
      setAccount(payload.lastAccount);
      renderProductSuggestions();
      renderList();
      renderStats();
      updateBackupStatus();
      showBackupMessage(`恢复好啦，共 ${payload.records.length} 条记录`, true);
    } catch (error) {
      showBackupMessage("文件不对，请选择本应用备份的 JSON 文件", false);
    } finally {
      restoreFileInput.value = "";
    }
  }

  function isValidBackupPayload(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return false;
    }
    if (payload.app !== "naonao-log" || payload.version !== 1 || !Array.isArray(payload.records)) {
      return false;
    }
    if (!VALID_ACCOUNTS.includes(payload.lastAccount) || !isValidDateString(payload.exportedAt)) {
      return false;
    }
    return payload.records.every(isValidBackupRecord);
  }

  function isValidBackupRecord(record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return false;
    }
    if ((typeof record.id !== "string" && typeof record.id !== "number") || String(record.id) === "") {
      return false;
    }
    if (!isValidDateString(record.publishedAt) || !VALID_ACCOUNTS.includes(record.account) || typeof record.title !== "string") {
      return false;
    }
    if (!record.metrics || typeof record.metrics !== "object" || Array.isArray(record.metrics)) {
      return false;
    }
    const optionalTextFields = ["product", "topicType", "notes"];
    if (optionalTextFields.some((key) => record[key] !== undefined && typeof record[key] !== "string")) {
      return false;
    }
    return record.productionHours === undefined
      || record.productionHours === null
      || (Number.isFinite(Number(record.productionHours)) && Number(record.productionHours) >= 0);
  }

  function isValidDateString(value) {
    return typeof value === "string" && value !== "" && Number.isFinite(new Date(value).getTime());
  }

  function updateBackupStatus() {
    const savedAt = localStorage.getItem(STORAGE_KEYS.lastBackupAt);
    if (!isValidDateString(savedAt)) {
      backupStatus.textContent = "还没有备份过";
      backupStatus.classList.remove("is-overdue");
      return;
    }

    const elapsedMilliseconds = Math.max(0, Date.now() - new Date(savedAt).getTime());
    const daysAgo = Math.floor(elapsedMilliseconds / (24 * 60 * 60 * 1000));
    backupStatus.textContent = `上次备份：${daysAgo} 天前`;
    backupStatus.classList.toggle("is-overdue", elapsedMilliseconds > 14 * 24 * 60 * 60 * 1000);
  }

  function formatExportDate(value) {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value || "");
    return match ? `${match[1]} ${match[2]}` : String(value || "");
  }

  function formatFileDate(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function toCsvCell(value, protectFormula) {
    let text = value === null || value === undefined ? "" : String(value);
    if (protectFormula && typeof value === "string" && /^[=+\-@]/.test(text)) {
      text = `'${text}`;
    }
    return `"${text.replace(/"/g, '""')}"`;
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function showBackupMessage(message, isSuccess) {
    backupMessage.textContent = message;
    backupMessage.classList.toggle("is-success", isSuccess);
  }

  function clearBackupMessage() {
    showBackupMessage("", false);
  }

  function clearSelectedTopic() {
    topicTypeInput.value = "";
    topicOptions.querySelectorAll(".tag-button").forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
  }

  function resetPublishedAt() {
    publishedAtInput.value = toLocalMinuteValue(new Date());
  }

  function toLocalMinuteValue(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showPage(target) {
    if (target === "list") {
      showListView();
    }
    if (target === "stats") {
      renderStats();
    }
    if (target === "backup") {
      updateBackupStatus();
    }

    pages.forEach((page) => {
      const isActive = page.dataset.page === target;
      page.hidden = !isActive;
      page.classList.toggle("is-active", isActive);
    });

    navButtons.forEach((button) => {
      const isActive = button.dataset.target === target;
      button.classList.toggle("is-active", isActive);
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function showMessage(message, isSuccess) {
    formMessage.textContent = message;
    formMessage.classList.toggle("is-success", isSuccess);
  }

  function clearMessage() {
    showMessage("", false);
  }
})();
