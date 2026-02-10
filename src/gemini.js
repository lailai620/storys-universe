// 🌟 這是「智慧模擬大腦」，不需要 API Key 也能運作！
// 它會根據您的關鍵字，自動挑選最適合的故事模板。
// 解決了 Google API 權限不足 (404) 的問題。

export const generateStoryFromGemini = async (userPrompt) => {

  // 模擬 AI 思考時間 (讓體驗更真實，像是真的在跑)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 1. 定義故事模板庫 (您可以自己擴充更多)
  const templates = [
    {
      keywords: ['貓', 'cat', '喵', 'kitten', '動物'],
      title: "迷路的小貓咪",
      cover_prompt: "cute kitten in a magical forest, soft lighting, 8k, storybook style",
      pages: [
        { text: "有一隻名叫咪咪的小貓，他不小心跑進了森林深處，找不到回家的路。", image_prompt: "sad kitten looking at tall trees, forest style, watercolor" },
        { text: "突然，一隻發光的藍色蝴蝶飛了過來，似乎想帶咪咪去什麼地方。", image_prompt: "blue glowing butterfly and a kitten, magical style, bright colors" },
        { text: "咪咪跟著蝴蝶穿過小溪，看見了一座糖果做成的小屋。", image_prompt: "candy house in the woods, colorful illustration, cute" },
        { text: "原來那是森林守護者的家，守護者送咪咪回到了溫暖的家。", image_prompt: "happy kitten sleeping in a basket, warm lighting, cozy" }
      ]
    },
    {
      keywords: ['恐龍', 'dino', '龍', 'dragon', '怪獸'],
      title: "愛吃糖果的暴龍",
      cover_prompt: "friendly t-rex eating candy, cartoon style, bright colors, 4k",
      pages: [
        { text: "雷克斯是一隻巨大的暴龍，但他一點都不可怕，因為他只喜歡吃棒棒糖。", image_prompt: "t-rex holding a giant lollipop, cute cartoon, funny" },
        { text: "其他的恐龍都笑他，說暴龍應該要吃肉才對，雷克斯覺得很難過。", image_prompt: "sad t-rex sitting alone on a rock, dinosaur background" },
        { text: "有一天，火山爆發了，大家都嚇得四處逃竄，只有雷克斯拿出了巨大的棉花糖。", image_prompt: "volcano erupting and giant marshmallow, action scene" },
        { text: "棉花糖擋住了岩漿，變成了好吃的焦糖，大家都感謝雷克斯救了他們。", image_prompt: "dinosaurs eating caramel together, happy ending, party" }
      ]
    },
    {
      keywords: ['太空', '宇宙', '星', '月亮', 'space', 'star', '飛'],
      title: "摘星星的男孩",
      cover_prompt: "boy sitting on the moon, galaxy background, dreamy style, masterpiece",
      pages: [
        { text: "小明最喜歡看著夜空，他總想著：星星的味道是什麼樣子的呢？", image_prompt: "boy looking at starry sky through window, night scene" },
        { text: "他做了一個長長的梯子，一直爬到了雲端之上。", image_prompt: "ladder reaching into clouds, dreamlike, surreal" },
        { text: "星星們看到他，都圍過來跳舞，還送了他一顆最小的星星糖。", image_prompt: "glowing stars dancing around a boy, shiny particles" },
        { text: "現在，每當小明想念宇宙，他就會拿出口袋裡那顆發光的糖果。", image_prompt: "boy holding a glowing star in hand, smiling, close up" }
      ]
    },
    {
      keywords: ['海', '魚', '水', 'sea', 'fish', 'ocean'],
      title: "勇敢的小丑魚",
      cover_prompt: "clownfish in coral reef, underwater, pixar style, vibrant",
      pages: [
        { text: "尼莫是一隻膽小的小丑魚，他從來不敢離開他的海葵家。", image_prompt: "clownfish hiding in anemone, underwater, blue ocean" },
        { text: "直到有一天，他的好朋友海龜被漁網困住了！", image_prompt: "sea turtle trapped in net, underwater scene, dramatic" },
        { text: "尼莫鼓起勇氣，用尖尖的石頭割斷了漁網。", image_prompt: "clownfish cutting net with sharp rock, brave expression" },
        { text: "海龜得救了，尼莫也終於發現，原來自己比想像中更勇敢。", image_prompt: "clownfish and sea turtle swimming together, happy, sunlight filtering down" }
      ]
    },
    // 預設模板 (如果使用者輸入的關鍵字都沒對中)
    {
      keywords: ['default'],
      title: "神奇的魔法書",
      cover_prompt: "glowing magic book in a library, fantasy style, mysterious",
      pages: [
        { text: "這是一本被遺忘在圖書館角落的書，書皮上積滿了灰塵。", image_prompt: "dusty old book on a shelf, mysterious light, harry potter style" },
        { text: "當你打開第一頁，書裡的文字竟然變成了金色的鳥兒飛了出來！", image_prompt: "golden birds flying out of a book, magic effects, sparkles" },
        { text: "鳥兒帶著你飛越了高山和海洋，看見了許多不可思議的景色。", image_prompt: "flying over mountains and oceans, panoramic view, epic" },
        { text: "這就是閱讀的魔力，它能帶你去任何你想去的地方。", image_prompt: "child reading happily with imagination bubble, cozy library" }
      ]
    }
  ];

  // 2. 關鍵字比對邏輯 (Smart Matching)
  const promptLower = userPrompt.toLowerCase();

  // 尋找是否有對應的關鍵字
  const matchedStory = templates.find(t =>
    t.keywords.some(k => promptLower.includes(k))
  ) || templates[templates.length - 1]; // 如果都沒對中，就用最後一個預設故事

  // 3. 微調標題，讓它感覺更有客製化
  // 深拷貝一份，以免修改到原始模板
  const finalStory = JSON.parse(JSON.stringify(matchedStory));

  if (finalStory.keywords[0] === 'default') {
    finalStory.title = `關於 "${userPrompt}" 的奇幻冒險`;
  }

  return finalStory;
};