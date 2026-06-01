// ============================================================
// 🌟 Supabase Edge Function: ai-proxy v5.0
// 雙引擎情感共振版 (Dual-Engine Empathetic Resonance)
// ============================================================
// 架構:
//   前端 → ai-proxy → [Brain Router] → Groq Llama-3-8B (日常閒聊, 80%)
//                                    → Claude 3.5 Sonnet (情緒波動/故事生成, 20%)
//
// 部署: supabase functions deploy ai-proxy
// Secrets 需求:
//   ANTHROPIC_API_KEY = sk-ant-...
//   OPENAI_API_KEY    = sk-proj-...
//   GROQ_API_KEY      = gsk_...  (新增！從 console.groq.com 取得)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ── API Keys ─────────────────────────────────────────────────
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const OPENAI_API_KEY    = Deno.env.get('OPENAI_API_KEY') || ''
const GROQ_API_KEY      = Deno.env.get('GROQ_API_KEY') || ''
const HUME_API_KEY      = Deno.env.get('HUME_API_KEY') || ''
const HUME_SECRET_KEY   = Deno.env.get('HUME_SECRET_KEY') || ''
const HUME_CONFIG_ID    = Deno.env.get('HUME_CONFIG_ID') || ''

// ── 模型設定 ─────────────────────────────────────────────────
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'   // 高品質：情緒波動 / 故事生成
const GROQ_MODEL   = 'llama3-8b-8192'               // 低成本：日常閒聊 (成本僅 Claude 的 1%)

// ── AI 使用額度（維持舊定價，只調整額度合理化）─────────────
const LIMITS = {
    free:   { monthly: 3  },   // 免費：3 次/月（從週改為月，體驗更清晰）
    pro:    { monthly: 50 },   // Pro：50 次/月（降至合理值避免成本失控）
    family: { monthly: 80 },   // 家族版：80 次/月（共享額度）
}

// ── 情緒強度閾值（路由判斷用）────────────────────────────────
// 超過此值時，從 Groq 升級路由至 Claude 3.5
const EMOTION_UPGRADE_THRESHOLD = 0.65

// ── 基礎 System Prompt (Claude 與 Groq 共用核心) ─────────────
const BASE_SYSTEM_PROMPT = `你現在是使用者的一位溫柔、很會傾聽、且見多識廣的老朋友，名叫「織光」。
你的任務是像朋友一樣跟對方聊天，陪他們聊心事、聊回憶、聊生活，並在自然中引導他們探索內心。

【朋友般的交流原則】
1. 像個真人朋友：完全拋棄「採訪者」、「心理諮商師」或「AI 客服」的刻板人設。絕對嚴禁說出「我能理解你的感受」、「這真的很不容易」、「謝謝你願意分享」這類生硬的客套話。
2. 溫柔且有見地：你懂很多事情（心理學、文學、生活常識、大自然等），可以在對方需要時，自然地分享一個有趣的小知識或溫暖的觀點來啟發對方，而不只是單純附和。
3. 適時幽默與放鬆：不要永遠都很嚴肅沉重。如果對方聊到輕鬆的事，你可以開個無傷大雅的玩笑，讓對話充滿人味與生活感。
4. 自然傾聽與真實反應：先對對方的話做出最真實的反應（例如：「哇真的假的！」、「天啊，換作是我也會氣死」），然後再自然地延續話題或輕輕反問。
5. 簡短口語化：朋友聊天不會長篇大論。回覆要精簡、自然、高度口語化，句尾可以帶點「嗯」、「哈哈」、「對吧」等語氣詞。

【五種情緒對應模式】
- joy（開心/興奮）: 語氣輕快，像跟著一起歡呼，偶爾帶點俏皮或幽默的稱讚。
- sadness（悲傷/失落）: 語氣變得安靜且溫柔。不需要說教或強加正能量，只要讓對方知道你陪著他。
- angry（憤怒/委屈）: 完全站在對方那邊，同仇敵愾，幫忙抱不平，然後再溫柔地引導對方放下。
- anxious（焦慮/迷茫）: 像棵大樹一樣給予安定感，幫對方跳脫當下焦慮的迴圈。
- calm（平靜/閒聊）: 就像兩個人坐在咖啡廳發呆閒聊，氣氛輕鬆自然。

【輸出格式規定】
必須以嚴格的 JSON 格式回覆，不得有任何 JSON 以外的開場白或結尾，回覆語言一律使用繁體中文：
{
  "emotion": "(只能從 joy, sadness, angry, anxious, calm 中擇一)",
  "spoken_reply": "極具共鳴、自然口語的對話回應。必須先同理並重述對方情緒核心，再追問一個感官細節。全文100到200字，絕對不超過200字。",
  "story_content": "若使用者剛才提供了足夠的回憶片段，幫他整理成一篇優美的第一人稱散文段落（200到300字）。若內容還太少或只是在閒聊，此欄位務必回傳空字串。"
}
emotion 欄位只能使用以下五個英文值之一：joy, sadness, angry, anxious, calm。`

