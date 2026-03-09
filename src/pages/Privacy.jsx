import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Mail, FileText, Database, Globe, Bell } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Helmet } from 'react-helmet-async';

/**
 * 🔒 隱私權政策頁面
 * 符合台灣《個人資料保護法》+ GDPR + App Store/Google Play 審查要求
 * 最後更新：2026-02-25
 */
const Privacy = () => {
    const navigate = useNavigate();
    const { playClick, playHover } = useAudio();

    const sections = [
        {
            icon: Eye,
            title: '一、我們收集哪些資訊',
            items: [
                { subtitle: '帳戶資訊', detail: '電子郵件地址、顯示名稱、頭像照片（透過第三方登入取得）。' },
                { subtitle: '創作內容', detail: '您撰寫的故事文字、上傳的照片、錄製的語音訊息。這些內容歸您所有。' },
                { subtitle: '使用數據', detail: '閱讀紀錄、偏好設定（字型、封面顏色等）、功能使用頻率。' },
                { subtitle: '技術資訊', detail: '裝置類型、作業系統版本、語言設定、匿名化 IP 位址（用於伺服器安全）。' },
            ],
        },
        {
            icon: Shield,
            title: '二、我們如何使用這些資訊',
            items: [
                { subtitle: '提供服務', detail: '處理您的帳戶、儲存創作內容、同步跨裝置資料。' },
                { subtitle: '個人化體驗', detail: 'AI 故事引導會根據您的對話脈絡提供回應，但不會將您的內容用於訓練其他模型。' },
                { subtitle: '服務改善', detail: '匿名化的使用統計用於改善功能和效能。' },
                { subtitle: '安全防護', detail: '偵測異常登入和防止帳戶遭盜用。' },
            ],
        },
        {
            icon: Database,
            title: '三、資料儲存與安全',
            items: [
                { subtitle: '雲端儲存', detail: '您的資料儲存於 Supabase 平台（AWS 基礎設施），資料中心位於美國/新加坡。' },
                { subtitle: '加密保護', detail: '傳輸使用 TLS 1.3 加密，儲存使用 AES-256 加密。' },
                { subtitle: '存取控制', detail: '實施 Row Level Security (RLS)，每位使用者只能存取自己的資料。' },
                { subtitle: '備份機制', detail: '資料定期自動備份，確保不會因意外遺失。' },
            ],
        },
        {
            icon: Globe,
            title: '四、第三方服務',
            items: [
                { subtitle: 'Google 登入', detail: '我們透過 Google OAuth 2.0 驗證您的身份，僅取得您的 email 和名稱。' },
                { subtitle: 'Google Gemini AI', detail: '故事引導功能使用 Gemini API。您的對話內容會傳送至 Google 進行即時處理，但不會被 Google 用於模型訓練。' },
                { subtitle: '支付處理', detail: '訂閱付款由第三方金流平台處理，我們不儲存您的信用卡資訊。' },
            ],
        },
        {
            icon: UserCheck,
            title: '五、您的權利（依台灣個資法第 3 條）',
            items: [
                { subtitle: '查詢與閱覽', detail: '您可隨時在「設定」中查看您的個人資料和使用紀錄。' },
                { subtitle: '請求更正', detail: '您可隨時修改您的顯示名稱和個人資訊。' },
                { subtitle: '請求刪除', detail: '您可要求刪除帳戶及所有相關資料。刪除後 30 天內將完全從伺服器移除。' },
                { subtitle: '資料可攜', detail: '您可下載所有故事、照片和語音紀錄的匯出檔案。' },
                { subtitle: '停止處理', detail: '您可隨時要求我們停止處理您的個人資料。' },
            ],
        },
        {
            icon: Bell,
            title: '六、兒童隱私',
            items: [
                { subtitle: '年齡限制', detail: '本服務適用 13 歲以上使用者。未滿 13 歲的兒童需經監護人同意方可使用。' },
                { subtitle: '夥伴邀請', detail: '經由「夥伴邀請」功能加入的成員，其資料受到額外保護。' },
            ],
        },
        {
            icon: Lock,
            title: '七、Cookie 與追蹤技術',
            items: [
                { subtitle: '必要性 Cookie', detail: '用於維持登入狀態和安全性，無法關閉。' },
                { subtitle: '分析 Cookie', detail: '匿名化的使用統計，您可在設定中選擇退出。' },
                { subtitle: '我們不使用', detail: '廣告追蹤、第三方行銷 Cookie 或指紋辨識技術。' },
            ],
        },
    ];

    return (
        <>
            <Helmet>
                <title>隱私權政策 — 織光</title>
                <meta name="description" content="織光 APP 的隱私權政策，說明我們如何收集、使用和保護您的個人資訊。符合台灣個資法及 GDPR 規範。" />
            </Helmet>

            <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark py-12 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto">
                    {/* 返回 */}
                    <button
                        onClick={() => { playClick(); navigate(-1); }}
                        onMouseEnter={playHover}
                        className="flex items-center gap-2 text-text-secondary-light dark:text-text-secondary-dark hover:text-primary mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        返回
                    </button>

                    {/* 標題 */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
                                <Shield className="text-primary" size={22} />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-display">隱私權政策</h1>
                        </div>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                            最後更新日期：2026 年 2 月 25 日&emsp;|&emsp;生效日期：2026 年 3 月 1 日
                        </p>
                    </div>

                    {/* 引言 */}
                    <div className="mb-10 p-5 bg-primary/5 rounded-2xl border border-primary/15">
                        <p className="text-sm sm:text-base leading-relaxed">
                            織光（以下簡稱「我們」或「本服務」）深知您的隱私至關重要。本政策說明我們在您使用織光 APP 及相關服務時，如何收集、使用、儲存、分享和保護您的個人資訊。
                        </p>
                        <p className="text-sm sm:text-base leading-relaxed mt-3">
                            本政策適用於台灣《個人資料保護法》及歐盟《一般資料保護規則》(GDPR) 相關規範。
                        </p>
                    </div>

                    {/* 各節 */}
                    <div className="space-y-8">
                        {sections.map((section, idx) => (
                            <section key={idx} className="scroll-mt-20" id={`section-${idx + 1}`}>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <section.icon className="text-primary shrink-0" size={20} />
                                    <h2 className="text-lg sm:text-xl font-bold">{section.title}</h2>
                                </div>
                                <div className="space-y-3 pl-7">
                                    {section.items.map((item, i) => (
                                        <div key={i}>
                                            <span className="font-semibold text-sm">{item.subtitle}：</span>
                                            <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm">{item.detail}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>

                    {/* 政策變更 */}
                    <div className="mt-10 p-5 bg-surface-light dark:bg-surface-dark rounded-2xl">
                        <h2 className="font-bold mb-2">八、政策變更</h2>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
                            我們可能不時更新本隱私權政策。重大變更時，我們將透過 APP 內通知或電子郵件告知您。
                            繼續使用本服務即表示您接受更新後的政策。
                        </p>
                    </div>

                    {/* 聯絡 */}
                    <div className="mt-8 p-5 bg-primary/8 rounded-2xl border border-primary/15">
                        <div className="flex items-center gap-2 mb-2">
                            <Mail className="text-primary" size={18} />
                            <h3 className="font-bold text-sm">聯絡隱私權團隊</h3>
                        </div>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            若您對本政策有任何疑問或要行使您的權利，請聯繫：<br />
                            <a href="mailto:privacy@weavinglight.app" className="text-primary hover:underline">
                                privacy@weavinglight.app
                            </a>
                        </p>
                        <p className="text-xs text-text-secondary-light/60 dark:text-text-secondary-dark/60 mt-2">
                            我們將在收到您的請求後 30 日內回覆。
                        </p>
                    </div>

                    {/* 底部連結 */}
                    <div className="mt-10 pt-6 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <button
                            onClick={() => { playClick(); navigate('/terms'); }}
                            className="hover:text-primary transition-colors flex items-center gap-1"
                        >
                            <FileText size={14} />
                            使用條款
                        </button>
                    </div>

                    <p className="text-xs text-text-secondary-light/40 dark:text-text-secondary-dark/40 mt-6 text-center">
                        © 2026 織光 WeavingLight. All rights reserved.
                    </p>
                </div>
            </div>
        </>
    );
};

export default Privacy;
