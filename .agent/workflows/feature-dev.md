---
description: 從需求到實作的標準化功能開發流程
---

# 功能開發流程 (Feature Development)

此工作流程幫助你系統化地開發新功能，確保品質與一致性。

## 執行步驟

### 1. 需求確認
在開始編碼前，先確認以下問題：
- [ ] 這個功能解決什麼問題？
- [ ] 目標用戶是誰？
- [ ] 驗收標準是什麼？

### 2. 技術設計
建立簡易設計文件：
```markdown
## 功能名稱
簡述功能目的

## 影響範圍
- 新增檔案：
- 修改檔案：
- 資料庫變更：

## 實作方案
描述技術實作方式
```

### 3. 建立分支
```bash
git checkout -b feature/<feature-name>
```

### 4. 實作順序
1. **資料層** - 如需要，先處理資料庫結構與 Supabase RLS
2. **服務層** - 建立 `src/services/` 中的 API 邏輯
3. **Context** - 如需全域狀態，更新相關 Context
4. **元件** - 建立 UI 元件 (參考 `/component-create`)
5. **頁面** - 整合元件至頁面

### 5. 多語系支援
為所有用戶可見文字添加翻譯：
```javascript
// src/locales/zh-TW/translation.json
{
  "featureName": {
    "title": "功能標題",
    "description": "功能描述"
  }
}
```

### 6. 本地測試
// turbo
```bash
npm run dev
```
測試項目：
- [ ] 功能正常運作
- [ ] RWD 響應式正常
- [ ] 點擊音效正常
- [ ] 訪客模式正常
- [ ] 登入用戶模式正常

### 7. 程式碼審查
自我檢查清單：
- [ ] 沒有暴露敏感資訊
- [ ] 使用了 `playClick()` 音效回饋
- [ ] 所有文字都有多語系支援
- [ ] 沒有 console.log 殘留
- [ ] 錯誤處理完善

### 8. 提交與合併
```bash
git add .
git commit -m "feat: <簡述功能>"
git push origin feature/<feature-name>
```

---

## 產出物
- 功能程式碼
- 更新的翻譯檔案
- 測試通過的確認