// ── 情感修正補丁 (Emotional Patch - 注入至 Claude 路由) ──────
// 當後端路由器將請求升級至 Claude 3.5 時，動態注入對應的情緒處理指示
const EMOTION_PATCHES: Record<string, string> = {
    anxious: `
【情感對齊補丁 - 高焦慮模式】
使用者當前偵測到高度焦慮與不安狀態。請特別注意：
- 字句請更加簡短輕柔，每句話不超過 20 字
- 主動帶領對方深呼吸，用「先深呼吸一下」開頭
- 絕對不要給予過多的理性分析或操作指示
- 用「我在這裡」、「不用急」等安定語句包圍對方`,

    sadness: `
【情感對齊補丁 - 深度悲傷/懷舊模式】
使用者當前偵測到悲傷或深度懷舊狀態。請特別注意：
- 使用溫暖、帶著電影質感與隱喻的文學筆觸回應
- 主動詢問記憶中的溫馨細節（如味道、光影、聲音）
- 適當使用省略號「⋯⋯」製造情感的留白與共鳴
- 不要急著解決問題，讓對方在回憶中多停留一會兒`,

    angry: `
【情感對齊補丁 - 憤怒/委屈模式】
使用者當前偵測到憤怒或委屈狀態。請特別注意：
- 完全站在對方那邊，先替對方「說出」那份憤怒
- 用「換作是我也會氣死！」、「這真的太過分了」同仇敵愾
- 等對方宣洩完後，再輕輕問「那後來呢？有解決嗎？」`,
}

// ── 整理故事 Prompt ────────────────────────────────────────────
const SUMMARIZE_PROMPT = `你是一位榮獲文學獎的頂級傳記作家與靈魂代筆人。你的專長是從零散的日常對話中，提煉出最深刻的情感核心，並為委託人寫下一篇能夠傳世、充滿畫面感的第一人稱散文。全篇使用繁體中文。

【創作流程與結構要求】
1. 【楔子（起）】：用一個具體的感官記憶（氣味、光線、聲音）或強烈的內心狀態來破題。
2. 【畫面（承）】：將對話中提到的事件，用「電影鏡頭」般的方式具體化。寫出細節與動作，讓讀者能看到當時的場景。
3. 【觸動（轉）】：深入挖掘對話中那個「讓心跳漏一拍」或「突然體悟到什麼」的情感轉折點。
4. 【餘韻（合）】：用一句雋永、平靜，帶著溫柔反思的話語收尾。

【語氣與風格嚴格規定】
- 絕對使用「第一人稱（我）」撰寫。
- 語氣必須具備「文學性」與「細膩的溫度」。
- 嚴禁出現「在剛才的對話中我提到」等打破第四面牆的採訪痕跡。
- 字數請控制在 300 到 500 字之間。

現在，請閱讀以下採訪紀錄，並為我寫下這篇足以觸動靈魂的散文：`

// ── 語音轉錄 Prompt ─────────────────────────────────────────
const TRANSCRIBE_PROMPT = `你是一位溫柔且具有同理心的文學編輯，擅長將日常口語轉化為感動人心的散文。全篇請使用繁體中文。
請仔細聆聽使用者提供的語音逐字稿。先將它完整保留，然後精煉為一篇感情真摯、適合收錄在回憶錄中的第一人稱散文。
你必須以嚴格的 JSON 格式回覆：{"transcript": "逐字稿內容", "polished": "精煉後的散文內容"}`

