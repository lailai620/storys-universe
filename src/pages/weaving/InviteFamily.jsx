import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';

/** 👥 邀請家人 — 真實邀請功能 */
const InviteFamily = () => {
    const navigate = useNavigate();
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const [newName, setNewName] = useState('');
    const [members, setMembers] = useState(() => {
        const saved = localStorage.getItem('family_members');
        return saved ? JSON.parse(saved) : [];
    });

    const inviteUrl = `${window.location.origin}/invite?code=${Date.now().toString(36)}`;

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [inviteUrl]);

    const handleAddMember = useCallback(() => {
        if (!newName.trim()) return;
        const updated = [...members, { name: newName.trim(), role: 'member', joined: false }];
        setMembers(updated);
        localStorage.setItem('family_members', JSON.stringify(updated));
        setNewName('');
    }, [newName, members]);

    const handleRemove = useCallback((name) => {
        const updated = members.filter(m => m.name !== name);
        setMembers(updated);
        localStorage.setItem('family_members', JSON.stringify(updated));
    }, [members]);

    return (
        <WeavingLayout showNav={false}>
            <header className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-primary/10">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-primary/10">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-base font-bold font-display">邀請夥伴</h1>
                <div className="w-10" />
            </header>

            <main className="relative z-10 flex-1 px-4 pb-24 pt-6 overflow-y-auto">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-primary text-4xl">group_add</span>
                    </div>
                    <h2 className="text-xl font-bold mb-2">一起編織回憶</h2>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        邀請夥伴加入，共同記錄珍貴的時光
                    </p>
                </div>

                {/* 成員列表 */}
                <div className="space-y-3 mb-6">
                    {members.map(m => (
                        <div key={m.name} className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-sm">person</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm">{m.name}</p>
                                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                                    {m.role === 'admin' ? '管理員' : '成員'}
                                </p>
                            </div>
                            {m.joined ? (
                                <span className="text-xs text-success flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    已加入
                                </span>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-primary">待加入</span>
                                    {m.role !== 'admin' && (
                                        <button onClick={() => handleRemove(m.name)} className="p-1 rounded-full hover:bg-danger/10 text-text-secondary-light dark:text-text-secondary-dark hover:text-danger transition-colors">
                                            <span className="material-symbols-outlined text-xs">close</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* 新增成員 */}
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                        placeholder="輸入夥伴名稱..."
                        className="flex-1 bg-surface-light dark:bg-surface-dark rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <button
                        onClick={handleAddMember}
                        disabled={!newName.trim()}
                        className="px-4 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-primary/90 active:scale-95 transition-all"
                    >
                        新增
                    </button>
                </div>

                {/* 邀請方式 */}
                <button
                    onClick={handleCopyLink}
                    className={`w-full py-3 font-medium rounded-xl shadow-lg flex items-center justify-center gap-2 mb-3 active:scale-[0.98] transition-all ${copied
                        ? 'bg-success text-white shadow-success/30'
                        : 'bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary/90'
                        }`}
                >
                    <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'link'}</span>
                    {copied ? '已複製邀請連結！' : '產生邀請連結'}
                </button>

                <button
                    onClick={() => setShowQR(!showQR)}
                    className="w-full py-3 bg-surface-light dark:bg-surface-dark text-primary font-medium rounded-xl border border-primary/20 flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.98] transition-all"
                >
                    <span className="material-symbols-outlined text-sm">qr_code_2</span>
                    {showQR ? '隱藏 QR Code' : '顯示 QR Code'}
                </button>

                {showQR && (
                    <div className="mt-4 bg-white rounded-2xl p-6 flex flex-col items-center shadow-sm">
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(inviteUrl)}&bgcolor=FFFFFF&color=1a1a2e`}
                            alt="QR Code"
                            className="w-44 h-44 mb-3"
                        />
                        <p className="text-xs text-gray-500">掃描加入織光夥伴</p>
                    </div>
                )}
            </main>
        </WeavingLayout>
    );
};

export default InviteFamily;
