/**
 * 🔨 織光 APP — Production Build + Android Sync 腳本
 * 
 * 用途：一鍵 build + 同步到 Android assets → 準備打包 AAB
 * 執行：node build-and-sync.mjs  (使用系統 node)
 * 或：  "D:\SQL\node.exe" build-and-sync.mjs
 */
import { execSync } from 'child_process';
import { rmSync, mkdirSync, cpSync, existsSync } from 'fs';
import { resolve } from 'path';

const run = (cmd, label) => {
    console.log(`\n🔧 ${label}...`);
    console.log(`   $ ${cmd}\n`);
    try {
        execSync(cmd, { stdio: 'inherit', env: { ...process.env, FORCE_COLOR: '1' } });
        console.log(`   ✅ ${label} 完成`);
    } catch (e) {
        console.error(`   ❌ ${label} 失敗 (exit code: ${e.status})`);
        process.exit(1);
    }
};

console.log('🧶 織光 APP — 開始打包流程\n');

// Step 1: 清除舊 dist
const distPath = resolve('./dist');
if (existsSync(distPath)) {
    rmSync(distPath, { recursive: true, force: true });
    console.log('🗑️  清除舊 dist 完成');
}

// Step 2: Production Build (使用本機 node_modules 的 vite)
run('node node_modules/vite/bin/vite.js build', 'Production Build');

// Step 3: 手動把 dist 同步到 Android assets
const androidPublic = resolve('./android/app/src/main/assets/public');
console.log('\n📦 同步到 Android assets...');
if (existsSync(androidPublic)) {
    rmSync(androidPublic, { recursive: true, force: true });
}
mkdirSync(androidPublic, { recursive: true });
cpSync(distPath, androidPublic, { recursive: true });

// Capacitor 需要的橋接空檔案
import { writeFileSync } from 'fs';
const bridge = (f) => writeFileSync(resolve(androidPublic, f), '');
['cordova.js', 'cordova_plugins.js'].forEach(f => {
    const p = resolve(androidPublic, f);
    if (!existsSync(p)) bridge(p);
});

console.log('   ✅ Android 同步完成');
console.log(`\n🎉 全部完成！`);
console.log('');
console.log('📱 下一步：');
console.log('   1) 打開 Android Studio');
console.log('   2) Build → Clean Project');
console.log('   3) Build → Generate Signed App Bundle → 密碼: weaving123');
console.log('');
