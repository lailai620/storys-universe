// Supabase Edge Function: Claude AI Proxy
// 部署方式: supabase functions deploy ai-proxy --no-verify-jwt
// 設定 Secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''

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
        const { contents, action } = await req.json()

        // 將舊格式 contents 轉換為 Claude 的 messages 格式
        const messages = (contents || []).map((c: { role: string, parts: { text: string }[] }) => ({
            role: c.role === 'model' ? 'assistant' : 'user',
            content: c.parts?.map((p: { text: string }) => p.text).join('') || ''
        }))

        // 呼叫 Claude API
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

        // 解析 Claude 回傳的 JSON
        let parsedResult = { emotion: 'calm', spoken_reply: '', story_content: '' }
        try {
            // 清除可能的 markdown 包裹 (```json ... ```)
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
