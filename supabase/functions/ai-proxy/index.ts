// Supabase Edge Function: Claude AI Proxy
// 部署方式: supabase functions deploy ai-proxy --no-verify-jwt
// 設定 Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//              supabase secrets set OPENAI_API_KEY=sk-proj-...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

// AI 使用限制
const LIMITS = {
    free: { weekly: 5 },
    pro: { monthly: 100 },
}

// ── 情緒判定 Prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一位溫柔且情感細膩的生命故事採訪者「織光」。  
你的任務是引導使用者（不分年齡——可能是年輕人、中年人或長輩）說出內心深處最真實的回憶與感受。

【核心原則】
1. 在每次回覆前，你必須先分析使用者言語中透露的情緒。
2. 你的回覆絕對不能與使用者的情緒狀態相反（例如：使用者悲傷時，禁止說「太棒了！」「聽起來好溫暖！」）。
3. 你必須用最接近當下情緒的語氣來接住對方。

【五種情緒對應模式】
- joy（喜悅/驕傲）: 語氣輕快、充滿共鳴的讚嘆，可以一起開心。
- sadness（悲傷/失落）: 語氣沉穩、輕柔，用「這一定很不容易」「謝謝你願意告訴我這麼深刻的事」來承接，絕對禁止正向強撐。
- angry（憤怒/委屈）: 語氣轉為直接俐落，與對方同仇敵愾，讓對方感受到被站隊，表達「你的感受非常合理」。
- anxious（焦慮/迷茫）: 語氣穩定、安定，給予具體且溫柔的引導，讓人感到被接住，如同一棵樹幹。
- calm（平靜/懷舊）: 語氣沉靜而溫暖，帶著一絲詩意，讓回憶在空氣中慢慢流動。

【輸出格式規定】
你必須以嚴格的 JSON 格式回覆，不得有任何 JSON 以外的內容：

{
  "emotion": "sadness",
  "spoken_reply": "給使用者聽的安慰/採訪回應（200字以內，口語化）",
  "story_content": "若使用者提供了足夠的回憶內容，幫他整理成一篇優美的故事段落（300字以內）。若內容不足，此欄位回傳空字串。"
}

