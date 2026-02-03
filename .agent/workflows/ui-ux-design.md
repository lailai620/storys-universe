---
description: UI/UX 設計工作流程 - 建立符合專案風格的高品質介面設計
---

# 🎨 UI/UX Pro Max 設計工作流程

此工作流程用於確保所有介面設計符合 Storys Universe 的視覺語言。

---

## 一、設計模式判斷

首先確認目標用戶模式：

### 🌙 深色太空模式 (Dark Cosmic - 預設)
- **適用對象**: 成人用戶、一般內容
- **視覺語言**: 太空、星雲、未來感
- **主色調**: 深邃暗色 (`#0f1016`, `#1a1b26`)
- **強調色**: 靛藍 (`#6366f1`)、紫色 (`#8b5cf6`)
- **文字色**: 白色系 (`text-white`, `text-slate-200`)

### 🍭 兒童繪本模式 (Kids Storybook)
- **適用對象**: 兒童用戶、親子內容
- **視覺語言**: 童話、繪本、溫暖
- **主色調**: 米黃色 (`#FEF9E7`)、淡天藍 (`#E0F7FA`)
- **強調色**: 馬卡龍色系
  - 蜜桃粉 `#FFB7B2`
  - 薄荷綠 `#B5EAD7`
  - 淡紫羅蘭 `#C7CEEA`
  - 檸檬黃 `#FFEAA7`
- **邊框**: 深巧克力色 (`#4A403A`)，不用黑色
- **圓角**: 超級圓角 (`rounded-3xl`, `rounded-full`)

---

## 二、色彩規範

### 色票定義 (CSS Variables)
```css
:root {
  /* Dark Cosmic Mode */
  --color-bg-dark: #0f1016;
  --color-surface-dark: #1a1b26;
  --color-accent-primary: #6366f1;
  --color-accent-secondary: #8b5cf6;
  
  /* Kids Storybook Mode */
  --color-bg-kids: #FEF9E7;
  --color-surface-kids: #FFFDF5;
  --color-kids-pink: #FFB7B2;
  --color-kids-mint: #B5EAD7;
  --color-kids-violet: #C7CEEA;
  --color-kids-yellow: #FFEAA7;
  --color-kids-border: #4A403A;
}
```

### 漸層使用
```css
/* 深色模式漸層 */
bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900

/* 兒童模式漸層 */
bg-gradient-to-br from-pink-100 via-yellow-50 to-blue-100
```

---

## 三、字體規範

### 字體堆疊
```css
/* 深色模式 - 現代無襯線 */
font-family: 'Inter', 'Noto Sans TC', system-ui, sans-serif;

/* 兒童模式 - 圓潤親切 */
font-family: 'Zen Maru Gothic', 'Kiwi Maru', 'YuanTi TC', 'PingFang TC', sans-serif;
```

### 字級規範

| 元素 | 深色模式 | 兒童模式 | 說明 |
|------|----------|----------|------|
| 標題 H1 | `text-4xl` | `text-5xl` | 兒童模式大 25% |
| 標題 H2 | `text-2xl` | `text-3xl` | |
| 內文 | `text-base` | `text-xl` | 兒童模式大 30% |
| 按鈕 | `text-sm` | `text-lg` | |

### 行高規範
- 深色模式: `leading-relaxed` (1.625)
- 兒童模式: `leading-loose` (2.0) - 幫助逐行閱讀

### 字重規範
- 標題: `font-bold` (700)
- 內文: `font-medium` (500) - 不用細體
- 按鈕: `font-bold` (700)

---

## 四、元件設計規範

### 按鈕 (Buttons)

#### 深色模式
```jsx
<button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30">
  按鈕文字
</button>
```

#### 兒童模式
```jsx
<button className="px-8 py-4 bg-[#FFB7B2] hover:bg-[#FFA5A0] text-[#4A403A] rounded-full font-bold text-lg transition-all shadow-lg border-4 border-[#4A403A]/20">
  按鈕文字
</button>
```

### 卡片 (Cards)

#### 深色模式
```jsx
<div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
  {/* 內容 */}
</div>
```

#### 兒童模式
```jsx
<div className="bg-white/80 border-4 border-[#4A403A]/20 rounded-3xl p-8 shadow-xl">
  {/* 內容 */}
</div>
```

### 輸入框 (Inputs)

#### 深色模式
```jsx
<input className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:ring-2 focus:ring-indigo-500/50" />
```

