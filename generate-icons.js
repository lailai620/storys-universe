/**
 * PWA Icon 生成腳本
 * 使用 sharp 從原始 Logo 生成各尺寸的 PWA icon
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, 'src', 'logo-v5.png');
const OUTPUT_DIR = path.join(__dirname, 'public', 'icons');

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
    // 確保輸出目錄存在
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    for (const size of sizes) {
        const filename = `icon-${size}x${size}.png`;
        const outputPath = path.join(OUTPUT_DIR, filename);

        await sharp(SOURCE)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 15, g: 16, b: 22, alpha: 1 }
            })
            .png()
            .toFile(outputPath);

        console.log(`✅ Generated ${filename}`);
    }

    // Apple touch icon
    await sharp(SOURCE)
        .resize(180, 180, {
            fit: 'contain',
            background: { r: 15, g: 16, b: 22, alpha: 1 }
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
    console.log('✅ Generated apple-touch-icon.png');

    // Shortcut icons
    await sharp(SOURCE)
        .resize(96, 96, {
            fit: 'contain',
            background: { r: 15, g: 16, b: 22, alpha: 1 }
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, 'create-96x96.png'));
    console.log('✅ Generated create-96x96.png');

    await sharp(SOURCE)
        .resize(96, 96, {
            fit: 'contain',
            background: { r: 15, g: 16, b: 22, alpha: 1 }
        })
        .png()
        .toFile(path.join(OUTPUT_DIR, 'gallery-96x96.png'));
    console.log('✅ Generated gallery-96x96.png');

    console.log('\\n🎉 All icons generated!');
}

generateIcons().catch(console.error);