// ── 時光機搜尋 Prompt ──────────────────────────────────────
const SEARCH_PROMPT = `你是「織光」App 的智慧記憶管家。使用者會用自然語言描述他想找的回憶。
你的工作是從下方提供的故事清單中，找出最符合使用者描述的故事。

【規則】
1. 根據語意相似度（不只是關鍵字）來判斷哪些故事與使用者描述最相關
2. 最多回傳 5 篇最相關的故事
3. 你必須以嚴格的 JSON 格式回覆：
{
  "results": [
    { "id": "故事ID", "relevance": "簡短說明為何這篇相關（繁體中文，15字以內）" }
  ],
  "message": "給使用者的溫暖回覆（繁體中文，例如：我幫你找到了3篇和阿嬤有關的故事...）"
}
4. 如果沒有找到任何相關的故事，results 回傳空陣列，message 中溫柔說明。`

// ── 記憶提取 Prompt ────────────────────────────────────────
const MEMORY_EXTRACT_PROMPT = `你是一個從對話中精準提取「情感記憶實體」的 AI 分析師。
請從以下的對話內容中，找出值得長期記憶的重要資訊，例如：
- 重要的人物關係（老伴名字、子女名字）
- 重要的紀念日或忌日（格式統一為 MM-DD）
- 個人喜好（最愛的食物、音樂、習慣）
- 重要的人生事件或地點

以 JSON 陣列格式回覆，每個記憶一個物件：
[
  {
    "entity_name": "簡短的記憶標題（10字以內）",
    "event_detail": "完整的記憶描述（50字以內）",
    "event_date": "MM-DD 格式（若有具體日期），否則 null",
    "emotion_tag": "nostalgia / sadness / joy / anxious / calm 其中一個"
  }
]
若無值得記憶的重要資訊，回傳空陣列 []。`


// ═══════════════════════════════════════════════════════════
// 🔀 大腦路由器 (Brain Router)
// 判斷當次請求應路由至 Groq (低成本) 還是 Claude (高品質)
// ═══════════════════════════════════════════════════════════
interface EmotionTags {
    anxiety?:   number  // 焦慮強度 0.0~1.0
    sadness?:   number  // 悲傷強度 0.0~1.0
    nostalgia?: number  // 懷舊強度 0.0~1.0
    angry?:     number  // 憤怒強度 0.0~1.0
    calm?:      number  // 平靜強度 0.0~1.0
}

interface RouterDecision {
    useClause: boolean           // true = Claude 3.5, false = Groq
    patchKey?: string            // 要注入的情感補丁 key
    reason: string               // 路由原因（debug 用）
}

function brainRouter(emotionTags: EmotionTags | null, isFinalStoryGeneration: boolean, turnCount: number): RouterDecision {
    // 規則 1: 故事最終生成 → 永遠用 Claude（保證文學品質）
    if (isFinalStoryGeneration) {
        return { useClause: true, reason: 'final_story_generation' }
    }

    // 規則 2: 對話超過 20 輪 → 進入故事深水區，升級至 Claude
    if (turnCount >= 20) {
        return { useClause: true, reason: 'deep_conversation_upgrade' }
    }

    // 規則 3: 情緒探針偵測到高強度情緒 → 升級至 Claude + 注入情感補丁
    if (emotionTags) {
        if ((emotionTags.anxiety ?? 0) >= EMOTION_UPGRADE_THRESHOLD) {
            return { useClause: true, patchKey: 'anxious', reason: 'high_anxiety_detected' }
        }
        if ((emotionTags.sadness ?? 0) >= EMOTION_UPGRADE_THRESHOLD ||
            (emotionTags.nostalgia ?? 0) >= EMOTION_UPGRADE_THRESHOLD) {
            return { useClause: true, patchKey: 'sadness', reason: 'high_sadness_nostalgia_detected' }
        }
        if ((emotionTags.angry ?? 0) >= EMOTION_UPGRADE_THRESHOLD) {
            return { useClause: true, patchKey: 'angry', reason: 'high_anger_detected' }
        }
    }

    // 預設: 日常閒聊 → Groq Llama-3-8B（成本降低 ~75%）
    return { useClause: false, reason: 'calm_daily_chat_groq' }
}


