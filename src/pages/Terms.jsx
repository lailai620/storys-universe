import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertTriangle, Ban, Copyright, Gavel, CreditCard, Shield, UserX } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Helmet } from 'react-helmet-async';

/**
 * 📜 使用條款頁面
 * 符合台灣法規 + App Store/Google Play 審查要求
 * 最後更新：2026-02-25
 */
const Terms = () => {
    const navigate = useNavigate();
    const { playClick, playHover } = useAudio();

    const sections = [
        {
            icon: Scale,
            title: '一、服務說明',
            items: [
                { subtitle: '服務內容', detail: '織光是一款生命故事記錄應用程式，提供 AI 引導式故事撰寫、語音紀錄、照片上傳、故事書製作等功能。' },
                { subtitle: '服務提供者', detail: '織光團隊（以下簡稱「我們」）負責本服務的開發、營運與維護。' },
                { subtitle: '服務變更', detail: '我們保留隨時新增、修改或停止部分服務功能的權利，重大變更會提前通知。' },
            ],
        },
        {
            icon: Shield,
            title: '二、帳戶與使用資格',
            items: [
                { subtitle: '年齡限制', detail: '您必須年滿 13 歲方可註冊使用本服務。13-18 歲使用者需經監護人同意。' },
                { subtitle: '帳戶安全', detail: '您有責任保管帳戶登入資訊的安全。若發現未經授權的使用，請立即通知我們。' },
                { subtitle: '帳戶限制', detail: '每人僅可持有一個帳戶，不得轉讓、出售或共用帳戶。' },
                { subtitle: '真實資訊', detail: '您須提供真實、準確的個人資訊。' },
            ],
        },
        {
            icon: Copyright,
            title: '三、智慧財產權',
            items: [
                { subtitle: '您的內容', detail: '您在織光上創作的原創故事、上傳的照片和錄製的語音，其著作權歸您所有。' },
                { subtitle: '授權範圍', detail: '您授予我們在提供服務所必要的範圍內，非專屬、全球性、免授權費的使用權利（如儲存、顯示、備份等）。' },
                { subtitle: 'AI 生成內容', detail: 'AI 輔助產生的故事引導文字由 Google Gemini API 生成，不構成我們的智慧財產主張。' },
                { subtitle: '平台財產', detail: '織光的商標、Logo、介面設計、原始碼等歸我們所有，未經書面同意不得使用。' },
            ],
        },
        {
            icon: Ban,
            title: '四、禁止行為',
            items: [
                { subtitle: '違法內容', detail: '不得發布違反法律、仇恨言論、暴力威脅、兒童剝削或色情內容。' },
                { subtitle: '侵權行為', detail: '不得侵犯他人的智慧財產權、隱私權或其他合法權利。' },
                { subtitle: '技術濫用', detail: '不得使用自動化工具爬取內容、反向工程、或試圖入侵系統。' },
                { subtitle: '服務干擾', detail: '不得以任何方式干擾服務運作或其他使用者的正常使用。' },
                { subtitle: '詐欺行為', detail: '不得冒充他人或以欺騙方式取得服務。' },
            ],
        },
        {
            icon: CreditCard,
            title: '五、付費服務與退款',
            items: [
                { subtitle: '訂閱方案', detail: '織光提供免費版與 Pro 付費版。Pro 會員享有進階功能（如無限故事、語音轉文字等）。' },
                { subtitle: '收費與續約', detail: '付費方案以月/年為週期，除非您主動取消，否則將自動續約。' },
                { subtitle: '退款政策', detail: '依台灣消費者保護法，數位內容商品於購買後 7 日內可申請退款（已使用之部分除外）。透過 App Store/Google Play 購買者，退款依各平台政策辦理。' },
                { subtitle: '價格變更', detail: '我們可能調整價格，但會在下一個計費週期開始前通知您。' },
            ],
        },
        {
            icon: AlertTriangle,
            title: '六、免責聲明',
            items: [
                { subtitle: '服務現狀', detail: '本服務以「現狀」提供，我們不保證服務不中斷或完全無錯誤。' },
                { subtitle: 'AI 內容', detail: 'AI 生成的故事引導僅作為參考，可能包含不準確或不適當的內容。使用者應自行判斷。' },
                { subtitle: '資料備份', detail: '雖然我們會定期備份資料，但建議您也自行備份重要的創作內容。' },
                { subtitle: '第三方服務', detail: '我們不對第三方服務（如 Google 登入、支付平台）的可用性或安全性負責。' },
            ],
        },
        {
            icon: UserX,
            title: '七、帳戶終止',
            items: [
                { subtitle: '您的終止權', detail: '您可隨時在「設定」中刪除帳戶。刪除後所有資料將在 30 天內永久移除。' },
                { subtitle: '我們的終止權', detail: '若您違反本條款，我們有權暫停或終止您的帳戶，並刪除相關內容。' },
                { subtitle: '終止後效力', detail: '帳戶終止後，第三條（智慧財產權）、第六條（免責聲明）和第八條（爭議解決）仍然有效。' },
            ],
        },
        {
            icon: Gavel,
            title: '八、爭議解決與適用法律',
            items: [
                { subtitle: '適用法律', detail: '本條款受中華民國（台灣）法律管轄。' },
                { subtitle: '爭議解決', detail: '雙方應先以善意協商解決爭議。若協商未果，同意以台灣台北地方法院為第一審管轄法院。' },
                { subtitle: '條款修改', detail: '我們保留修改本條款的權利。重大修改將透過 APP 內通知或 email 告知。繼續使用即視為同意。' },
                { subtitle: '條款可分割性', detail: '若本條款任何條文被認定無效，其餘條文仍具完整效力。' },
            ],
        },
    ];

    return (
        <>
            <Helmet>
                <title>使用條款 — 織光</title>
                <meta name="description" content="織光 APP 的服務使用條款，說明您使用我們服務時的權利和義務。" />
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
                                <FileText className="text-primary" size={22} />
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold font-display">使用條款</h1>
                        </div>
                        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">
                            最後更新日期：2026 年 2 月 25 日&emsp;|&emsp;生效日期：2026 年 3 月 1 日
                        </p>
                    </div>

                    {/* 引言 */}
                    <div className="mb-10 p-5 bg-primary/5 rounded-2xl border border-primary/15">
                        <p className="text-sm sm:text-base leading-relaxed">
                            歡迎使用織光！本條款構成您與織光之間的法律協議。使用本服務即表示您已閱讀、理解並同意遵守以下條款。若您不同意任何部分，請勿使用本服務。
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

                    {/* 同意聲明 */}
                    <div className="mt-10 p-5 bg-primary/8 rounded-2xl border border-primary/15">
                        <p className="text-sm leading-relaxed">
                            繼續使用織光即表示您已閱讀、理解並同意遵守本使用條款及我們的
                            <button onClick={() => navigate('/privacy')} className="text-primary hover:underline mx-1">隱私權政策</button>。
                            如有任何疑問，請聯繫：
                            <a href="mailto:legal@weavinglight.app" className="text-primary hover:underline ml-1">
                                legal@weavinglight.app
                            </a>
                        </p>
                    </div>

                    {/* 底部連結 */}
                    <div className="mt-10 pt-6 border-t border-black/10 dark:border-white/10 flex flex-wrap gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <button
                            onClick={() => { playClick(); navigate('/privacy'); }}
                            className="hover:text-primary transition-colors flex items-center gap-1"
                        >
                            <Shield size={14} />
                            隱私權政策
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

export default Terms;