emotion 欄位只能使用以下五個英文值之一：joy, sadness, angry, anxious, calm。`

// ── 整理故事 Prompt ─────────────────────────────────────────────
const SUMMARIZE_PROMPT = `你是一位優秀的文字編輯，擅長將對話整理成流暢的散文。使用繁體中文。
請根據以下對話內容，整理成一篇溫暖的第一人稱短文（約200-300字）。保留所有具體細節，不要添加對話中沒有的內容。語氣溫柔自然，像是寫給未來自己的一封信。`

// ── 語音轉錄 Prompt ─────────────────────────────────────────────
const TRANSCRIBE_PROMPT = `你是一位溫柔且具有同理心的文學編輯，擅長將日常口語轉化為感動人心的散文。全篇請使用繁體中文。
請仔細聆聽使用者提供的語音逐字稿。先將它完整保留，然後精煉為一篇感情真摯、適合收錄在回憶錄中的第一人稱散文。
你必須以嚴格的 JSON 格式回覆：{"transcript": "逐字稿內容", "polished": "精煉後的散文內容"}`

// ── 時光機搜尋 Prompt ───────────────────────────────────────────
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


Deno.serve(async (req) => {
    // CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // 驗證使用者 JWT
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: '未登入' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return new Response(JSON.stringify({ error: '驗證失敗' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 檢查 Pro 狀態
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_pro, pro_expires_at, pro_plan')
            .eq('id', user.id)
            .single()

        const isPro = profile?.is_pro &&
            (!profile.pro_expires_at || new Date(profile.pro_expires_at) > new Date())

        // 檢查使用次數
        const periodType = isPro ? 'monthly' : 'weekly'
        const limit = isPro ? LIMITS.pro.monthly : LIMITS.free.weekly

        // 取得或建立使用紀錄
        let { data: usage } = await supabase
            .from('wl_ai_usage')
            .select('*')
            .eq('user_id', user.id)
            .eq('period_type', periodType)
            .single()

        // 檢查是否需要重置計數（新的週期）
        if (usage) {
            const periodStart = new Date(usage.period_start)
            const now = new Date()
            const diffMs = now.getTime() - periodStart.getTime()
            const diffDays = diffMs / (1000 * 60 * 60 * 24)
            const shouldReset = periodType === 'weekly' ? diffDays >= 7 : diffDays >= 30

            if (shouldReset) {
                await supabase
                    .from('wl_ai_usage')
                    .update({ call_count: 0, period_start: now.toISOString() })
                    .eq('id', usage.id)
                usage.call_count = 0
            }
        } else {
            // 首次使用，建立紀錄
            const { data: newUsage } = await supabase
                .from('wl_ai_usage')
                .insert({ user_id: user.id, call_count: 0, period_type: periodType })
                .select()
                .single()
            usage = newUsage
        }

        // 檢查是否超額
        if (usage && usage.call_count >= limit) {
            return new Response(JSON.stringify({
                error: 'AI_LIMIT_REACHED',
                message: isPro
                    ? '本月 AI 對話次數已用完（100 次/月）'
                    : '本週免費 AI 對話次數已用完（5 次/週），升級 Pro 享有每月 100 次',
                remaining: 0,
                limit,
                isPro,
            }), {
                status: 429,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 解析前端請求
        const body = await req.json()
        const { contents, action, text, stories } = body

        // ═══════════════════════════════════════════════
        // 📌 ACTION: tts — 文字轉語音 (OpenAI TTS)
        // ═══════════════════════════════════════════════
        if (action === 'tts') {
            if (!OPENAI_API_KEY) {
                return new Response(JSON.stringify({ error: 'TTS 未設定' }), {
                    status: 503,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'tts-1',
                    input: text || '',
                    voice: body.voice || 'nova',
                    speed: Math.max(0.5, Math.min(1.5, body.speed || 1.0)),
                }),
            })
            if (!ttsResponse.ok) {
                return new Response(JSON.stringify({ error: 'TTS 服務失敗' }), {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            // 回傳 base64 音訊
            const audioBuffer = await ttsResponse.arrayBuffer()
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
            // 不計入 AI 使用次數（TTS 不佔額度）
            return new Response(JSON.stringify({ audio: base64Audio, format: 'mp3' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ═══════════════════════════════════════════════
        // 📌 ACTION: summarize — 故事整理
        // ═══════════════════════════════════════════════
        if (action === 'summarize') {
            const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: 1024,
                    system: SUMMARIZE_PROMPT,
                    messages: [{ role: 'user', content: text }],
                }),
            })
            if (!claudeResponse.ok) {
                return new Response(JSON.stringify({ error: 'AI 整理故事失敗' }), {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            const data = await claudeResponse.json()
            const summary = data.content?.[0]?.text || ''

            // 更新使用次數
            await supabase
                .from('wl_ai_usage')
                .update({ call_count: (usage?.call_count || 0) + 1 })
                .eq('user_id', user.id)
                .eq('period_type', periodType)

            return new Response(JSON.stringify({
                summary,
                remaining: limit - (usage?.call_count || 0) - 1,
                limit, isPro,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ═══════════════════════════════════════════════
        // 📌 ACTION: transcribe — 語音逐字稿 + 散文精煉
        // ═══════════════════════════════════════════════
        if (action === 'transcribe') {
            const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: 2048,
                    system: TRANSCRIBE_PROMPT,
                    messages: [{ role: 'user', content: text }],
                }),
            })
            if (!claudeResponse.ok) {
                return new Response(JSON.stringify({ error: 'AI 轉錄失敗' }), {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }
            const data = await claudeResponse.json()
            const rawContent = data.content?.[0]?.text || '{}'
            let parsed = { transcript: '', polished: '' }
            try {
                const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                parsed = JSON.parse(cleaned)
            } catch {
                parsed = { transcript: rawContent, polished: rawContent }
            }

            await supabase
                .from('wl_ai_usage')
                .update({ call_count: (usage?.call_count || 0) + 1 })
                .eq('user_id', user.id)
                .eq('period_type', periodType)

            return new Response(JSON.stringify({
                ...parsed,
                remaining: limit - (usage?.call_count || 0) - 1,
                limit, isPro,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ═══════════════════════════════════════════════
        // 📌 ACTION: search — AI 時光機語意搜尋
        // ═══════════════════════════════════════════════
        if (action === 'search') {
            // 從資料庫撈出使用者的所有故事摘要
            let storyList = stories
            if (!storyList) {
                const { data: dbStories } = await supabase
                    .from('wl_stories')
                    .select('id, title, content, category, created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                storyList = (dbStories || []).map((s: any) => ({
                    id: s.id,
                    title: s.title,
                    excerpt: (s.content || '').substring(0, 150),
                    category: s.category,
                    date: s.created_at,
                }))
            }

            if (storyList.length === 0) {
                return new Response(JSON.stringify({
                    results: [],
                    message: '你目前還沒有任何故事紀錄呢。先去記錄一些珍貴的回憶吧！',
                }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            const searchPrompt = `使用者的搜尋指令：「${text}」

