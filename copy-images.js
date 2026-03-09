const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\12709975-08a7-4b0b-a715-b68738a42ee2';
const dest = path.join(__dirname, 'src', 'assets', 'categories');

// Ensure dest dir exists
fs.mkdirSync(dest, { recursive: true });

const files = [
    ['category_family_1772775410839.png', 'family.png'],
    ['category_friends_1772775427492.png', 'friends.png'],
    ['category_work_1772775442507.png', 'work.png'],
    ['category_pets_1772775468226.png', 'pets.png'],
];

for (const [srcFile, destFile] of files) {
    const srcPath = path.join(src, srcFile);
    const destPath = path.join(dest, destFile);
    try {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ ${srcFile} → ${destFile}`);
    } catch (err) {
        console.error(`❌ Failed: ${srcFile} → ${destFile}: ${err.message}`);
    }
}
console.log('Done!');
