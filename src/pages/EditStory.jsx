import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useStory } from '../context/StoryContext';
import { Save, ArrowLeft, Lock, Globe, Calendar, Type, Layout } from 'lucide-react';

const EditStory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateStory } = useStory();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [story, setStory] = useState({ title: '', content: [], visibility: 'private', memory_date: '' });

  useEffect(() => {
    const fetchStory = async () => {
      const { data, error } = await supabase.from('stories').select('*').eq('id', id).single();
      if (error) { alert('讀取失敗'); navigate('/profile'); }
      else {
          setStory({
              ...data,
              // 確保 content 是陣列
              content: Array.isArray(data.content) ? data.content : [],
              // 格式化日期給 input 使用 (YYYY-MM-DD)
              memory_date: data.memory_date ? data.memory_date.split('T')[0] : new Date().toISOString().split('T')[0]
          });
      }
      setLoading(false);
    };
    fetchStory();
  }, [id, navigate]);

  const handleSave = async () => {
      setSaving(true);
      const updates = {
          title: story.title,
          content: story.content,
          visibility: story.visibility,
          is_public: story.visibility === 'public', // 兼容舊邏輯
          memory_date: story.memory_date
      };
      
      const success = await updateStory(id, updates);
      if (success) {
          alert('✨ 更新成功！');
          navigate('/profile');
      }
      setSaving(false);
  };

  const handleContentChange = (index, newText) => {
      const newContent = [...story.content];
      newContent[index].text = newText;
      setStory({ ...story, content: newContent });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-gray-500">載入編輯器...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 頂部導航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-100 rounded-full text-gray-600"><ArrowLeft size={20}/></button>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Layout className="w-5 h-5 text-indigo-600"/> 編輯回憶</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 rounded-full font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg disabled:opacity-50">
            <Save size={18}/> {saving ? '儲存中...' : '儲存修改'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto mt-8 px-4 space-y-6">
          
          {/* 1. 基本設定區 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><Type size={18}/> 基本資訊</h2>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm text-gray-500 mb-1">標題</label>
                      <input type="text" value={story.title} onChange={(e) => setStory({...story, title: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-bold text-gray-800"/>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm text-gray-500 mb-1">隱私權限</label>
                          <div className="flex bg-gray-100 p-1 rounded-lg">
                              <button onClick={() => setStory({...story, visibility: 'private'})} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-1 transition-all ${story.visibility === 'private' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
                                  <Lock size={14}/> 私人
                              </button>
                              <button onClick={() => setStory({...story, visibility: 'public'})} className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-1 transition-all ${story.visibility === 'public' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>
                                  <Globe size={14}/> 公開
                              </button>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm text-gray-500 mb-1">回憶日期</label>
                          <div className="relative">
                              <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                              <input type="date" value={story.memory_date} onChange={(e) => setStory({...story, memory_date: e.target.value})} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700 font-medium"/>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* 2. 內容編輯區 */}
          <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-700 ml-1">📖 內容修訂</h2>
              {story.content.map((page, index) => (
                  <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                      {/* 圖片預覽 (目前僅供預覽，不支援修改圖片) */}
                      <div className="w-full md:w-1/3 bg-gray-100 rounded-lg overflow-hidden h-48 md:h-auto">
                          <img src={page.image} className="w-full h-full object-cover" alt={`Page ${index+1}`} />
                      </div>
                      
                      {/* 文字編輯 */}
                      <div className="flex-1 flex flex-col">
                          <label className="text-xs font-bold text-gray-400 mb-2">第 {index + 1} 頁文字</label>
                          <textarea 
                              value={page.text} 
                              onChange={(e) => handleContentChange(index, e.target.value)}
                              className="flex-1 w-full p-3 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 resize-none text-gray-700 leading-relaxed h-40"
                          />
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default EditStory;