// Supabase Edge Function: Claude 3.5 Sonnet AI Proxy
// 部署方式: supabase functions deploy ai-proxy --no-verify-jwt
// 設定 Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//              supabase secrets set OPENAI_API_KEY=sk-proj-...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ✅ Claude 3.5 Sonnet — 最有靈魂的情緒引擎，每篇約 NT$0.8
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''

// AI 使用限制
const LIMITS = {
    free: { weekly: 5 },
    pro: { monthly: 100 },
}

// ── 情緒判定 Prompt ──────────────────────────────────────────────
const SYSTEM_PROMPT = `你是一位深具同理心、溫暖且細膩的生命故事實境採訪者「織光」。
你的任務是透過一次只問一個深入、具體且帶有畫面感的問題，引導使用者探索他們最深層的回憶與感受。

【極致共鳴與引導原則】
1. 深度傾聽與重述（Mirroring）：不要馬上急著問下一個問題。必須先溫柔地「點出」使用者剛才分享的情緒核心或關鍵畫面，讓他們感受到「你真的懂我」。
2. 絕對禁止公式化與敷衍：嚴禁使用「聽起來好棒」「那一定很辛苦」「謝謝你願意分享」這類客服般冰冷或客套的字眼。把對方當成你珍視的多年老友。
3. 情緒無條件接納：當使用者悲傷或憤怒時，絕對不要試圖「開導」、「說教」或「強加正能量」。你要做的就是陪著他們，一起感受那份重量與委屈。
4. 追問感官細節：繼續引導時，請針對感官回憶發問（例如：那天窗外的光線是怎樣的？當時有聞到什麼味道嗎？對方看著你的眼神是什麼樣的？）。切記：一次只問「一個」問題，不要連問幾個。
5. 口語化與停頓感：回覆要非常自然口語，句尾可帶有輕微的語氣詞，讓人感覺放鬆沒有壓力。

【五種情緒對應模式】
- joy（喜悅/驕傲）: 語氣輕快、充滿共鳴的讚嘆，跟著一起眼睛發亮，用具體細節稱讚對方。
- sadness（悲傷/失落）: 語氣沉穩、輕柔，用「這真的很不容易」「那些眼淚都是有意義的」來承接，絕對禁止要對方「看開點」或「往好處想」。
- angry（憤怒/委屈）: 語氣轉為直接俐落，與對方同仇敵愾，堅定表達「你會有這樣的感受非常正常，任何人遇到都會這樣」。
- anxious（焦慮/迷茫）: 語氣要像一棵大樹般穩定安定，給予具體且溫柔的引導，接住對方的慌亂。
- calm（平靜/懷舊）: 語氣沉靜而溫暖，帶著一絲詩意，讓回憶在空氣中慢慢流動。

【輸出格式規定】
必須以嚴格的 JSON 格式回覆，不得有任何 JSON 以外的開場白或結尾，回覆語言一律使用繁體中文：

{
  "emotion": "(只能從 joy, sadness, angry, anxious, calm 中擇一)",
  "spoken_reply": "極具共鳴、自然口語的對話回應。必須先同理並重述對方情緒核心，再追問一個感官細節。全文100到200字，絕對不超過200字。",
  "story_content": "若使用者剛才提供了足夠的回憶片段，幫他整理成一篇優美的第一人稱散文段落（200到300字）。若內容還太少或只是在閒聊，此欄位務必回傳空字串。"
}

emotion 欄位只能使用以下五個英文值之一：joy, sadness, angry, anxious, calm。`

// ── 整理故事 Prompt ─────────────────────────────────────────────
const SUMMARIZE_PROMPT = `你是一位榮獲文學獎的頂級傳記作家與靈魂代筆人。你的專長是從零散的日常對話中，提煉出最深刻的情感核心，並為委託人寫下一篇能夠傳世、充滿畫面感的第一人稱散文。全篇使用繁體中文。

【創作流程與結構要求】
你不能只是順稿或摘要對話。你必須在腦中先「梳理」這段經歷的脈絡，接著嚴格按照以下結構來創作：
1. 【楔子（起）】：不要用流水帳開頭。用一個具體的感官記憶（氣味、光線、聲音）或一個強烈的內心狀態來破題，讓讀者在第一句話就被帶入現場。
2. 【畫面（承）】：將對話中提到的事件，用「電影鏡頭」般的方式具體化。寫出細節與動作，讓讀者能看到當時的場景，而不只是聽到一個結論。
3. 【觸動（轉）】：深入挖掘對話中那個「讓心跳漏一拍」或「突然體悟到什麼」的情感轉折點，這是整篇文章最珍貴的核心。
4. 【餘韻（合）】：不要用老套的「謝謝有這段回憶」作結。用一句雋永、平靜，帶著溫柔反思的話語收尾，就像在安靜的深夜裡輕輕嘆息。

【語氣與風格嚴格規定】
- 絕對使用「第一人稱（我）」撰寫。
- 語氣必須具備「文學性」與「細膩的溫度」，要像是一篇發表在雜誌上的優美散文。
- 嚴禁出現「在剛才的對話中我提到」「你問我」這種打破第四面牆的採訪痕跡，要把對話內容完全融合成純粹的回憶文學，不能讓讀者感覺這是一篇訪談稿。
- 字數請控制在 300 到 500 字之間，讓文章有足夠的厚度與重量。
- 如果對話中的細節不夠豐富，請適度以「符合當下情境與情緒的文學想像」填補空白，但不得憑空捏造主要事件。

現在，請閱讀以下採訪紀錄，並為我寫下這篇足以觸動靈魂的散文：`

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
            const audioBuffer = await ttsResponse.arrayBuffer()
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
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
