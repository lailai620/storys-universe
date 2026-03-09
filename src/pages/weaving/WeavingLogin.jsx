import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { resetPassword } from '../../services/authService';
import { localizeError } from '../../services/errorLocale';
import { tapFeedback, successFeedback, errorFeedback } from '../../services/hapticService';

/**
 * 🔐 織光登入頁面 — 暖光設計
 * 支援 Email/密碼登入、快速註冊、Google/Apple/LINE 登入、忘記密碼、訪客模式
 */
const WeavingLogin = () => {
    const navigate = useNavigate();
    const { isAuthenticated, signInWithGoogle, signInWithEmail, signUpWithEmail, signInOffline } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isAuthenticated) navigate('/', { replace: true });
    }, [isAuthenticated, navigate]);

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        if (!email || (!password && mode !== 'forgot')) {
            setError('請填寫完整資訊');
            return;
        }
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (mode === 'forgot') {
                const result = await resetPassword(email);
                if (result?.error) {
                    setError(localizeError(result.error.message || '寄送失敗'));
                    errorFeedback();
                } else {
                    setSuccess('重設密碼信已寄出，請檢查信箱');
                    successFeedback();
                }
                setLoading(false);
                return;
            }

            let result;
            if (mode === 'signup') {
                result = await signUpWithEmail(email, password, displayName);
            } else {
                result = await signInWithEmail(email, password);
            }

            if (result?.error) {
                setError(localizeError(result.error.message || '登入失敗'));
                errorFeedback();
            } else if (mode === 'signup') {
                setError('');
                setMode('verify');
            }
        } catch (err) {
            setError(localizeError(err.message || '連線失敗'));
            errorFeedback();
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');
        const result = await signInWithGoogle();
        if (result?.error) {
            setError(result.error.message || 'Google 登入失敗');
            setLoading(false);
        }
    };

    const handleGuestMode = () => {
        signInOffline();
        navigate('/', { replace: true });
    };

    // 驗證信箱提示畫面
    if (mode === 'verify') {
        return (
            <div style={styles.page}>
                <div style={styles.gradientBg} />
                <div style={styles.contentCenter}>
                    <div style={styles.verifyIcon}>
                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#4CAF50' }}>mark_email_read</span>
                    </div>
                    <h2 style={styles.verifyTitle}>驗證信已寄出！</h2>
                    <p style={styles.verifyText}>
                        請前往 <strong style={{ color: '#D4A017' }}>{email}</strong> 信箱點擊驗證連結，完成後即可登入。
                    </p>
                    <button onClick={() => setMode('login')} style={styles.primaryBtn}>
                        回到登入頁
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            {/* 頂部暖色漸層 */}
            <div style={styles.gradientBg} />

            <div style={styles.content}>
                {/* Logo 區域 */}
                <div style={styles.logoSection}>
                    <div style={styles.logoCircle}>
                        <span className="material-symbols-outlined" style={styles.logoIcon}>auto_awesome</span>
                    </div>
                    <h1 style={styles.appName}>織光</h1>
                    <p style={styles.tagline}>
                        {mode === 'signup' ? '開始記錄你人生珍貴的故事' : '陪伴你，記錄你們的故事'}
                    </p>
                </div>

                {/* 表單區域 */}
                <form onSubmit={handleEmailAuth} style={styles.form}>
                    {mode === 'signup' && (
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>顯示名稱</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                placeholder="你想被怎麼稱呼？"
                                style={styles.input}
                            />
                        </div>
                    )}

                    {mode !== 'forgot' ? (
                        <>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>電子郵件</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                    style={styles.input}
                                    required
                                />
                            </div>
                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>密碼</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={styles.input}
                                    required
                                />
                            </div>
                        </>
                    ) : (
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>電子郵件</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                style={styles.input}
                                required
                            />
                            <p style={styles.forgotHint}>我們將寄送重設密碼連結到你的信箱</p>
                        </div>
                    )}

                    {/* 錯誤提示 */}
                    {error && (
                        <div style={styles.errorBox}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                            {error}
                        </div>
                    )}

                    {/* 成功提示 */}
                    {success && (
                        <div style={styles.successBox}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                            {success}
                        </div>
                    )}

                    {/* 主按鈕 */}
                    <button type="submit" disabled={loading} style={{
                        ...styles.primaryBtn,
                        opacity: loading ? 0.6 : 1,
                    }}>
                        {loading ? (
                            <div style={styles.spinner} />
                        ) : (
                            mode === 'forgot' ? '寄送重設連結' : mode === 'signup' ? '建立帳號' : '登入'
                        )}
                    </button>

                    {/* 次要按鈕（登入/註冊切換）*/}
                    {mode !== 'forgot' && (
                        <button
                            type="button"
                            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); setSuccess(''); }}
                            style={styles.secondaryBtn}
                        >
                            {mode === 'signup' ? '已有帳號？登入' : '快速註冊'}
                        </button>
                    )}

                    {/* 忘記密碼 */}
                    {mode === 'login' && (
                        <button
                            type="button"
                            onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                            style={styles.forgotBtn}
                        >
                            忘記密碼？
                        </button>
                    )}

                    {mode === 'forgot' && (
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            style={styles.forgotBtn}
                        >
                            返回登入
                        </button>
                    )}
                </form>

                {/* 社群登入區域 */}
                {mode !== 'forgot' && (
                    <div style={styles.socialSection}>
                        <p style={styles.socialLabel}>其他登入方式</p>
                        <div style={styles.socialRow}>
                            {/* Apple */}
                            <button style={{ ...styles.socialBtn, background: '#1a1a1a' }} onClick={() => setError('Apple 登入即將推出')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                            </button>
                            {/* Google */}
                            <button style={{ ...styles.socialBtn, background: '#fff', border: '1px solid #e0e0e0' }} onClick={handleGoogleLogin}>
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                            </button>
                            {/* LINE */}
                            <button style={{ ...styles.socialBtn, background: '#06C755' }} onClick={() => setError('LINE 登入即將推出')}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* 訪客模式 */}
                <button onClick={handleGuestMode} style={styles.guestBtn}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#D4A017' }}>local_fire_department</span>
                    先隨意看看
                </button>
            </div>
        </div>
    );
};

