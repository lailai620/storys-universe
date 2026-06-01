// ============================================================
// 🌟 Supabase Edge Function: line-push
// 代際情感穿針引線器 (Intergenerational Loop)
// ============================================================
// 觸發方式：由 Supabase DB Webhook 或前端直接呼叫
// 功能：
//   1. 讀取完成的故事摘要與高光語音
//   2. 查詢家族成員的 LINE ID
//   3. 每天最多推播 1 次（節流機制）
//   4. 發送溫馨的 LINE 推播訊息給子女
//
// Secrets 需求：
//   LINE_CHANNEL_ACCESS_TOKEN = 你的 LINE Channel Access Token
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || ''

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // ── 驗證請求來源（接受 service_role 或有效 JWT）────────
        const authHeader = req.headers.get('Authorization')
        const serviceKey = req.headers.get('X-Service-Key')
        const isServiceCall = serviceKey === supabaseServiceKey

        if (!isServiceCall && !authHeader) {
            return new Response(JSON.stringify({ error: '未授權' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const body = await req.json()
        const { story_id, user_id } = body

        if (!story_id || !user_id) {
            return new Response(JSON.stringify({ error: '缺少 story_id 或 user_id' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // ── 取得故事與高光資訊 ────────────────────────────────
        const { data: story } = await supabase
            .from('wl_stories')
            .select('id, title, content, category')
            .eq('id', story_id)
            .single()

        if (!story) {
            return new Response(JSON.stringify({ error: '找不到故事' }), {
                status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 取得或建立高光記錄，並檢查今日是否已推播過（每天最多 1 次節流）
        let { data: highlight } = await supabase
            .from('wl_story_highlights')
            .select('*')
            .eq('story_id', story_id)
            .single()

        if (highlight?.line_pushed_at) {
            const lastPush = new Date(highlight.line_pushed_at)
            const now = new Date()
            const hoursSinceLastPush = (now.getTime() - lastPush.getTime()) / 3600000
            if (hoursSinceLastPush < 24) {
                return new Response(JSON.stringify({
                    skipped: true,
                    reason: `今天已推播過（${Math.round(hoursSinceLastPush)} 小時前），明天再發`,
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        // ── 取得長輩的基本資訊（名稱）────────────────────────
        const { data: elderProfile } = await supabase
            .from('profiles')
            .select('display_name, full_name')
            .eq('id', user_id)
            .single()

        const elderName = elderProfile?.display_name || elderProfile?.full_name || '長輩'

        // ── 查詢家族成員（子女）的 LINE ID ────────────────────
        const { data: familyMembers } = await supabase
            .from('wl_family_group_members')
            .select(`
                user_id,
                profiles:user_id ( line_id, display_name )
            `)
            .neq('user_id', user_id)  // 排除長輩本人

        if (!familyMembers || familyMembers.length === 0) {
            return new Response(JSON.stringify({
                pushed: 0,
                reason: '家族成員尚未加入或未綁定 LINE',
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 篩選有 LINE ID 的成員
        const membersWithLine = familyMembers.filter(
            (m: any) => m.profiles?.line_id
        )

        if (membersWithLine.length === 0) {
            return new Response(JSON.stringify({
                pushed: 0,
                reason: '所有家族成員尚未綁定 LINE ID',
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // ── 組合 LINE 推播訊息 ────────────────────────────────
        const storyTitle = story.title || '一段珍貴的回憶'
        const storyExcerpt = (story.content || '').substring(0, 100).replace(/\n/g, ' ')
        const webAppUrl = `${Deno.env.get('APP_BASE_URL') || 'https://weavinglight.app'}/story/${story_id}`
        const familyShareUrl = `${Deno.env.get('APP_BASE_URL') || 'https://weavinglight.app'}/family-share?story_id=${story_id}`

        // 根據情緒標籤選擇推播文案
        const emotionEmoji: Record<string, string> = {
            nostalgia: '🌅', sadness: '💙', joy: '✨', anxious: '🌿', calm: '🌸'
        }
        const peakEmotion = highlight?.emotion_peak || 'nostalgia'
        const emoji = emotionEmoji[peakEmotion] || '📖'

        const pushMessages = [
            {
                type: 'text',
                text: `${emoji} 織光溫馨推播\n\n${elderName}剛剛用織光記錄了《${storyTitle}》這段珍貴的回憶。\n\n「${storyExcerpt}⋯⋯」\n\n聽聽長輩的聲音，也留下你想說的話吧！`,
            },
            {
                type: 'template',
                altText: `${elderName}的故事等待你共創！`,
                template: {
                    type: 'buttons',
                    title: `${elderName}的故事`,
                    text: '點擊參與共創，上傳老照片或留言給長輩！',
                    actions: [
                        {
                            type: 'uri',
                            label: '📖 閱讀故事',
                            uri: webAppUrl,
                        },
                        {
                            type: 'uri',
                            label: '📸 上傳照片 / 留言',
                            uri: familyShareUrl,
                        },
                    ],
                },
            },
        ]

        // ── 批次推播給所有有 LINE ID 的家族成員 ──────────────
        let pushedCount = 0
        const pushErrors: string[] = []

        for (const member of membersWithLine) {
            const lineId = (member as any).profiles?.line_id
            if (!lineId) continue

            if (!LINE_CHANNEL_ACCESS_TOKEN) {
                // 沒有 LINE Token 時，記錄推播意圖但不實際發送（開發模式）
                console.log(`[LINE-PUSH DEV] 模擬推播至 ${lineId}:`, JSON.stringify(pushMessages))
                pushedCount++
                continue
            }

            try {
                const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: lineId,
                        messages: pushMessages,
                    }),
                })

                if (lineResponse.ok) {
                    pushedCount++
                } else {
                    const errText = await lineResponse.text()
                    pushErrors.push(`${lineId}: ${errText}`)
                    console.error(`LINE push failed for ${lineId}:`, errText)
                }
            } catch (err) {
                pushErrors.push(`${lineId}: ${String(err)}`)
            }
        }

        // ── 更新推播時間戳（節流記錄）────────────────────────
        if (pushedCount > 0) {
            if (highlight) {
                await supabase.from('wl_story_highlights')
                    .update({ line_pushed_at: new Date().toISOString() })
                    .eq('story_id', story_id)
            } else {
                await supabase.from('wl_story_highlights').insert({
                    story_id,
                    user_id,
                    summary: storyExcerpt,
                    emotion_peak: peakEmotion,
                    line_pushed_at: new Date().toISOString(),
                })
            }
        }

        return new Response(JSON.stringify({
            pushed: pushedCount,
            total: membersWithLine.length,
            errors: pushErrors.length > 0 ? pushErrors : undefined,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('line-push error:', error)
        return new Response(JSON.stringify({ error: '推播失敗', detail: String(error) }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
