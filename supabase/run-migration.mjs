/**
 * 🔧 Supabase SQL 遷移腳本
 * 透過 Supabase REST API 執行 SQL（使用 service_role 或 anon key）
 * 
 * Usage: node supabase/run-migration.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 從 .env 讀取設定
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ 請先在 .env 設定 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

console.log('🔗 連線到:', SUPABASE_URL);

// 讀取 SQL 檔案
const sqlFile = path.join(__dirname, 'migrations', '001_initial_schema.sql');
const sql = fs.readFileSync(sqlFile, 'utf-8');

// 將 SQL 拆分為獨立語句（跳過空行和註解）
const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

console.log(`📝 找到 ${statements.length} 個 SQL 語句\n`);

// 逐一執行
let success = 0;
let failed = 0;

for (const stmt of statements) {
    // 取第一行（去掉多行）作為描述
    const firstLine = stmt.split('\n').find(l => !l.startsWith('--') && l.trim()) || stmt.slice(0, 60);
    const desc = firstLine.trim().slice(0, 80);

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ query: stmt }),
        });

        if (res.ok) {
            console.log(`  ✅ ${desc}...`);
            success++;
        } else {
            const body = await res.text();
            // 很多語句（如 CREATE EXTENSION IF NOT EXISTS）可能透過 REST API 無法執行
            // 這是正常的，因為 anon key 沒有 DDL 權限
            console.log(`  ⚠️  ${desc}... (${res.status}: 需在 SQL Editor 執行)`);
            failed++;
        }
    } catch (e) {
        console.log(`  ❌ ${desc}... (${e.message})`);
        failed++;
    }
}

console.log(`\n📊 結果: ${success} 成功, ${failed} 需在 SQL Editor 執行`);

if (failed > 0) {
    console.log('\n💡 提示: DDL 語句需要在 Supabase Dashboard → SQL Editor 手動執行。');
    console.log(`   檔案位置: ${sqlFile}`);
    console.log('   請將整個 SQL 檔案內容複製貼上到 SQL Editor 並執行。');
}
