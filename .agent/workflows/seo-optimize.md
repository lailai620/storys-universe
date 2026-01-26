---
description: 為新頁面添加正確的 SEO meta 標籤與社群分享支援
---

# SEO 優化流程 (SEO Optimization)

此工作流程幫助你為頁面添加正確的 SEO 標籤，提升搜尋引擎與社群平台的曝光度。

## 前置需求
確保專案已安裝 React Helmet：
```bash
npm install react-helmet-async
```

## 執行步驟

### 1. 設定 Helmet Provider
在 `src/main.jsx` 或 `App.jsx` 中包裝：
```jsx
import { HelmetProvider } from 'react-helmet-async';

<HelmetProvider>
  <App />
</HelmetProvider>
```

### 2. 頁面 SEO 模板
在每個頁面元件中添加 Helmet：

```jsx
import { Helmet } from 'react-helmet-async';

const MyPage = () => {
  return (
    <>
      <Helmet>
        {/* 基本 SEO */}
        <title>頁面標題 | Storys Universe</title>
        <meta name="description" content="頁面描述，建議 150-160 字元" />
        
        {/* Open Graph (Facebook, LINE) */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="頁面標題" />
        <meta property="og:description" content="頁面描述" />
        <meta property="og:image" content="https://your-domain.com/og-image.jpg" />
        <meta property="og:url" content="https://your-domain.com/page-url" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="頁面標題" />
        <meta name="twitter:description" content="頁面描述" />
        <meta name="twitter:image" content="https://your-domain.com/twitter-image.jpg" />
      </Helmet>
      
      {/* 頁面內容 */}
    </>
  );
};
```

### 3. 動態頁面 SEO (故事詳情頁)
```jsx
const StoryReader = () => {
  const { story } = useStory();
  
  return (
    <>
      <Helmet>
        <title>{story?.title} | Storys Universe</title>
        <meta name="description" content={story?.description?.slice(0, 160)} />
        <meta property="og:title" content={story?.title} />
        <meta property="og:image" content={story?.cover_image} />
        <meta property="og:type" content="article" />
      </Helmet>
      {/* ... */}
    </>
  );
};
```

### 4. 結構化資料 (JSON-LD)
為故事頁面添加結構化資料：
```jsx
<Helmet>
  <script type="application/ld+json">
    {JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": story.title,
      "image": story.cover_image,
      "author": {
        "@type": "Person",
        "name": story.author_name
      },
      "datePublished": story.created_at
    })}
  </script>
</Helmet>
```

### 5. 測試 SEO 設定

#### 本地測試
// turbo
```bash
npm run dev
```
使用 Chrome DevTools > Elements 檢視 `<head>` 區塊

#### 線上工具
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## SEO 檢查清單
- [ ] 每頁有唯一的 `<title>`
- [ ] 每頁有唯一的 `meta description`
- [ ] 有 Open Graph 圖片 (建議 1200x630px)
- [ ] 有 Twitter Card 設定
- [ ] 動態頁面有正確的動態內容

## 完美圖片規格
| 平台 | 建議尺寸 | 格式 |
|------|----------|------|
| Open Graph | 1200 x 630 px | JPG/PNG |
| Twitter | 1200 x 600 px | JPG/PNG |
| 網站 Favicon | 32 x 32 px | ICO/PNG |
