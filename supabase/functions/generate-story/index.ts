import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt, mock = false } = await req.json()
    
    // --- 測試模式 (Mock Mode) ---
    if (mock) {
      console.log("🚧 [Edge Function] Mock Mode: generate-story");
      const mockResult = {
        title: "✨ 測試版：勇敢的小熊 (Edge)",
        cover_prompt: "cute teddy bear in forest, ghibli style",
        pages: [
          { text: "這是一個經由 Edge Function 回傳的測試故事。", image_prompt: "bear 1" },
          { text: "您的架構已經成功遷移至後端服務。", image_prompt: "bear 2" },
          { text: "這保護了您的 API Key 不被前端看到。", image_prompt: "bear 3" }
        ]
      }
      return new Response(JSON.stringify(mockResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // --- 正式模式 (Groq API) ---
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    if (!GROQ_API_KEY || GROQ_API_KEY === '您的_GROQ_API_KEY') {
      return new Response(JSON.stringify({ error: 'Missing GROQ_API_KEY in environment' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: `你是一個專業的繪本與小說家。請輸出純 JSON 格式，不要有任何多餘文字。
            格式如下：
            {
              "title": "故事標題",
              "cover_prompt": "英文的封面生成指令(適合Flux模型)",
              "pages": [
                 { "text": "第1頁故事內容(中文)", "image_prompt": "第1頁插圖指令(英文)" },
                 { "text": "第2頁故事內容...", "image_prompt": "..." },
                 { "text": "第3頁故事內容...", "image_prompt": "..." },
                 { "text": "第4頁故事內容...", "image_prompt": "..." }
              ]
            }`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (data.error) {
       throw new Error(data.error.message || 'Groq API Error');
    }

    const content = data.choices[0].message.content;
    // 有時候 AI 可能會回傳包含 ```json ... ``` 的字串，我們需要清理它
    const cleanContent = content.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanContent);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
