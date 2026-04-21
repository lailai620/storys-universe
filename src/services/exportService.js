/**
 * 📦 exportService.js — 一鍵匯出時光膠囊
 * 將所有故事、語音、照片打包成 ZIP 檔案下載
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getStories, getVoiceMessages, getMemories } from './dbService';

/**
 * 🎁 匯出所有回憶為 ZIP 檔
 * @param {Function} onProgress - 進度回呼 (0~100)
 * @returns {Promise<{success: boolean, fileName: string}>}
 */
export const exportAllData = async (onProgress = () => {}) => {
    const zip = new JSZip();
    let progress = 0;
    const updateProgress = (step) => {
        progress = Math.min(100, progress + step);
        onProgress(progress);
    };

    try {
        // ─── 1. 匯出故事 ─────────────────────────────────────
        onProgress(5);
        const stories = await getStories();
        updateProgress(15);

        // 建立故事 JSON
        zip.file('stories.json', JSON.stringify(stories, null, 2));

        // 每篇故事也建立可閱讀的 txt 檔案
        const storiesFolder = zip.folder('stories');
        stories.forEach((story, i) => {
            const date = story.created_at || story.createdAt || '';
            const dateStr = date ? new Date(date).toLocaleDateString('zh-TW') : '未知日期';
            const title = (story.title || `故事${i + 1}`).replace(/[\\/:*?"<>|]/g, '_');
            const content = [
                `標題：${story.title || '無標題'}`,
                `日期：${dateStr}`,
                `分類：${story.category || '未分類'}`,
                `──────────────────────────`,
                '',
                story.content || '（無內容）',
                '',
                `──────────────────────────`,
                `由「織光 APP」匯出`,
            ].join('\n');
            storiesFolder.file(`${String(i + 1).padStart(3, '0')}_${title}.txt`, content);
        });
        updateProgress(20);

        // ─── 2. 匯出語音訊息 ────────────────────────────────
        const voices = await getVoiceMessages();
        if (voices.length > 0) {
            const voicesFolder = zip.folder('voices');
            voicesFolder.file('voice_messages.json', JSON.stringify(voices, null, 2));

            // 如果語音有本地 blob URL 或 base64，嘗試匯出
            for (let i = 0; i < voices.length; i++) {
                const v = voices[i];
                if (v.audioData && typeof v.audioData === 'string' && v.audioData.startsWith('data:')) {
                    try {
                        const base64Data = v.audioData.split(',')[1];
                        const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                        voicesFolder.file(`voice_${i + 1}.webm`, byteArray);
                    } catch { /* 跳過無法解碼的音檔 */ }
                }
            }
        }
        updateProgress(20);

        // ─── 3. 匯出照片 ────────────────────────────────────
        const memories = await getMemories();
        if (memories.length > 0) {
            const photosFolder = zip.folder('photos');
            photosFolder.file('memories.json', JSON.stringify(memories, null, 2));

            // 嘗試下載遠端照片
            for (let i = 0; i < memories.length; i++) {
                const urls = memories[i].photo_urls || memories[i].photos || [];
                for (let j = 0; j < urls.length; j++) {
                    try {
                        const url = urls[j];
                        if (url && url.startsWith('http')) {
                            const response = await fetch(url);
                            if (response.ok) {
                                const blob = await response.blob();
                                const ext = blob.type?.includes('png') ? 'png' : 'jpg';
                                photosFolder.file(`memory_${i + 1}_photo_${j + 1}.${ext}`, blob);
                            }
                        }
                    } catch { /* 跳過下載失敗的照片 */ }
                }
            }
        }
        updateProgress(20);

        // ─── 4. 建立說明檔 ──────────────────────────────────
        const readmeContent = [
            '═══════════════════════════════════════════',
            '    📦 織光 — 你的時光膠囊',
            '═══════════════════════════════════════════',
            '',
            `匯出時間：${new Date().toLocaleString('zh-TW')}`,
            `故事數量：${stories.length} 篇`,
            `語音數量：${voices.length} 則`,
            `照片數量：${memories.length} 組`,
            '',
            '── 資料夾結構 ──────────────────────────',
            '',
            '📁 stories/       — 每篇故事的獨立文字檔',
            '📁 voices/        — 語音訊息原始檔案',
            '📁 photos/        — 照片原始檔案',
            '📄 stories.json   — 所有故事的結構化資料',
            '',
            '── 如何使用 ────────────────────────────',
            '',
            '• stories/ 資料夾中的 .txt 檔案可以直接閱讀',
            '• stories.json 包含完整的標籤、分類等 metadata',
            '• 照片和語音會盡可能匯出原始檔案',
            '',
            '── 關於織光 ────────────────────────────',
            '',
            '織光是一款陪伴你記錄生命故事的 APP。',
            '每一道光，都是一段值得被永遠記住的回憶。',
            '',
            '═══════════════════════════════════════════',
        ].join('\n');
        zip.file('README.txt', readmeContent);
        updateProgress(10);

        // ─── 5. 產生並下載 ZIP ─────────────────────────────
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        }, (metadata) => {
            onProgress(80 + Math.round(metadata.percent * 0.2));
        });

        const now = new Date();
        const fileName = `織光_時光膠囊_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.zip`;
        
        saveAs(blob, fileName);
        onProgress(100);

        return { success: true, fileName, storyCount: stories.length, voiceCount: voices.length };
    } catch (error) {
        console.error('匯出失敗:', error);
        throw error;
    }
};
