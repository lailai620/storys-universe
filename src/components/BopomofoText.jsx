import React, { useMemo } from 'react';
import { toBopomofoHTML } from '../utils/bopomofoDict';

/**
 * BopomofoText 注音標注元件
 * ==========================
 * 將中文文字轉換為帶有注音標注的 Ruby 格式
 * 專為兒童模式設計
 * 
 * @param {string} children - 要標注的文字
 * @param {boolean} enabled - 是否啟用注音 (預設 true)
 * @param {string} className - 額外的 CSS 類別
 */
const BopomofoText = ({
    children,
    enabled = true,
    className = '',
    style = {},
}) => {
    // 使用 useMemo 優化效能，避免重複轉換
    const annotatedHTML = useMemo(() => {
        if (!enabled || !children || typeof children !== 'string') {
            return null;
        }
        return toBopomofoHTML(children);
    }, [children, enabled]);

    // 如果未啟用，直接返回原文
    if (!enabled || !annotatedHTML) {
        return <span className={className} style={style}>{children}</span>;
    }

    // 渲染帶注音的 HTML
    return (
        <span
            className={`bopomofo-text ${className}`}
            style={style}
            dangerouslySetInnerHTML={{ __html: annotatedHTML }}
        />
    );
};

/**
 * 注音段落元件
 * 專門用於故事內文的長段落
 */
export const BopomofoParagraph = ({
    children,
    enabled = true,
    className = '',
}) => {
    const annotatedHTML = useMemo(() => {
        if (!enabled || !children || typeof children !== 'string') {
            return null;
        }
        return toBopomofoHTML(children);
    }, [children, enabled]);

    if (!enabled || !annotatedHTML) {
        return <p className={className}>{children}</p>;
    }

    return (
        <p
            className={`bopomofo-paragraph ${className}`}
            dangerouslySetInnerHTML={{ __html: annotatedHTML }}
        />
    );
};

/**
 * 注音標題元件
 */
export const BopomofoHeading = ({
    children,
    enabled = true,
    level = 1,
    className = '',
}) => {
    const annotatedHTML = useMemo(() => {
        if (!enabled || !children || typeof children !== 'string') {
            return null;
        }
        return toBopomofoHTML(children);
    }, [children, enabled]);

    const Tag = `h${level}`;

    if (!enabled || !annotatedHTML) {
        return <Tag className={className}>{children}</Tag>;
    }

    return (
        <Tag
            className={`bopomofo-heading ${className}`}
            dangerouslySetInnerHTML={{ __html: annotatedHTML }}
        />
    );
};

export default BopomofoText;
