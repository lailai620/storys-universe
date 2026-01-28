import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, mock = false, userId, storyId, type = 'page' } = await req.json()

    // --- 測試模式 (Mock Mode) ---
    if (mock) {
      console.log("🚧 [Edge Function] Mock Mode: generate-image");
      const seed = Math.floor(Math.random() * 1000);
      const mockUrl = `https://picsum.photos/seed/${seed}/800/600`;
      return new Response(JSON.stringify({ url: mockUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 正式模式 (Replicate API) ---
    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')
    if (!REPLICATE_API_KEY) {
      throw new Error('Missing REPLICATE_API_KEY');
    }

    // 1. 建立預測 (Create Prediction)
    const createRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "black-forest-labs/flux-schnell", 
        input: { prompt }
      })
    });

    let prediction = await createRes.json();
    if (prediction.error) throw new Error(prediction.error);

    const pollUrl = prediction.urls.get;

    // 2. 輪詢結果 (Polling)
    let attempts = 0;
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && attempts < 30) {
      attempts++;
      await new Promise(r => setTimeout(r, 1000)); 
      
      const checkRes = await fetch(pollUrl, {
        headers: { "Authorization": `Token ${REPLICATE_API_KEY}` }
      });
      prediction = await checkRes.json();
    }

    if (prediction.status !== "succeeded") {
      throw new Error(`Image generation failed or timed out: ${prediction.status}`);
    }

    const aiImageUrl = prediction.output[0];

    // 3. 轉存至 Supabase Storage (如果提供 userId)
    if (userId) {
      console.log(`💾 Persisting image to storage for user: ${userId}`);
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // 下載圖片
      const imageRes = await fetch(aiImageUrl);
      const arrayBuffer = await imageRes.arrayBuffer();

      // 設定檔名
      const timestamp = Date.now();
      const fileName = `${userId}/${storyId || 'temp'}/${type}_${timestamp}.webp`;

      // 上傳
      const { data, error: uploadError } = await supabase.storage
        .from('stories')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/webp',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // 如果上傳失敗，為了不中斷流程，回傳原始 AI URL
        return new Response(JSON.stringify({ url: aiImageUrl, warning: 'Storage upload failed' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 取得公開連結
      const { data: { publicUrl } } = supabase.storage
        .from('stories')
        .getPublicUrl(fileName);

      return new Response(JSON.stringify({ url: publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 沒有提供 userId，直接回傳 AI URL
    return new Response(JSON.stringify({ url: aiImageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
