/**
 * 🏷️ SEO 元件 — 統一管理所有頁面的 meta 標籤
 * 支援 Open Graph + Twitter Card + 結構化資料
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';

const DEFAULT_META = {
    siteName: '織光 WeavingLight',
    title: '織光 — 賦予回憶溫度的故事編織 APP',
    description: '用 AI 引導的方式，為重要的人編織珍貴的生命故事。記錄聲音、照片與文字，化為一本傳承的故事書。興起回憶之光。',
    image: '/og-image.png',
    url: 'https://weavinglight.app',
    locale: 'zh_TW',
    type: 'website',
};

const SEO = ({
    title,
    description,
    image,
    url,
    type = 'website',
    noindex = false,
    children,
}) => {
    const fullTitle = title ? `${title} — ${DEFAULT_META.siteName}` : DEFAULT_META.title;
    const desc = description || DEFAULT_META.description;
    const img = image || DEFAULT_META.image;
    const pageUrl = url || DEFAULT_META.url;

    return (
        <Helmet>
            {/* 基本 */}
            <title>{fullTitle}</title>
            <meta name="description" content={desc} />
            <link rel="canonical" href={pageUrl} />
            <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow'} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:image" content={img} />
            <meta property="og:url" content={pageUrl} />
            <meta property="og:site_name" content={DEFAULT_META.siteName} />
            <meta property="og:locale" content={DEFAULT_META.locale} />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={img} />

            {/* PWA / APP */}
            <meta name="theme-color" content="#c8956c" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-title" content="織光" />

            {children}
        </Helmet>
    );
};

export default SEO;