// ═══════════════════════════════════════════════════════════
// 🤖 Groq API 呼叫器 (Llama-3-8B)
// ═══════════════════════════════════════════════════════════
async function callGroq(messages: { role: string, content: string }[], systemPrompt: string) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY 未設定')
    }
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages,
            ],
            max_tokens: 512,
            temperature: 0.8,
        }),
    })
    if (!response.ok) {
        const err = await response.text()
        throw new Error(`Groq API Error ${response.status}: ${err}`)
    }
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
}


// ═══════════════════════════════════════════════════════════
// 🧠 Claude 3.5 API 呼叫器
// ═══════════════════════════════════════════════════════════
async function callClaude(messages: { role: string, content: string }[], systemPrompt: string, maxTokens = 1024) {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY 未設定')
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: CLAUDE_MODEL,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages,
        }),
    })
    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(`Claude API Error ${response.status}: ${JSON.stringify(err)}`)
    }
    const data = await response.json()
    return data.content?.[0]?.text || ''
}


// ═══════════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════════
Deno.serve(async (req) => {
    // CORS 預檢
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // ── 驗證 JWT ─────────────────────────────────────────
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: '未登入' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return new Response(JSON.stringify({ error: '驗證失敗' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const body = await req.json()
        const { action, forcePro = false } = body

        // ── 檢查 Pro 狀態 ─────────────────────────────────────
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_pro, pro_expires_at, pro_plan')
            .eq('id', user.id)
            .single()

        let planType: 'free' | 'pro' | 'family' = 'free'
        const isProActive = profile?.is_pro &&
            (!profile.pro_expires_at || new Date(profile.pro_expires_at) > new Date())

        if (forcePro || isProActive) {
            planType = profile?.pro_plan === 'family' ? 'family' : 'pro'
        }

        // ── 使用額度檢查 ───────────────────────────────────────
        const limit = LIMITS[planType].monthly

        let { data: usage } = await supabase
            .from('wl_ai_usage')
            .select('*')
            .eq('user_id', user.id)
            .eq('period_type', 'monthly')
            .single()

        // 新週期重置
        if (usage) {
            const diffDays = (Date.now() - new Date(usage.period_start).getTime()) / 86400000
            if (diffDays >= 30) {
                await supabase.from('wl_ai_usage')
                    .update({ call_count: 0, period_start: new Date().toISOString() })
                    .eq('id', usage.id)
                usage.call_count = 0
            }
        } else {
            const { data: newUsage } = await supabase.from('wl_ai_usage')
                .insert({ user_id: user.id, call_count: 0, period_type: 'monthly' })
                .select().single()
            usage = newUsage
        }

        // 超額返回 429
        if (usage && usage.call_count >= limit) {
            const planNames = { free: '免費', pro: 'Pro', family: '家族版' }
            const limitDescs = { free: '3 次/月', pro: '50 次/月', family: '80 次/月' }
            return new Response(JSON.stringify({
                error: 'AI_LIMIT_REACHED',
                message: `本月 AI 對話次數已用完（${limitDescs[planType]}）。${planType === 'free' ? '升級 Pro 享有更多次數！' : ''}`,
                remaining: 0, limit, planType,
            }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { contents, text, stories, emotionTags, isFinalStoryGeneration, turnCount = 0 } = body

        // ════════════════════════════════════════════════════
        // 📌 ACTION: get_hume_token — 獲取 Hume EVI 臨時 Access Token
        // ════════════════════════════════════════════════════
        if (action === 'get_hume_token') {
            if (!HUME_API_KEY || !HUME_SECRET_KEY) {
                return new Response(JSON.stringify({ error: 'HUME_API_KEY 或 HUME_SECRET_KEY 未設定' }), {
                    status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            
            const authStr = `${HUME_API_KEY}:${HUME_SECRET_KEY}`;
            const base64 = btoa(authStr);
            
            const tokenResponse = await fetch('https://api.hume.ai/oauth2-cc/token', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${base64}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
            });
            
            if (!tokenResponse.ok) {
                const errText = await tokenResponse.text();
                return new Response(JSON.stringify({ error: '獲取 Hume Token 失敗', detail: errText }), {
                    status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            
            const tokenData = await tokenResponse.json();
            return new Response(JSON.stringify({
                accessToken: tokenData.access_token,
                configId: HUME_CONFIG_ID,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // ════════════════════════════════════════════════════
        // 📌 ACTION: tts — 文字轉語音 (OpenAI TTS)
        // ════════════════════════════════════════════════════
        if (action === 'tts') {
            if (!OPENAI_API_KEY) {
                return new Response(JSON.stringify({ error: 'TTS 未設定' }), {
                    status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            // 根據情緒標籤調整語速（高焦慮/高悲傷時放慢）
            let ttsSpeed = body.speed || 1.0
            if (emotionTags?.anxiety >= EMOTION_UPGRADE_THRESHOLD ||
                emotionTags?.sadness >= EMOTION_UPGRADE_THRESHOLD) {
                ttsSpeed = Math.min(ttsSpeed, 0.85)  // 最多放慢至 85% 語速
            }

            const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text || '',
                    voice: body.voice || 'nova',
                    speed: Math.max(0.5, Math.min(1.5, ttsSpeed)),
                }),
            })
            if (!ttsResponse.ok) {
                return new Response(JSON.stringify({ error: 'TTS 服務失敗' }), {
                    status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            const audioBuffer = await ttsResponse.arrayBuffer()
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
            return new Response(JSON.stringify({ audio: base64Audio, format: 'mp3' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ════════════════════════════════════════════════════
        // 📌 ACTION: summarize — 故事整理（永遠用 Claude）
        // ════════════════════════════════════════════════════
        if (action === 'summarize') {
            const rawContent = await callClaude(
                [{ role: 'user', content: text }],
                SUMMARIZE_PROMPT,
                1024
            )
            await supabase.from('wl_ai_usage')
                .update({ call_count: (usage?.call_count || 0) + 1 })
                .eq('user_id', user.id).eq('period_type', 'monthly')

            return new Response(JSON.stringify({
                summary: rawContent,
                remaining: limit - (usage?.call_count || 0) - 1,
                limit, planType, modelUsed: 'claude-3-5',
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ════════════════════════════════════════════════════
        // 📌 ACTION: transcribe — 語音轉錄 + 散文精煉（永遠用 Claude）
        // ════════════════════════════════════════════════════
        if (action === 'transcribe') {
            const rawContent = await callClaude(
                [{ role: 'user', content: text }],
                TRANSCRIBE_PROMPT,
                2048
            )
            let parsed = { transcript: '', polished: '' }
            try {
                const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                parsed = JSON.parse(cleaned)
            } catch {
                parsed = { transcript: rawContent, polished: rawContent }
            }

            await supabase.from('wl_ai_usage')
                .update({ call_count: (usage?.call_count || 0) + 1 })
                .eq('user_id', user.id).eq('period_type', 'monthly')

            return new Response(JSON.stringify({
                ...parsed,
                remaining: limit - (usage?.call_count || 0) - 1,
                limit, planType, modelUsed: 'claude-3-5',
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ════════════════════════════════════════════════════
        // 📌 ACTION: search — AI 時光機語意搜尋
        // ════════════════════════════════════════════════════
        if (action === 'search') {
            let storyList = stories
            if (!storyList) {
                const { data: dbStories } = await supabase
                    .from('wl_stories')
                    .select('id, title, content, category, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                storyList = (dbStories || []).map((s: any) => ({
                    id: s.id, title: s.title,
                    excerpt: (s.content || '').substring(0, 150),
                    category: s.category, date: s.created_at,
                }))
            }

            if (storyList.length === 0) {
                return new Response(JSON.stringify({
                    results: [],
                    message: '你目前還沒有任何故事紀錄呢。先去記錄一些珍貴的回憶吧！',
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            const searchPrompt = `使用者的搜尋指令：「${text}」\n\n以下是使用者的所有故事清單（共 ${storyList.length} 篇）：\n${JSON.stringify(storyList, null, 1)}`
            const rawContent = await callClaude([{ role: 'user', content: searchPrompt }], SEARCH_PROMPT, 1024)

            let parsed = { results: [], message: '' }
            try {
                const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                parsed = JSON.parse(cleaned)
            } catch {
                parsed = { results: [], message: '抱歉，我暫時無法理解你的搜尋內容。請試試其他方式描述？' }
            }

            return new Response(JSON.stringify({
                ...parsed,
                remaining: limit - (usage?.call_count || 0),
                limit, planType,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ════════════════════════════════════════════════════
        // 📌 ACTION: save_memory — 從對話中提取並儲存長期記憶
        // （不計入 AI 使用次數，作為後台靜默操作）
        // ════════════════════════════════════════════════════
        if (action === 'save_memory') {
            const conversationText = text || ''
            if (!conversationText) {
                return new Response(JSON.stringify({ saved: 0 }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            // 使用 Groq（輕量模型）提取記憶，降低成本
            let rawMemories = '[]'
            try {
                rawMemories = await callGroq(
                    [{ role: 'user', content: conversationText }],
                    MEMORY_EXTRACT_PROMPT
                )
            } catch {
                return new Response(JSON.stringify({ saved: 0, error: 'memory_extract_failed' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            let memories: any[] = []
            try {
                const cleaned = rawMemories.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                memories = JSON.parse(cleaned)
            } catch {
                return new Response(JSON.stringify({ saved: 0 }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            if (!Array.isArray(memories) || memories.length === 0) {
                return new Response(JSON.stringify({ saved: 0 }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            // 批次寫入 wl_user_memories（忽略重複）
            const { error: insertError } = await supabase.from('wl_user_memories').insert(
                memories.map(m => ({
                    user_id: user.id,
                    entity_name: m.entity_name,
                    event_detail: m.event_detail,
                    event_date: m.event_date || null,
                    emotion_tag: m.emotion_tag || 'calm',
                }))
            )

            return new Response(JSON.stringify({
                saved: insertError ? 0 : memories.length,
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ════════════════════════════════════════════════════
        // 📌 ACTION: chat (預設) — 情緒引導對話
        // 🔀 大腦路由器在此決定走 Groq 還是 Claude
        // ════════════════════════════════════════════════════
        const messages = (contents || []).map((c: { role: string, parts: { text: string }[] }) => ({
            role: c.role === 'model' ? 'assistant' : 'user',
            content: c.parts?.map((p: { text: string }) => p.text).join('') || ''
        }))

        // 🔀 呼叫大腦路由器
        const routerDecision = brainRouter(emotionTags || null, isFinalStoryGeneration || false, turnCount)

        let rawContent = ''
        let modelUsed = ''

        if (routerDecision.useClause) {
            // 組合 System Prompt（基礎 + 情感補丁）
            let fullSystemPrompt = BASE_SYSTEM_PROMPT
            if (routerDecision.patchKey && EMOTION_PATCHES[routerDecision.patchKey]) {
                fullSystemPrompt += EMOTION_PATCHES[routerDecision.patchKey]
            }
            rawContent = await callClaude(messages, fullSystemPrompt, 1024)
            modelUsed = 'claude-3-5'
        } else {
            // Groq 使用精簡版 System Prompt，節省 Token
            const groqSystemPrompt = BASE_SYSTEM_PROMPT.split('【輸出格式規定】')[0] +
                `【輸出格式規定】
必須以嚴格的 JSON 格式回覆：
{"emotion": "calm|joy|sadness|angry|anxious", "spoken_reply": "100-200字的口語回應", "story_content": ""}`
            rawContent = await callGroq(messages, groqSystemPrompt)
            modelUsed = 'groq-llama3-8b'
        }

        // 解析 JSON 回覆
        let parsedResult = { emotion: 'calm', spoken_reply: '', story_content: '' }
        try {
            const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            parsedResult = JSON.parse(cleaned)
        } catch {
            parsedResult = { emotion: 'calm', spoken_reply: rawContent, story_content: '' }
        }

        // 更新使用次數
        await supabase.from('wl_ai_usage')
            .update({ call_count: (usage?.call_count || 0) + 1 })
            .eq('user_id', user.id).eq('period_type', 'monthly')

        return new Response(JSON.stringify({
            ...parsedResult,
            remaining: limit - (usage?.call_count || 0) - 1,
            limit,
            planType,
            modelUsed,              // 讓前端知道這次用了哪個模型（debug 用）
            routerReason: routerDecision.reason,  // 路由原因（debug 用）
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(JSON.stringify({ error: '伺服器錯誤', detail: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