// ── 內聯樣式 ──────────────────────────────────
const styles = {
    page: {
        minHeight: '100vh',
        background: '#FFFBF5',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
    },
    gradientBg: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40%',
        background: 'linear-gradient(180deg, #F5D68A 0%, #FAECD3 40%, #FFFBF5 100%)',
        borderRadius: '0 0 50% 50%',
        transform: 'scaleX(1.5)',
        zIndex: 0,
    },
    content: {
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '60px 32px 32px',
        maxWidth: 400,
        width: '100%',
        margin: '0 auto',
    },
    contentCenter: {
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
    },
    // Logo
    logoSection: {
        textAlign: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(212, 160, 23, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 8px 32px rgba(212, 160, 23, 0.2)',
    },
    logoIcon: {
        fontSize: 40,
        color: '#D4A017',
    },
    appName: {
        fontSize: 28,
        fontWeight: 800,
        color: '#2D2A26',
        margin: '0 0 6px',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        color: '#8C8478',
        margin: 0,
    },
    // Form
    form: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: 600,
        color: '#5C574F',
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        border: '1.5px solid #E8E0D4',
        borderRadius: 12,
        fontSize: 15,
        color: '#2D2A26',
        background: '#FFFFFF',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    forgotHint: {
        fontSize: 12,
        color: '#A09890',
        margin: '4px 0 0',
    },
    // Buttons
    primaryBtn: {
        width: '100%',
        padding: '15px 24px',
        background: 'linear-gradient(135deg, #D4A017 0%, #E8B730 100%)',
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 700,
        border: 'none',
        borderRadius: 14,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: '0 4px 16px rgba(212, 160, 23, 0.35)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        marginTop: 4,
    },
    secondaryBtn: {
        width: '100%',
        padding: '14px 24px',
        background: '#FFFFFF',
        color: '#2D2A26',
        fontSize: 15,
        fontWeight: 600,
        border: '1.5px solid #E8E0D4',
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    forgotBtn: {
        background: 'none',
        border: 'none',
        color: '#A09890',
        fontSize: 13,
        cursor: 'pointer',
        padding: '8px 0',
        alignSelf: 'center',
    },
    // Social
    socialSection: {
        width: '100%',
        marginTop: 24,
        textAlign: 'center',
    },
    socialLabel: {
        fontSize: 12,
        color: '#A09890',
        marginBottom: 16,
        position: 'relative',
    },
    socialRow: {
        display: 'flex',
        justifyContent: 'center',
        gap: 20,
    },
    socialBtn: {
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'transform 0.15s',
    },
    // Guest
    guestBtn: {
        background: 'none',
        border: 'none',
        color: '#D4A017',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 24,
        padding: '8px 16px',
    },
    // Error & Success
    errorBox: {
        background: '#FFF0F0',
        color: '#D32F2F',
        fontSize: 13,
        padding: '10px 14px',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    successBox: {
        background: '#F0FFF4',
        color: '#2E7D32',
        fontSize: 13,
        padding: '10px 14px',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
    },
    // Verify
    verifyIcon: {
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(76, 175, 80, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    verifyTitle: {
        fontSize: 24,
        fontWeight: 700,
        color: '#2D2A26',
        marginBottom: 8,
    },
    verifyText: {
        fontSize: 14,
        color: '#8C8478',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 1.6,
    },
    // Spinner
    spinner: {
        width: 20,
        height: 20,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
    },
};

export default WeavingLogin;
