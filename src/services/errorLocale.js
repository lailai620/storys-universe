/**
 * 🌐 錯誤訊息中文化 — errorLocale.js
 * 將 Supabase Auth 的英文錯誤訊息翻譯為繁體中文
 */

const ERROR_MAP = {
    // Auth 錯誤
    'Invalid login credentials': '帳號或密碼錯誤，請重新確認',
    'Email not confirmed': '此信箱尚未驗證，請檢查信箱並進行驗證',
    'User already registered': '此信箱已被註冊，請直接登入',
    'Signup requires a valid password': '密碼格式不正確（至少 6 個字元）',
    'Password should be at least 6 characters': '密碼需至少 6 個字元',
    'Unable to validate email address: invalid format': '請輸入正確的電子郵件格式',
    'User not found': '找不到此帳號',
    'Email rate limit exceeded': '請求太頻繁，請稍後再試',
    'For security purposes, you can only request this after': '安全限制，請稍後再試',
    'Database error saving new user': '帳號建立失敗，請稍後再試',
    'Token has expired or is invalid': '登入已逾期，請重新登入',
    'JWT expired': '登入已逾期，請重新登入',
    'new row violates row-level security policy': '權限不足，請重新登入',

    // 網路錯誤
    'Failed to fetch': '網路連線失敗，請檢查網路狀態',
    'NetworkError': '網路連線異常，請檢查網路狀態',
    'Load failed': '載入失敗，請重新整理頁面',

    // Supabase 尚未設定
    'Supabase 尚未設定': '服務尚未連線，暫時使用訪客模式',
};

/**
 * 翻譯錯誤訊息為繁體中文
 * @param {string} message - 原始錯誤訊息
 * @returns {string} 中文化後的訊息
 */
export const localizeError = (message) => {
    if (!message) return '發生未知錯誤，請稍後再試';

    // 精確匹配
    if (ERROR_MAP[message]) return ERROR_MAP[message];

    // 部分匹配
    for (const [key, value] of Object.entries(ERROR_MAP)) {
        if (message.includes(key)) return value;
    }

    // fallback: 如果是英文就給通用訊息
    if (/^[a-zA-Z\s.,!?'":;()]+$/.test(message)) {
        return '操作失敗，請稍後再試';
    }

    return message;
};

export default localizeError;