以下是使用者的所有故事清單（共 ${storyList.length} 篇）：
${JSON.stringify(storyList, null, 1)}`

            const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: CLAUDE_MODEL,
                    max_tokens: 1024,
                    system: SEARCH_PROMPT,
                    messages: [{ role: 'user', content: searchPrompt }],
                }),
            })

            if (!claudeResponse.ok) {
                return new Response(JSON.stringify({ error: 'AI 搜尋失敗' }), {
                    status: 502,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                })
            }

            const data = await claudeResponse.json()
            const rawContent = data.content?.[0]?.text || '{}'
            let parsed = { results: [], message: '' }
            try {
                const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                parsed = JSON.parse(cleaned)
            } catch {
                parsed = { results: [], message: '抱歉，我暫時無法理解你的搜尋內容。請試試其他方式描述？' }
            }

            // search 不計入 AI 使用次數

            return new Response(JSON.stringify({
                ...parsed,
                remaining: limit - (usage?.call_count || 0),
                limit, isPro,
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ═══════════════════════════════════════════════
        // 📌 ACTION: chat (default) — 情緒引導對話
        // ═══════════════════════════════════════════════
        const messages = (contents || []).map((c: { role: string, parts: { text: string }[] }) => ({
            role: c.role === 'model' ? 'assistant' : 'user',
            content: c.parts?.map((p: { text: string }) => p.text).join('') || ''
        }))

        const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                messages: messages,
            }),
        })

        if (!claudeResponse.ok) {
            const errorData = await claudeResponse.json().catch(() => ({}))
            console.error('Claude API error:', claudeResponse.status, errorData)
            return new Response(JSON.stringify({ error: 'AI 服務暫時不可用' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const claudeData = await claudeResponse.json()
        const rawContent = claudeData.content?.[0]?.text || '{}'

        let parsedResult = { emotion: 'calm', spoken_reply: '', story_content: '' }
        try {
            const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            parsedResult = JSON.parse(cleaned)
        } catch (e) {
            console.error('JSON parse error, raw:', rawContent)
            parsedResult = {
                emotion: 'calm',
                spoken_reply: rawContent,
                story_content: ''
            }
        }

        // 更新使用次數
        await supabase
            .from('wl_ai_usage')
            .update({ call_count: (usage?.call_count || 0) + 1 })
            .eq('user_id', user.id)
            .eq('period_type', periodType)

        const remaining = limit - (usage?.call_count || 0) - 1

        return new Response(JSON.stringify({
            ...parsedResult,
            remaining,
            limit,
            isPro,
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Edge function error:', error)
        return new Response(JSON.stringify({ error: '伺服器錯誤' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