#### 兒童模式
```jsx
<input className="w-full bg-white border-4 border-[#4A403A]/30 rounded-full px-6 py-4 text-[#4A403A] text-lg placeholder:text-[#4A403A]/50 focus:ring-4 focus:ring-[#B5EAD7]" />
```

---

## 五、動畫與互動

### 過渡效果
```css
/* 標準過渡 */
transition-all duration-300

/* 懸停縮放 */
hover:scale-105 transition-transform

/* 點擊縮放 */
active:scale-95
```

### 兒童模式特殊動畫
```css
/* 彈跳效果 */
@keyframes bounce-soft {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 搖擺效果 */
@keyframes wiggle {
  0%, 100% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
}
```

### 背景動畫（兒童模式）
- 緩慢漂浮的雲朵
- 閃爍的星星
- 漂浮的幾何圖形
- 但不干擾閱讀

---

## 六、注音標注 (Bopomofo)

使用 `BopomofoText` 元件為文字標注注音：

```jsx
import BopomofoText from '../components/BopomofoText';

// 基本用法
<BopomofoText text="這是一個故事" />

// 顯示樣式
<ruby>
  這<rp>(</rp><rt>ㄓㄜˋ</rt><rp>)</rp>
  是<rp>(</rp><rt>ㄕˋ</rt><rp>)</rp>
  ...
</ruby>
```

### Ruby 樣式
```css
ruby {
  ruby-position: over;
}
rt {
  font-size: 0.5em;
  color: #4A403A;
  opacity: 0.7;
}
```

---

## 七、響應式設計檢查清單

// turbo-all

### 斷點規範
- `sm`: 640px (手機橫向)
- `md`: 768px (平板)
- `lg`: 1024px (小筆電)
- `xl`: 1280px (桌機)

### 必須檢查項目
1. [ ] 手機版 (< 640px) 佈局正確
2. [ ] 平板版 (768px - 1024px) 間距適當
3. [ ] 桌機版 (> 1024px) 內容不過寬
4. [ ] 觸控按鈕最小尺寸 44x44px
5. [ ] 文字在各裝置上易讀

---

## 八、無障礙設計 (Accessibility)

### 對比度要求
- 正常文字: 至少 4.5:1
- 大型文字: 至少 3:1
- 兒童模式: 至少 7:1 (更高要求)

### ARIA 標籤
```jsx
<button aria-label="收藏此故事">
  <Heart />
</button>
```

### 鍵盤導航
- 所有互動元素必須可 Tab 聚焦
- 按 Enter/Space 可觸發
- 可見的 focus 狀態

---

## 九、設計審查檢查清單

開發新功能前，確認以下項目：

### 視覺一致性
- [ ] 顏色符合模式規範
- [ ] 字體大小/粗細正確
- [ ] 圓角統一
- [ ] 間距和諧

### 功能完整性
- [ ] 載入狀態 (Loading)
- [ ] 空狀態 (Empty State)
- [ ] 錯誤狀態 (Error)
- [ ] 成功回饋 (Success)

### 效能考量
- [ ] 圖片已優化/lazy load
- [ ] 動畫不影響效能
- [ ] 不阻塞主執行緒

---

## 十、快速範例程式碼

### 建立兒童模式卡片
```jsx
const KidsCard = ({ title, children }) => (
  <div className="bg-gradient-to-br from-[#FEF9E7] to-white border-4 border-[#4A403A]/20 rounded-3xl p-6 shadow-xl">
    <h3 className="text-2xl font-bold text-[#4A403A] mb-4" style={{ fontFamily: "'Zen Maru Gothic', sans-serif" }}>
      {title}
    </h3>
    <div className="text-lg text-[#4A403A]/80 leading-loose">
      {children}
    </div>
  </div>
);
```

### 建立馬卡龍按鈕組
```jsx
const MacaronButton = ({ color = 'pink', children, onClick }) => {
  const colors = {
    pink: 'bg-[#FFB7B2] hover:bg-[#FFA5A0]',
    mint: 'bg-[#B5EAD7] hover:bg-[#A0DCC8]',
    violet: 'bg-[#C7CEEA] hover:bg-[#B5BED8]',
    yellow: 'bg-[#FFEAA7] hover:bg-[#FFE082]',
  };
  
  return (
    <button 
      onClick={onClick}
      className={`${colors[color]} text-[#4A403A] px-6 py-3 rounded-full font-bold text-lg border-2 border-[#4A403A]/20 shadow-md hover:scale-105 transition-all`}
    >
      {children}
    </button>
  );
};
```

---

**使用方式**: 在開發新功能或優化現有介面時，參考此工作流程確保設計一致性。
