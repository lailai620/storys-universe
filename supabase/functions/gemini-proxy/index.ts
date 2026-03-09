// Supabase Edge Function: Gemini API Proxy
// 部署方式: supabase functions deploy gemini-proxy --no-verify-jwt
// 設定 Secret: supabase secrets set GEMINI_API_KEY=your-key-here

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_MODEL = 'gemini-2.0-flash'
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''

// AI 使用限制
const LIMITS = {
    free: { weekly: 5 },
    pro: { monthly: 100 },
}

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

        // 解析請求
        const { contents, systemInstruction, generationConfig, action } = await req.json()

        // 呼叫 Gemini API
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                systemInstruction,
                generationConfig: generationConfig || {
                    temperature: 0.8,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 300,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                ],
            }),
        })

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json().catch(() => ({}))
            console.error('Gemini API error:', geminiResponse.status, errorData)
            return new Response(JSON.stringify({ error: 'AI 服務暫時不可用' }), {
                status: 502,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 更新使用次數
        await supabase
            .from('wl_ai_usage')
            .update({ call_count: (usage?.call_count || 0) + 1 })
            .eq('user_id', user.id)
            .eq('period_type', periodType)

        const data = await geminiResponse.json()
        const remaining = limit - (usage?.call_count || 0) - 1

        return new Response(JSON.stringify({ ...data, remaining, limit, isPro }), {
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
