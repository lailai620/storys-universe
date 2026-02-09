import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Mail, FileText } from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { Helmet } from 'react-helmet-async';

/**
 * 隱私權政策頁面
 * 符合 GDPR/台灣個資法的基本格式
 */
const Privacy = () => {
    const navigate = useNavigate();
    const { playClick, playHover } = useAudio();

    const sections = [
        {
            icon: Eye,
            title: '我們收集的資訊',
            content: [
                '帳戶資訊：電子郵件地址、顯示名稱',
                '創作內容：您在平台上創作的故事和圖片',
                '使用數據：閱讀紀錄、偏好設定、互動行為',
                '技術資訊：裝置類型、瀏覽器版本、IP 位址',
            ],
        },
        {
            icon: Shield,
            title: '資訊使用方式',
            content: [
                '提供、維護和改進我們的服務',
                '個人化您的閱讀和創作體驗',
                '發送服務通知和更新資訊',
                'AI 功能的模型訓練（可選擇退出）',
            ],
        },
        {
            icon: Lock,
            title: '資料安全',
            content: [
                '使用 SSL/TLS 加密保護傳輸中的數據',
                '資料儲存於安全的雲端伺服器',
                '定期進行安全審核和漏洞掃描',
                '嚴格的員工資料存取控制',
            ],
        },
        {
            icon: UserCheck,
            title: '您的權利',
            content: [
                '查閱：您可以隨時查看您的個人資料',
                '更正：您可以更新不正確的資訊',
                '刪除：您可以要求刪除您的帳戶和資料',
                '可攜性：您可以下載您的創作內容',
            ],
        },
    ];

    return (
        <>
            <Helmet>
                <title>隱私權政策 - Storys Universe</title>
                <meta name="description" content="Storys Universe 的隱私權政策，說明我們如何收集、使用和保護您的個人資訊。" />
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
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30">
                                <Shield className="text-indigo-400" size={24} />
                            </div>
                            <h1 className="text-3xl font-bold">隱私權政策</h1>
                        </div>
                        <p className="text-slate-400">
                            最後更新日期：2026 年 2 月 9 日
                        </p>
                    </div>

                    {/* 引言 */}
                    <div className="mb-12 p-6 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-slate-300 leading-relaxed">
                            Storys Universe（「我們」）非常重視您的隱私。本政策說明我們如何收集、使用、儲存和保護您在使用我們服務時提供的個人資訊。
                        </p>
                    </div>

                    {/* 政策內容 */}
                    <div className="space-y-8">
                        {sections.map((section, index) => (
                            <div key={index} className="group">
                                <div className="flex items-center gap-3 mb-4">
                                    <section.icon className="text-indigo-400" size={20} />
                                    <h2 className="text-xl font-bold">{section.title}</h2>
                                </div>
                                <ul className="space-y-2 pl-8">
                                    {section.content.map((item, i) => (
                                        <li key={i} className="text-slate-400 flex items-start gap-2">
                                            <span className="text-indigo-400 mt-1.5">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* 聯絡資訊 */}
                    <div className="mt-12 p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20">
                        <div className="flex items-center gap-3 mb-3">
                            <Mail className="text-indigo-400" size={20} />
                            <h3 className="font-bold">聯絡我們</h3>
                        </div>
                        <p className="text-slate-400">
                            如果您對本隱私權政策有任何疑問，請透過以下方式聯繫我們：<br />
                            <a href="mailto:privacy@storys-universe.com" className="text-indigo-400 hover:underline">
                                privacy@storys-universe.com
                            </a>
                        </p>
                    </div>

                    {/* 底部連結 */}
                    <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm text-slate-500">
                        <button
                            onClick={() => { playClick(); navigate('/terms'); }}
                            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <FileText size={14} />
                            使用條款
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Privacy;
