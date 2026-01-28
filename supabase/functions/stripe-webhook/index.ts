import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
  })
  
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  let event;
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret || '')
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // 1. 處理支付完成事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { userId, tokens, plan } = session.metadata

    console.log(`✅ Payment received! User: ${userId}, Tokens: ${tokens}, Plan: ${plan}`)

    // 2. 初始化 Supabase (使用 Service Role 以繞過 RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. 寫入交易帳本 (Ledger)
    // 這會觸發資料庫 trigger: on_transaction_inserted -> handle_balance_update()
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: parseInt(tokens),
        type: 'top-up',
        reference_id: session.id, // 記錄 Stripe Session ID 供對帳
      })

    if (error) {
      console.error('❌ Failed to update transaction ledger:', error)
      return new Response('Internal Server Error', { status: 500 })
    }
    
    console.log('💰 Ledger updated successfully.')
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
