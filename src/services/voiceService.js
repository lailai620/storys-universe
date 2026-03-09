/**
 * ============================================================================
 * 🎤 織光語音服務層 — Voice Recording & Playback
 * ============================================================================
 * 使用 Web Audio API + MediaRecorder 進行語音錄製，
 * 以 localStorage (Blob URL → base64) 進行持久化儲存。
 * 
 * 未來可遷移至 Supabase Storage 進行雲端備份。
 */

// ─── 錄音管理器 ─────────────────────────────────────────────
let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;
let timerInterval = null;

/**
 * 開始錄音
 * @param {function} onTick - 每秒回呼 (seconds: number)
 * @returns {Promise<boolean>} 是否成功開始
 */
export const startRecording = async (onTick) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
            },
        });

        recordingStream = stream;
        audioChunks = [];

        mediaRecorder = new MediaRecorder(stream, {
            mimeType: getSupportedMimeType(),
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.start(250); // 每 250ms 收集一次資料

        // 計時器
        let seconds = 0;
        timerInterval = setInterval(() => {
            seconds++;
            onTick?.(seconds);
        }, 1000);

        return true;
    } catch (error) {
        console.error('無法啟動錄音:', error);
        return false;
    }
};

/**
 * 停止錄音並取得音訊資料
 * @returns {Promise<{ blob: Blob, url: string, duration: number } | null>}
 */
export const stopRecording = () => {
    return new Promise((resolve) => {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            resolve(null);
            return;
        }

        // 清除計時器
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: getSupportedMimeType() });
            const url = URL.createObjectURL(blob);

            // 計算時長
            const audio = new Audio(url);
            audio.addEventListener('loadedmetadata', () => {
                const duration = Math.round(audio.duration);
                resolve({ blob, url, duration });
            });
            // Fallback: 如果 loadedmetadata 沒觸發
            audio.addEventListener('error', () => {
                resolve({ blob, url, duration: 0 });
            });
            // 超時 fallback
            setTimeout(() => {
                resolve({ blob, url, duration: 0 });
            }, 2000);

            // 釋放麥克風
            if (recordingStream) {
                recordingStream.getTracks().forEach(t => t.stop());
                recordingStream = null;
            }
            audioChunks = [];
            mediaRecorder = null;
        };

        mediaRecorder.stop();
    });
};

/**
 * 取消錄音（不保存）
 */
export const cancelRecording = () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    if (recordingStream) {
        recordingStream.getTracks().forEach(t => t.stop());
        recordingStream = null;
    }
    audioChunks = [];
    mediaRecorder = null;
};

/**
 * 是否正在錄音
 */
export const isRecording = () => {
    return mediaRecorder?.state === 'recording';
};

// ─── 播放管理器 ─────────────────────────────────────────────
let currentAudio = null;
let playbackInterval = null;

/**
 * 播放語音
 * @param {string} url - 音訊 URL (Blob URL 或遠端 URL)
 * @param {function} onProgress - 進度回呼 (progress: 0-1, currentTime: number)
 * @param {function} onEnd - 播放結束回呼
 * @returns {HTMLAudioElement}
 */
export const playVoice = (url, onProgress, onEnd) => {
    // 停止目前播放中的音訊
    stopPlayback();

    currentAudio = new Audio(url);

    currentAudio.addEventListener('play', () => {
        playbackInterval = setInterval(() => {
            if (currentAudio && currentAudio.duration) {
                const progress = currentAudio.currentTime / currentAudio.duration;
                onProgress?.(progress, currentAudio.currentTime);
            }
        }, 100);
    });

    currentAudio.addEventListener('ended', () => {
        clearInterval(playbackInterval);
        playbackInterval = null;
        onEnd?.();
    });

    currentAudio.addEventListener('error', (e) => {
        console.error('播放錯誤:', e);
        clearInterval(playbackInterval);
        onEnd?.();
    });

    currentAudio.play().catch(e => console.error('播放失敗:', e));
    return currentAudio;
};

/**
 * 暫停/繼續播放
 */
export const togglePlayback = () => {
    if (!currentAudio) return;
    if (currentAudio.paused) {
        currentAudio.play();
    } else {
        currentAudio.pause();
    }
};

/**
 * 停止播放
 */
export const stopPlayback = () => {
    if (playbackInterval) {
        clearInterval(playbackInterval);
        playbackInterval = null;
    }
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
};

/**
 * 是否正在播放
 */
export const isPlaying = () => {
    return currentAudio && !currentAudio.paused;
};

// ─── 語音訊息持久化（localStorage + base64）──────────────────
const STORAGE_KEY = 'weaving_voice_messages';

/**
 * 將 Blob 轉為 base64 字串
 */
const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * 儲存語音訊息
 * @param {object} params
 * @param {Blob} params.blob - 音訊 Blob
 * @param {number} params.duration - 時長（秒）
 * @param {string} params.from - 發送者名稱
 * @param {string} params.category - 分類
 * @returns {Promise<object>} 儲存的訊息物件
 */
export const saveVoiceMessage = async ({ blob, duration, from = '我', category = 'default' }) => {
    try {
        const base64 = await blobToBase64(blob);
        const messages = getVoiceMessages();

        const msg = {
            id: `voice_${Date.now()}`,
            from,
            category,
            duration,
            base64,
            date: new Date().toISOString(),
            transcribed: false,
            transcript: '',
        };

        messages.unshift(msg);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        return msg;
    } catch (e) {
        console.error('儲存語音失敗:', e);
        throw e;
    }
};

/**
 * 取得所有語音訊息
 * @returns {Array}
 */
export const getVoiceMessages = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

/**
 * 取得特定語音訊息的播放 URL
 * @param {string} id
 * @returns {string|null}
 */
export const getVoiceUrl = (id) => {
    const messages = getVoiceMessages();
    const msg = messages.find(m => m.id === id);
    return msg?.base64 || null;
};

/**
 * 刪除語音訊息
 * @param {string} id
 */
export const deleteVoiceMessage = (id) => {
    const messages = getVoiceMessages().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
};

/**
 * 更新語音訊息的轉譯文字
 * @param {string} id
 * @param {string} transcript
 */
export const updateTranscript = (id, transcript) => {
    const messages = getVoiceMessages();
    const idx = messages.findIndex(m => m.id === id);
    if (idx >= 0) {
        messages[idx].transcribed = true;
        messages[idx].transcript = transcript;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
};

// ─── 音訊視覺化（波形）──────────────────────────────────────
let analyserNode = null;

/**
 * 取得錄音中的音量等級（0-1）
 * @returns {number}
 */
export const getAudioLevel = () => {
    if (!analyserNode) return 0;
    const data = new Uint8Array(analyserNode.fftSize);
    analyserNode.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
    }
    return Math.sqrt(sum / data.length);
};

// ─── 工具函數 ───────────────────────────────────────────────

/**
 * 格式化秒數為 mm:ss
 */
export const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/**
 * 格式化日期
 */
export const formatDate = (isoString) => {
    try {
        const d = new Date(isoString);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
        return '';
    }
};

/**
 * 取得支援的 MIME 類型
 */
function getSupportedMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'];
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'audio/webm';
}
