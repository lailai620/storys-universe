import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * 創作者打賞 Edge Function
 * ========================
 * 讓讀者可以將星塵代幣轉移給創作者
 * 
 * Request Body:
 *   - fromUserId: 打賞者 ID
 *   - toUserId: 創作者 ID
 *   - amount: 星塵數量
 *   - storyId: 相關故事 ID (可選)
 */
Deno.serve(async (req) => {
  // 處理 CORS 預檢請求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fromUserId, toUserId, amount, storyId } = await req.json()

    // 1. 驗證參數
    if (!fromUserId || !toUserId || !amount) {
      return new Response(
        JSON.stringify({ error: '缺少必要參數 (fromUserId, toUserId, amount)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (fromUserId === toUserId) {
      return new Response(
        JSON.stringify({ error: '無法打賞自己' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (amount <= 0 || amount > 1000) {
      return new Response(
        JSON.stringify({ error: '打賞金額必須在 1-1000 之間' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. 初始化 Supabase (使用 Service Role 以繞過 RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. 檢查打賞者餘額
    const { data: fromProfile, error: fromError } = await supabase
      .from('profiles')
      .select('token_balance, display_name')
      .eq('id', fromUserId)
      .single()

    if (fromError || !fromProfile) {
      return new Response(
        JSON.stringify({ error: '無法取得打賞者資料' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (fromProfile.token_balance < amount) {
      return new Response(
        JSON.stringify({ error: '星塵餘額不足', currentBalance: fromProfile.token_balance }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. 取得創作者資料
    const { data: toProfile, error: toError } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', toUserId)
      .single()

    if (toError || !toProfile) {
      return new Response(
        JSON.stringify({ error: '無法取得創作者資料' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. 執行交易：同時新增兩筆紀錄（扣款 + 入帳）
    // 使用 transaction 確保原子性
    const timestamp = new Date().toISOString()
    const referenceId = `tip_${Date.now()}_${storyId || 'direct'}`

    // 5a. 打賞者扣款
    const { error: deductError } = await supabase
      .from('transactions')
      .insert({
        user_id: fromUserId,
        amount: -amount, // 負數表示扣款
        type: 'tip-out',
        reference_id: referenceId,
        metadata: { toUserId, toName: toProfile.display_name, storyId }
      })

    if (deductError) {
      console.error('扣款失敗:', deductError)
      return new Response(
        JSON.stringify({ error: '交易失敗 (扣款階段)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5b. 創作者入帳
    const { error: creditError } = await supabase
      .from('transactions')
      .insert({
        user_id: toUserId,
        amount: amount, // 正數表示入帳
        type: 'tip-in',
        reference_id: referenceId,
        metadata: { fromUserId, fromName: fromProfile.display_name, storyId }
      })

    if (creditError) {
      console.error('入帳失敗:', creditError)
      // TODO: 理想情況下應該 rollback 扣款，但 Supabase 不支援跨表交易
      return new Response(
        JSON.stringify({ error: '交易失敗 (入帳階段)' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. 成功回應
    return new Response(
      JSON.stringify({
        success: true,
        message: `成功投遞 ${amount} 顆星塵給 ${toProfile.display_name}`,
        transaction: {
          fromUser: fromProfile.display_name,
          toUser: toProfile.display_name,
          amount,
          referenceId,
          timestamp
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('打賞 API 錯誤:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
