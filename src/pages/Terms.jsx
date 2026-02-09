import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, AlertTriangle, Ban, Copyright, Gavel } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Helmet } from 'react-helmet-async';

/**
 * 使用條款頁面
 */
const Terms = () => {
    const navigate = useNavigate();
    const { playClick, playHover } = useAudio();

    const sections = [
        {
            icon: Scale,
            title: '服務使用規範',
            content: [
                '您必須年滿 13 歲才能使用本服務',
                '您須對帳戶活動負完全責任',
                '不得將帳戶轉讓或出售給他人',
                '須遵守所有適用的法律法規',
            ],
        },
        {
            icon: Copyright,
            title: '智慧財產權',
            content: [
                '您創作的原創內容歸您所有',
                '您授予我們非專屬的展示和分發權利',
                '平台上的商標、Logo 和設計歸我們所有',
                '禁止未經授權使用平台的智慧財產',
            ],
        },
        {
            icon: Ban,
            title: '禁止行為',
            content: [
                '發布違法、仇恨或騷擾性內容',
                '侵犯他人智慧財產權或隱私權',
                '使用自動化工具大量擷取內容',
                '試圖入侵、破解或干擾平台運作',
            ],
        },
        {
            icon: AlertTriangle,
            title: '免責聲明',
            content: [
                '服務以「現狀」提供，不保證不中斷',
                'AI 生成內容可能包含錯誤或不當內容',
                '我們不對用戶生成內容負責',
                '對於任何間接損失不承擔責任',
            ],
        },
        {
            icon: Gavel,
            title: '終止與糾紛',
            content: [
                '我們保留隨時終止或暫停帳戶的權利',
                '違反條款可能導致帳戶被永久停用',
                '爭議適用台灣法律並由台灣法院管轄',
                '我們可能隨時修改這些條款',
            ],
        },
    ];

    return (
        <>
            <Helmet>
                <title>使用條款 - Storys Universe</title>
                <meta name="description" content="Storys Universe 的服務使用條款，說明您使用我們服務時的權利和義務。" />
            </Helmet>

            <div className="min-h-screen bg-[#0f1016] text-slate-100 py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    {/* 返回按鈕 */}
                    <button
                        onClick={() => { playClick(); navigate(-1); }}
                        onMouseEnter={playHover}
                        className="flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                        返回
                    </button>

                    {/* 標題 */}
                    <div className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                                <FileText className="text-amber-400" size={24} />
                            </div>
                            <h1 className="text-3xl font-bold">使用條款</h1>
                        </div>
                        <p className="text-slate-400">
                            最後更新日期：2026 年 2 月 9 日
                        </p>
                    </div>

                    {/* 引言 */}
                    <div className="mb-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-slate-300 leading-relaxed">
                            歡迎使用 Storys Universe！使用我們的服務即表示您同意以下條款。請仔細閱讀這些條款，如果您不同意任何條款，請勿使用本服務。
                        </p>
                    </div>

                    {/* 條款內容 */}
                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <div key={index} className="group">
                                <div className="flex items-center gap-3 mb-4">
                                    <section.icon className="text-amber-400" size={20} />
                                    <h2 className="text-xl font-bold">{section.title}</h2>
                                </div>
                                <ul className="space-y-2 pl-8">
                                    {section.content.map((item, i) => (
                                        <li key={i} className="text-slate-400 flex items-start gap-2">
                                            <span className="text-amber-400 mt-1.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* 同意聲明 */}
                    <div className="mt-12 p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20">
                        <p className="text-slate-400">
                            繼續使用 Storys Universe 即表示您已閱讀、理解並同意遵守這些使用條款。如有任何疑問，請透過{' '}
                            <a href="mailto:legal@storys-universe.com" className="text-amber-400 hover:underline">
                                legal@storys-universe.com
                            </a>{' '}
                            與我們聯繫。
                        </p>
                    </div>

                    {/* 底部連結 */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-slate-500">
                        <button
                            onClick={() => { playClick(); navigate('/privacy'); }}
                            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <FileText size={14} />
                            隱私權政策
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Terms;
