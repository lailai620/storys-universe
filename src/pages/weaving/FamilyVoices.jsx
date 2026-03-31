import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import { getVoiceMessages, formatDuration } from '../../services/voiceService';

/** 👨‍👩‍👧‍👦 家人聲音集錦 */
const FamilyVoices = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const load = async () => {
            const messages = await getVoiceMessages();
            // 按「from」分組統計
            const grouped = {};
            messages.forEach(m => {
                if (!grouped[m.from]) {
                    grouped[m.from] = { name: m.from, count: 0, totalDuration: 0 };
                }
                grouped[m.from].count++;
                grouped[m.from].totalDuration += (m.duration || 0);
            });

            const memberList = Object.values(grouped);
            setMembers(memberList);
        };
        load();
    }, []);

    return (
        <WeavingLayout>
            <header className="relative z-10 px-6 pt-12 pb-4">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-primary/10">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h1 className="text-xl font-bold font-display">親友聲音集錦</h1>
                </div>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    聽聽每位夥伴留下的溫暖悄悄話
                </p>
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 space-y-3">
                {members.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-primary text-4xl">record_voice_over</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2">還沒有語音訊息</h3>
                        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
                            為重要的人錄一段悄悄話吧
                        </p>
                        <button onClick={() => navigate('/voice-weave')} className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-[0.98] transition-all">
                            <span className="material-symbols-outlined text-sm mr-1 align-middle">mic</span>
                            錄第一段悄悄話
                        </button>
                    </div>
                ) : (
                    members.map(member => (
                        <button
                            key={member.name}
                            onClick={() => navigate('/voice-listen')}
                            className="w-full bg-surface-light dark:bg-surface-dark rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:bg-primary/5 active:scale-[0.98] transition-all text-left"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold">{member.name}</p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                    {member.count} 段悄悄話 · 共 {formatDuration(member.totalDuration)}
                                </p>
                            </div>
                            <span className="material-symbols-outlined text-sm text-text-secondary-light dark:text-text-secondary-dark">arrow_forward_ios</span>
                        </button>
                    ))
                )}
            </main>
        </WeavingLayout>
    );
};

export default FamilyVoices;
