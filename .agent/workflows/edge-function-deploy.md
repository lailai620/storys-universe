---
description: 建立並部署 Supabase Edge Functions 以保護 API Keys
---

# Edge Functions 部署流程

此工作流程指導如何將敏感 API 呼叫從前端遷移至 Supabase Edge Functions。

## 前置需求
- 已安裝 Supabase CLI
- 已登入 Supabase (`supabase login`)

## 執行步驟

### 1. 初始化 Supabase (如尚未初始化)
```bash
supabase init
```

### 2. 建立新的 Edge Function
```bash
supabase functions new <function-name>
```
例如：`supabase functions new generate-story`

### 3. 實作 Function 邏輯
編輯 `supabase/functions/<function-name>/index.ts`：

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    
    // 在這裡使用 Deno.env.get() 取得安全的 API Key
    const API_KEY = Deno.env.get('GROQ_API_KEY')
    
    // 呼叫外部 API...
    const response = await fetch('https://api.groq.com/...', {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    })
    
    const data = await response.json()
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

### 4. 設定環境變數
在 Supabase Dashboard > Settings > Edge Functions > Secrets 中設定：
- `GROQ_API_KEY`
- `REPLICATE_API_KEY`

### 5. 本地測試
// turbo
```bash
supabase functions serve <function-name> --env-file .env.local
```

### 6. 部署至正式環境
```bash
supabase functions deploy <function-name>
```

### 7. 更新前端呼叫
將 `aiService.js` 中的直接 API 呼叫改為：

```javascript
const { data } = await supabase.functions.invoke('generate-story', {
  body: { prompt: userPrompt }
})
```

---

## 驗證清單
- [ ] Function 已成功部署
- [ ] 前端不再包含敏感 API Key
- [ ] 呼叫 Edge Function 時有正確驗證用戶身份
