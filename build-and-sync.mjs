/**
 * 🔨 織光 APP — Production Build + Capacitor Sync 腳本
 * 
 * 用途：一鍵 build + sync → 準備打包 Android APK
 * 執行：node build-and-sync.mjs
 */
import { execSync } from 'child_process';

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

// Step 1: Production Build
run('npx vite build', 'Production Build');

// Step 2: Capacitor Sync (同步到 Android)
run('npx cap sync android', 'Capacitor Sync (Android)');

console.log('\n🎉 全部完成！');
console.log('');
console.log('📱 下一步：');
console.log('   1) 執行 npx cap open android  ← 打開 Android Studio');
console.log('   2) 在 Android Studio 中 Build → Build APK');
console.log('   3) APK 會在 android/app/build/outputs/apk/ 目錄');
console.log('');
