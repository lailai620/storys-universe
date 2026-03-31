/**
 * ============================================================================
 * 📸 織光照片服務層 — Photo Upload & Management
 * ============================================================================
 * 使用 File API 進行照片選取、壓縮、預覽，
 * 以 localStorage (base64) 進行持久化儲存。
 *
 * 未來可遷移至 Supabase Storage 進行雲端備份。
 */

import imageCompression from 'browser-image-compression';

const STORAGE_KEY = 'weaving_photos';
const MAX_SIZE = 1200; // 最大邊長（像素）
const QUALITY = 0.8;   // 預設壓縮品質

/**
 * 開啟檔案選取器並取得照片（支援多選）
 * @param {boolean} multiple - 是否允許多選
 * @returns {Promise<File[]>}
 */
export const pickPhotos = (multiple = true) => {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = multiple;
        input.capture = 'environment'; // 行動裝置可直接拍照

        input.onchange = (e) => {
            const files = Array.from(e.target.files || []);
            resolve(files);
        };

        // 使用者取消選取
        input.oncancel = () => resolve([]);
        // Fallback: 視窗重新取得焦點時檢查
        window.addEventListener('focus', () => {
            setTimeout(() => {
                if (!input.files?.length) resolve([]);
            }, 300);
        }, { once: true });

        input.click();
    });
};

/**
 * 壓縮照片並轉為 base64 (使用 browser-image-compression)
 * @param {File} file - 圖片檔案
 * @param {object} options - { maxSize, quality }
 * @returns {Promise<{ base64: string, width: number, height: number, name: string }>}
 */
export const compressPhoto = async (file, options = {}) => {
    const { maxSize = MAX_SIZE, quality = QUALITY } = options;

    try {
        const opts = {
            maxSizeMB: 0.2,          // 目標大小約 200KB
            maxWidthOrHeight: maxSize,
            useWebWorker: true,
            fileType: 'image/webp',  // 轉為 WebP 省空間
            initialQuality: quality,
            alwaysKeepResolution: false,
        };

        const compressedFile = await imageCompression(file, opts);

        // 將壓縮後的 File 轉為 base64 存檔，同時取得最終圖片尺寸
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                const base64 = reader.result;
                const img = new Image();
                img.onload = () => {
                    resolve({ base64, width: img.width, height: img.height, name: file.name });
                };
                img.onerror = () => {
                    // 若失敗提供 fallback 尺寸
                    resolve({ base64, width: maxSize, height: maxSize, name: file.name });
                };
                img.src = base64;
            };
            reader.onerror = () => reject(new Error('檔案讀取失敗'));
        });
    } catch (error) {
        console.error('圖片壓縮過程發生錯誤:', error);
        throw new Error('圖片處理失敗');
    }
};

/**
 * 選取並壓縮照片（一步完成）
 * @param {boolean} multiple
 * @returns {Promise<Array<{ id, base64, width, height, name, date }>>}
 */
export const pickAndCompressPhotos = async (multiple = true) => {
    const files = await pickPhotos(multiple);
    if (files.length === 0) return [];

    const results = [];
    for (const file of files) {
        try {
            const compressed = await compressPhoto(file);
            results.push({
                id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                ...compressed,
                date: new Date().toISOString(),
            });
        } catch (e) {
            console.warn('照片壓縮失敗，跳過:', file.name, e);
        }
    }

    return results;
};

// ─── 照片持久化（localStorage）──────────────────────────────

/**
 * 儲存照片到指定集合
 * @param {string} collectionId - 集合 ID（例如某篇故事的 ID）
 * @param {Array} photos - pickAndCompressPhotos 的回傳值
 */
export const savePhotos = (collectionId, photos) => {
    try {
        const all = getAllPhotoCollections();
        if (!all[collectionId]) {
            all[collectionId] = { photos: [], updatedAt: new Date().toISOString() };
        }
        all[collectionId].photos.push(...photos);
        all[collectionId].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
        console.error('儲存照片失敗:', e);
        // localStorage 可能已滿
        if (e.name === 'QuotaExceededError') {
            throw new Error('儲存空間已滿，請刪除一些照片後再試');
        }
        throw e;
    }
};

/**
 * 取得某集合的所有照片
 * @param {string} collectionId
 * @returns {Array}
 */
export const getPhotos = (collectionId) => {
    const all = getAllPhotoCollections();
    return all[collectionId]?.photos || [];
};

/**
 * 取得所有照片集合
 */
export const getAllPhotoCollections = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

/**
 * 取得所有照片總數
 */
export const getTotalPhotoCount = () => {
    const all = getAllPhotoCollections();
    return Object.values(all).reduce((sum, col) => sum + (col.photos?.length || 0), 0);
};

/**
 * 刪除單張照片
 * @param {string} collectionId
 * @param {string} photoId
 */
export const deletePhoto = (collectionId, photoId) => {
    const all = getAllPhotoCollections();
    if (all[collectionId]) {
        all[collectionId].photos = all[collectionId].photos.filter(p => p.id !== photoId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
};

/**
 * 刪除整個集合
 * @param {string} collectionId
 */
export const deleteCollection = (collectionId) => {
    const all = getAllPhotoCollections();
    delete all[collectionId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

/**
 * 格式化檔案大小
 */
export const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
