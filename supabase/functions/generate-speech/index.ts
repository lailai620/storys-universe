import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore: Deno is available in edge runtime
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice = 'nova', mock = false } = await req.json()

    // --- 測試模式 (Mock Mode) ---
    if (mock) {
      console.log("🚧 [Edge Function] Mock Mode: generate-speech");
      return new Response(JSON.stringify({ 
        url: "https://www.soundjay.com/buttons/beep-01a.mp3",
        message: "這是 Mock 語音，正式版請設定 OPENAI_API_KEY" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 正式模式 (OpenAI TTS) ---
    // @ts-ignore: Deno is available in edge runtime
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
        voice: voice,
        response_format: "mp3",
        speed: 1.0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Speech generation failed');
    }

    const audioBlob = await response.blob();

    return new Response(audioBlob, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'audio/mpeg' 
      },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
