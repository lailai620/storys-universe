import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, FileText, Mail, Heart, ExternalLink } from 'lucide-react';
import { useAudio } from '../../context/AudioContext';

/**
 * 🦶 全站 Footer
 * 商業級網站必備：品牌、法律連結、聯繫方式
 */
const Footer = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { playClick } = useAudio();

    // 在特定頁面隱藏 Footer
    const hiddenPaths = ['/login', '/creator', '/create', '/child-reader', '/admin'];
    const shouldHide = hiddenPaths.some(p => location.pathname.startsWith(p));
    if (shouldHide) return null;

    const legalLinks = [
        { label: '隱私權政策', path: '/privacy', icon: Shield },
        { label: '使用條款', path: '/terms', icon: FileText },
    ];

    return (
        <footer className="relative z-20 border-t border-white/5 bg-[#0a0b10]/80 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-6 py-10">
                {/* 上半部：品牌 + 導航 */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
                    {/* 品牌區 */}
                    <div className="max-w-xs">
                        <div className="text-lg font-bold tracking-[0.3em] text-white/80 mb-2">
                            STORYS
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            為靈魂而生的創作避難所。<br />
                            封存珍貴回憶，構思偉大篇章。
                        </p>
                    </div>

                    {/* 導航連結 */}
                    <div className="flex gap-12">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">探索</h4>
                            <ul className="space-y-2">
                                <li>
                                    <button onClick={() => { playClick(); navigate('/gallery'); }} className="text-sm text-slate-500 hover:text-white transition-colors cursor-pointer">
                                        星際畫廊
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => { playClick(); navigate('/creator'); }} className="text-sm text-slate-500 hover:text-white transition-colors cursor-pointer">
                                        開始創作
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">法律</h4>
                            <ul className="space-y-2">
                                {legalLinks.map(link => (
                                    <li key={link.path}>
                                        <button
                                            onClick={() => { playClick(); navigate(link.path); }}
                                            className="text-sm text-slate-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                                        >
                                            <link.icon size={12} />
                                            {link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">聯繫</h4>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="mailto:contact@storys-universe.com"
                                        className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1.5"
                                    >
                                        <Mail size={12} />
                                        聯絡我們
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 分隔線 */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />

                {/* 下半部：版權 */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-600">
                    <span>© 2026 Storys Universe. All rights reserved.</span>
                    <span className="flex items-center gap-1">
                        Made with <Heart size={10} className="text-rose-500" /> in Taiwan
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
