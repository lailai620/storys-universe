---
description: 快速為新功能添加 zh-TW 和 en 多語系翻譯
---

# 多語系新增流程 (i18n Addition)

此工作流程幫助你正確地為新功能添加多語系支援。

## 專案 i18n 結構
```
src/
├── locales/
│   ├── zh-TW/
│   │   └── translation.json
│   └── en/
│       └── translation.json
└── i18n.js  # 設定檔
```

## 執行步驟

### 1. 確認翻譯鍵值
規劃需要翻譯的文字，使用以下命名規範：
- 使用 camelCase
- 按功能區塊分組
- 例如：`creator.sidebar.title`

### 2. 更新繁體中文翻譯
編輯 `src/locales/zh-TW/translation.json`：
```json
{
  "featureName": {
    "title": "功能標題",
    "description": "這是功能描述",
    "button": {
      "submit": "送出",
      "cancel": "取消"
    }
  }
}
```

### 3. 更新英文翻譯
編輯 `src/locales/en/translation.json`：
```json
{
  "featureName": {
    "title": "Feature Title",
    "description": "This is feature description",
    "button": {
      "submit": "Submit",
      "cancel": "Cancel"
    }
  }
}
```

### 4. 在元件中使用翻譯
```jsx
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('featureName.title')}</h1>
      <p>{t('featureName.description')}</p>
      <button>{t('featureName.button.submit')}</button>
    </div>
  );
};
```

### 5. 帶參數的翻譯
翻譯檔案：
```json
{
  "welcome": "歡迎，{{name}}！您有 {{count}} 則通知。"
}
```

使用方式：
```jsx
t('welcome', { name: '小明', count: 5 })
// 輸出：歡迎，小明！您有 5 則通知。
```

### 6. 測試翻譯
// turbo
```bash
npm run dev
```
- [ ] 切換語言，確認所有文字正確切換
- [ ] 檢查是否有遺漏的翻譯 key（會顯示 key 而非翻譯文字）

---

## 常見錯誤
| 問題 | 解法 |
|------|------|
| 顯示 key 而非翻譯 | 檢查 key 是否正確、JSON 格式是否正確 |
| 翻譯未更新 | 嘗試重新載入頁面或重啟 dev server |
| 中文亂碼 | 確保檔案編碼為 UTF-8 |
