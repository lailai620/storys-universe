import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice = 'nova', mock = false } = await req.json()

    // --- 測試模式 (Mock Mode) ---
    // 在 Mock 模式下，我們回傳一個現有的音訊連結或錯誤提示（因為音訊難以 Mock 純純的二進制）
    // 這裡為了讓 UI 能跑起來，回傳一個預設的語音 URL，或者直接噴錯引導使用者填 Key
    if (mock) {
      console.log("🚧 [Edge Function] Mock Mode: generate-speech");
      // 由於回傳 Raw Audio 比較複雜，Mock 模式下回傳一個固定的通知 MP3 網址
      return new Response(JSON.stringify({ 
        url: "https://www.soundjay.com/buttons/beep-01a.mp3",
        message: "這是 Mock 語音，正式版請設定 OPENAI_API_KEY" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 正式模式 (OpenAI TTS) ---
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY in environment')
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        response_format: "mp3",
        speed: 1.0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Speech generation failed');
    }

    // 取得二進制音訊資料
    const audioBlob = await response.blob();

    return new Response(audioBlob, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg' 
      },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
