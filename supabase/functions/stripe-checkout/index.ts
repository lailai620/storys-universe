import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan, userId, email } = await req.json()
    
    // 1. 取得 Stripe Key
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // 2. 定義方案與金額 (台幣 NTD)
    const plans = {
      'beginner': { name: '新手體驗包 (50 星塵)', amount: 30, tokens: 50 },
      'creator': { name: '創作者計畫 (200 星塵)', amount: 100, tokens: 200 },
      'universe': { name: '宇宙通行證 (1000 星塵)', amount: 450, tokens: 1000 }
    }

    const selectedPlan = plans[plan] || plans['beginner']

    // 3. 建立 Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'twd',
            product_data: {
              name: selectedPlan.name,
              description: `購買 ${selectedPlan.tokens} 個星塵點數，可用於 AI 創作。`,
            },
            unit_amount: selectedPlan.amount * 100, // Stripe 使用最小單位 (分)
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      success_url: `${req.headers.get('origin')}/profile?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/profile?status=cancel`,
      metadata: {
        userId: userId,
        plan: plan,
        tokens: selectedPlan.tokens.toString()
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
