import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStory } from '../context/StoryContext';
import { User, Clock, Plus, BookOpen, Calendar, Gift } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, stories, fetchStories, loading } = useStory();

  // 進入頁面時，確保資料是最新的
  useEffect(() => {
    if (user) {
      fetchStories();
    }
  }, [user, fetchStories]);

  // 簡單的年齡計算輔助函式
  const getAgeAtMemory = (memoryDateStr) => {
    // 假設用戶生日是 1990-01-01 (未來可從 profile.birth_date 讀取)
    const birthDate = new Date(profile?.birth_date || '1990-01-01');
    const memoryDate = new Date(memoryDateStr);
    
    if (isNaN(memoryDate.getTime())) return null;

    let age = memoryDate.getFullYear() - birthDate.getFullYear();
    const m = memoryDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && memoryDate.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 0) return '出生前';
    return `${age} 歲`;
  };

  // 將故事按「回憶日期」排序 (越舊的越下面，或依您喜好調整)
  const sortedStories = [...stories].sort((a, b) => {
    return new Date(b.memory_date || b.created_at) - new Date(a.memory_date || a.created_at);
  });

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">正在整理您的收藏...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24 px-4 md:px-8 font-sans">
      
      <div className="max-w-5xl mx-auto">
        {/* Header: 個人資訊 */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
             {/* 若無頭像則顯示預設圖標 */}
             {profile?.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                 <User size={40} />
               </div>
             )}
          </div>
          
          <div className="text-center md:text-left space-y-2 flex-1">
            <h1 className="text-3xl font-serif font-bold text-slate-800">
              {profile?.username || user?.email?.split('@')[0] || "時光旅人"} 的收藏館
            </h1>
            <p className="text-slate-500 text-sm flex items-center justify-center md:justify-start gap-4">
              <span className="flex items-center gap-1"><Clock size={14}/> 加入於 {new Date(user?.created_at).getFullYear()}</span>
              <span className="flex items-center gap-1"><Gift size={14}/> 餘額: {profile?.seed_balance || 0} SEED</span>
            </p>
          </div>

          <button 
            onClick={() => navigate('/create')}
            className="group px-6 py-3 bg-slate-900 text-white rounded-full font-medium shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            <span>新增回憶</span>
          </button>
        </div>

        {/* Timeline Content */}
        {sortedStories.length === 0 ? (
          // 空狀態：溫柔引導
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-500">
            <div className="w-40 h-40 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <BookOpen size={48} className="text-indigo-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">書架還是空的</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-8">
              這不是一件壞事，這代表所有美好的故事，<br/>正等待著您去寫下。
            </p>
            <button 
              onClick={() => navigate('/')}
              className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-4"
            >
              回到起點，開始對話
            </button>
          </div>
        ) : (
          // 故事列表：瀑布流或網格
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedStories.map((story, index) => {
              const ageLabel = getAgeAtMemory(story.memory_date);
              
              return (
                <div 
                  key={story.id}
                  onClick={() => navigate(`/story/${story.id}`)}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100 transition-all duration-500 cursor-pointer flex flex-col h-full animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* 卡片封面區域 */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <img 
                      src={story.cover_image} 
                      alt={story.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                      <span className="text-white text-sm font-medium flex items-center gap-2">
                        <BookOpen size={16} /> 點擊閱讀
                      </span>
                    </div>
                    
                    {/* 年齡標籤 (如果有) */}
                    {ageLabel && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <User size={12} /> {ageLabel}
                      </div>
                    )}
                  </div>

                  {/* 卡片內容區域 */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 uppercase tracking-wider font-bold">
                       <span>{story.category || 'MEMOIR'}</span>
                       <span>•</span>
                       <span className="flex items-center gap-1">
                         <Calendar size={12} />
                         {story.memory_date ? new Date(story.memory_date).toLocaleDateString() : new Date(story.created_at).toLocaleDateString()}
                       </span>
                    </div>
                    
                    <h3 className="text-xl font-serif font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {story.title}
                    </h3>
                    
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                      {/* 取第一段內容作為預覽 */}
                      {Array.isArray(story.content) ? story.content[0]?.text : "..."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;