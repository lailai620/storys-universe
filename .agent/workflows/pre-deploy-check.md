---
description: 部署前的品質檢查清單，確保每次上線品質一致
---

# 部署前檢查清單 (Pre-Deploy Checklist)

每次推送至 `main` 分支前，請執行此檢查流程。

## 1. 程式碼品質

### 建置測試
// turbo
```bash
npm run build
```
- [ ] 建置成功無錯誤
- [ ] 無未使用的變數警告
- [ ] 無 TypeScript/ESLint 錯誤

### 本地預覽
// turbo
```bash
npm run preview
```
- [ ] 首頁正常載入
- [ ] 路由跳轉正常
- [ ] 圖片資源正常顯示

## 2. 功能驗證

### 核心功能
- [ ] 登入/登出正常
- [ ] 訪客模式可用
- [ ] 創作功能運作
- [ ] 閱讀器功能正常
- [ ] 畫廊瀏覽正常

### 跨裝置測試
- [ ] 桌面版 (1920px)
- [ ] 平板版 (768px)
- [ ] 手機版 (375px)

## 3. 資安檢查
執行 `/security-audit` 工作流程，確認：
- [ ] 無暴露的 API Key
- [ ] .env 未被提交

## 4. 效能檢查
使用 Chrome DevTools Lighthouse：
- [ ] Performance > 70
- [ ] Accessibility > 80
- [ ] Best Practices > 80

## 5. 環境變數

### 確認 GitHub Secrets 設定
在 GitHub Repository > Settings > Secrets 中確認：
- [ ] `VITE_SUPABASE_URL` 已設定
- [ ] `VITE_SUPABASE_ANON_KEY` 已設定

### 確認 .env.example 更新
- [ ] 所有需要的環境變數都列在 `.env.example`

## 6. Git 狀態

### 確認分支狀態
```bash
git status
git log -3 --oneline
```
- [ ] 所有變更已提交
- [ ] commit message 清晰明確

### 推送至 main
```bash
git push origin main
```

## 7. 部署驗證
等候 GitHub Actions 完成後：
- [ ] 確認 Actions 執行成功 (綠勾)
- [ ] 訪問正式網址確認部署成功
- [ ] 測試關鍵功能

---

## 常見問題排解

| 問題 | 可能原因 | 解法 |
|------|----------|------|
| 建置失敗 | 缺少依賴 | `npm install` |
| 部署後白畫面 | 路由問題 | 檢查 `vite.config.js` 的 base 設定 |
| 環境變數無效 | Secrets 設定錯誤 | 檢查 GitHub Actions 日誌 |
| 圖片 404 | 路徑問題 | 使用 `import` 或正確的 public 路徑 |
