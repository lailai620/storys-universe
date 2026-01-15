import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { 
  ShieldAlert, Trash2, Database, BarChart3, Users, BookOpen, 
  Search, ExternalLink, Sparkles 
} from 'lucide-react';

const Admin = () => {
  const navigate = useNavigate();
  // 🌟 這裡會使用到 StoryContext 提供的功能
  const { user, isAdmin, allStories, deleteStory, publishToCloud } = useStory();
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 安全檢查：如果不是管理員，踢回首頁
  if (!user || !isAdmin) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center text-white">
              <ShieldAlert size={64} className="text-red-500 mb-4"/>
              <h1 className="text-2xl font-bold mb-2">權限不足</h1>
              <p className="text-gray-400 mb-6">此區域僅限系統管理員進入</p>
              <button onClick={() => navigate('/')} className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20">回首頁</button>
          </div>
      );
  }

  // 數據統計
  const totalStories = allStories.length;
  const totalViews = allStories.reduce((acc, s) => acc + (s.views || 0), 0);
  const totalLikes = allStories.reduce((acc, s) => acc + (s.likes || 0), 0);
  const kidsStories = allStories.filter(s => s.isKids).length;

  // 篩選列表
  const displayStories = allStories.filter(s => 
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id, title) => {
      if(await deleteStory(id)) {
          alert(`已刪除作品：${title}`);
      }
  };

  // 魔法匯入功能
  const importClassics = async () => {
    if (!window.confirm("確定要匯入 4 則經典童話到兒童專區嗎？")) return;
    setIsProcessing(true);

    const classics = [
        {
            title: "龜兔賽跑",
            category: "伊索寓言",
            prompt: "The Tortoise and the Hare race, cute cartoon style, forest background",
            content: "有一天，兔子嘲笑烏龜爬得慢。烏龜說：「那我們來比賽跑步吧！」兔子笑著答應了。\n\n比賽開始，兔子跑得飛快，回頭一看，烏龜還在起跑線附近慢慢爬。兔子心想：「我睡個午覺再跑也不遲。」於是就在樹下睡著了。\n\n烏龜雖然慢，但他一步一步不停地爬，最後爬過了睡覺的兔子，第一個到達了終點。當兔子醒來時，發現自己已經輸了。"
        },
        {
            title: "醜小鴨",
            category: "童話故事",
            prompt: "The Ugly Duckling, cute baby swan looking at reflection in water, pond, reeds, watercolor",
            content: "鴨媽媽孵出了一群小鴨，其中有一隻特別大、特別醜，大家都叫他「醜小鴨」。哥哥姐姐欺負他，其他動物也嘲笑他。\n\n醜小鴨傷心地離開了家，在外面流浪，度過了寒冷的冬天。春天來了，他來到湖邊，看見幾隻美麗的天鵝。他自卑地低下頭，卻在水中看見了自己的倒影——原來，他不是醜小鴨，而是一隻美麗的白天鵝！"
        },
        {
            title: "狼來了",
            category: "伊索寓言",
            prompt: "Shepherd boy shouting wolf, sheep grazing on hill, cute cartoon style, vector art",
            content: "有個牧羊童覺得無聊，就對著村民大喊：「狼來了！狼來了！」村民們拿著棍棒跑上山，卻發現根本沒有狼，牧羊童哈哈大笑。\n\n過了幾天，他又騙了一次村民。後來有一天，狼真的來了！牧羊童大聲呼救：「救命啊！狼真的來了！」但這次，村民們以為他又在說謊，沒有人理他。最後，羊都被狼吃掉了。"
        },
        {
            title: "北風與太陽",
            category: "伊索寓言",
            prompt: "The North Wind and the Sun, cartoon style, sky background, man walking",
            content: "北風和太陽比賽，看誰能讓路人脫掉外套。北風使勁地吹，想要把外套吹掉，結果路人覺得冷，反而把外套裹得更緊了。\n\n輪到太陽了，他溫暖地照耀著大地。路人覺得暖洋洋的，開始流汗，最後自己主動脫掉了外套。太陽贏了，這故事告訴我們：溫暖的勸說比強迫更有用。"
        }
    ];

    for (const story of classics) {
        const encodedPrompt = encodeURIComponent(story.prompt);
        const seed = Math.floor(Math.random() * 99999);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&seed=${seed}&nologo=true&model=flux`;
        
        await publishToCloud({
            title: story.title,
            content: [{ text: story.content, image: imageUrl }], 
            coverImage: imageUrl,
            category: story.category,
            isKids: true,
            type: 'picturebook'
        });
        await new Promise(r => setTimeout(r, 1000));
    }

    setIsProcessing(false);
    alert("✨ 匯入完成！");
  };

  return (
    <div className="max-w-7xl mx-auto p-8 pb-32 text-white animate-fade">
        {/* Header */}
        <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6">
            <div>
                <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
                    <ShieldAlert className="text-red-500"/> 系統管理中心
                </h1>
                <p className="text-gray-400">Welcome back, Administrator.</p>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={importClassics} 
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-xl font-bold hover:scale-105 transition disabled:opacity-50"
                >
                    {isProcessing ? "處理中..." : <><Database size={18}/> 一鍵匯入經典童話</>}
                </button>
            </div>
        </div>

        {/* 1. 數據儀表板 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-400 mb-2 font-bold text-sm"><BookOpen size={16}/> 總故事數</div>
                <div className="text-4xl font-black text-white">{totalStories}</div>
            </div>
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-400 mb-2 font-bold text-sm"><BarChart3 size={16}/> 總瀏覽量</div>
                <div className="text-4xl font-black text-blue-400">{totalViews}</div>
            </div>
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-400 mb-2 font-bold text-sm"><Sparkles size={16}/> 兒童專區作品</div>
                <div className="text-4xl font-black text-orange-400">{kidsStories}</div>
            </div>
            <div className="bg-[#111] border border-white/10 p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-gray-400 mb-2 font-bold text-sm"><Users size={16}/> 總互動數 (Likes)</div>
                <div className="text-4xl font-black text-red-400">{totalLikes}</div>
            </div>
        </div>

        {/* 2. 內容管理列表 */}
        <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><BookOpen className="text-gray-400"/> 內容審查列表</h3>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                    <input 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜尋標題或作者..." 
                        className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:border-red-500 outline-none"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gray-400 font-bold uppercase">
                        <tr>
                            <th className="p-4">封面</th>
                            <th className="p-4">標題</th>
                            <th className="p-4">作者</th>
                            <th className="p-4">分類</th>
                            <th className="p-4">數據</th>
                            <th className="p-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {displayStories.map(story => (
                            <tr key={story.id} className="hover:bg-white/5 transition group">
                                <td className="p-4">
                                    <img src={story.image || story.coverImage} className="w-12 h-12 rounded object-cover bg-gray-800"/>
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-white text-base mb-1">{story.title}</div>
                                    <div className="text-gray-500 text-xs">{new Date(story.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4 text-gray-300">{story.author}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${story.isKids ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                        {story.category}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-400">
                                    {story.views || 0} views
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button onClick={() => navigate(`/story/${story.id}`)} className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white" title="查看">
                                            <ExternalLink size={16}/>
                                        </button>
                                        <button onClick={() => handleDelete(story.id, story.title)} className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white" title="刪除">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default Admin;