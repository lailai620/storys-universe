---
description: 快速建立符合 Dark Cosmic 風格的 React 元件
---

# 元件開發模板 (Component Creation)

此工作流程幫助你快速建立符合專案「深邃宇宙」視覺風格的新元件。

## 設計規範速查

### 色彩系統
| 用途 | Tailwind Class |
|------|----------------|
| 深層背景 | `bg-[#0f1016]` |
| 卡片背景 | `bg-[#1a1b26]` |
| 玻璃效果 | `bg-white/5 backdrop-blur-md` |
| 品牌漸層 | `bg-gradient-to-r from-indigo-500 to-purple-500` |
| 星塵金色 | `text-amber-300` |
| 主要文字 | `text-slate-200` |
| 次要文字 | `text-slate-400` |

### 標準元件結構
```jsx
import { useAudio } from '../context/AudioContext';
import { useTranslation } from 'react-i18next';

const ComponentName = ({ prop1, prop2 }) => {
  const { playClick } = useAudio();
  const { t } = useTranslation();

  const handleClick = () => {
    playClick(); // 必須：點擊音效回饋
    // 其他邏輯
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-4">
      {/* 元件內容 */}
    </div>
  );
};

export default ComponentName;
```

## 執行步驟

### 1. 建立檔案
```bash
touch src/components/<ComponentName>.jsx
```

### 2. 複製基礎模板
使用上方的標準結構作為起點。

### 3. 加入必要功能
- [ ] 引入 `useAudio` 並在互動時呼叫 `playClick()`
- [ ] 引入 `useTranslation` 處理多語系文字
- [ ] 使用 Tailwind 玻璃擬態樣式
- [ ] 添加 hover/active 過渡效果 (`transition-all duration-300`)

### 4. 響應式設計
確保元件在各尺寸下正常顯示：
```jsx
className="w-full md:w-1/2 lg:w-1/3"
```

### 5. 動畫效果
常用動畫類別：
- 懸停放大：`hover:scale-105`
- 淡入：`animate-fadeIn`
- 脈動：`animate-pulse`

### 6. 匯出並使用
在父元件中引入：
```jsx
import ComponentName from '../components/ComponentName';
```

---

## 範例：建立一個 FeatureCard 元件

```jsx
import { useAudio } from '../context/AudioContext';

const FeatureCard = ({ icon: Icon, title, description }) => {
  const { playClick } = useAudio();

  return (
    <div 
      onClick={playClick}
      className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6
                 hover:bg-white/10 hover:scale-105 
                 transition-all duration-300 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 
                      flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
};

export default FeatureCard;
```
