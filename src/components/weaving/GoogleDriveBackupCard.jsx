import React, { useState, useEffect } from 'react';
import { connectGoogleDrive, getGoogleDriveToken, backupToGoogleDrive, getLastBackupInfo } from '../../services/googleDriveService';
import { useToast } from '../../context/ToastContext';
import { checkProStatus, getCurrentUser } from '../../services/authService';

const GoogleDriveBackupCard = () => {
    const { showToast } = useToast();
    const [isPro, setIsPro] = useState(false);
    const [token, setToken] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [backupInfo, setBackupInfo] = useState(null);

    useEffect(() => {
        const checkStatus = async () => {
            const user = getCurrentUser();
            if (user) {
                const pro = await checkProStatus(user.id);
                setIsPro(pro);
            }
            
            const t = await getGoogleDriveToken();
            setToken(t);
            setBackupInfo(getLastBackupInfo());
        };
        checkStatus();
    }, []);

    const handleConnect = async () => {
        if (!isPro) {
            showToast('雲端備份為 Pro 限定功能', 'info');
            return;
        }
        setIsConnecting(true);
        try {
            await connectGoogleDrive();
            // 注意：這裡會觸發 OAuth 跳轉，頁面會重新載入
        } catch (err) {
            console.error('Google Drive 連線失敗:', err);
            showToast('Google Drive 連線失敗', 'error');
            setIsConnecting(false);
        }
    };

    const handleBackup = async () => {
        if (!token) return;
        setIsBackingUp(true);
        try {
            const info = await backupToGoogleDrive(token);
            setBackupInfo(info);
            const msg = info.isUpdate ? '備份已更新！已覆蓋您 Google Drive 中的旧備份' : '備份成功！已安全存入您的 Google Drive';
            showToast(msg, 'success');
        } catch (err) {
            console.error('備份失敗:', err);
            showToast(`備份失敗：${err.message}`, 'error');
            // ✅ 擴展 token 失效的偵測範對
            const tokenInvalid = err.message.includes('401') ||
                err.message.includes('403') ||
                err.message.includes('expired') ||
                err.message.includes('revoked') ||
                err.message.includes('Invalid Credentials');
            if (tokenInvalid) setToken(null);
        } finally {
            setIsBackingUp(false);
        }
    };

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-primary/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${token ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                        <span className="material-symbols-outlined text-xl">
                            {token ? 'cloud_done' : 'cloud_sync'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Google Drive 雲端備份</h3>
                        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-1">
                            {!isPro && <span className="material-symbols-outlined text-[10px] text-primary">diamond</span>}
                            {token ? '已授權連線' : '尚未授權'}
                        </p>
                    </div>
                </div>
            </div>

            {token ? (
                <div className="space-y-4">
                    <div className="bg-background-light dark:bg-background-dark rounded-xl p-3 text-xs">
                        {backupInfo ? (
                            <div className="flex justify-between text-text-secondary-light dark:text-text-secondary-dark">
                                <span>上次備份</span>
                                <span>{new Date(backupInfo.lastBackupAt).toLocaleString('zh-TW')}</span>
                            </div>
                        ) : (
                            <p className="text-text-secondary-light dark:text-text-secondary-dark text-center">
                                尚未有備份紀錄
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleBackup}
                        disabled={isBackingUp}
                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isBackingUp ? (
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <span className="material-symbols-outlined text-sm">backup</span>
                        )}
                        {isBackingUp ? '備份中...' : '一鍵完整備份'}
                    </button>
                    <p className="text-[10px] text-center text-text-secondary-light dark:text-text-secondary-dark opacity-70">
                        備份將會儲存在您的 Google Drive，檔案名稱為 weaving_backup_...json
                    </p>
                </div>
            ) : (
                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full py-3 bg-surface-light dark:bg-surface-dark border-2 border-primary/20 text-primary font-bold rounded-xl active:scale-95 transition-all hover:bg-primary/5 disabled:opacity-50"
                >
                    {isConnecting ? '連線中...' : '授權 Google Drive 連線'}
                </button>
            )}
        </div>
    );
};

export default GoogleDriveBackupCard;
