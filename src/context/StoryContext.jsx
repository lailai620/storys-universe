import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StoryContext = createContext();

export const useStory = () => useContext(StoryContext);

export const StoryProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(120);
  const [appMode, setAppMode] = useState('standard'); // 'standard' | 'kids' | 'senior'
  const [userStories, setUserStories] = useState([]);
  const [allStories, setAllStories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transactions, setTransactions] = useState([]);

  // 初始化檢查使用者 Session
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Session check failed", error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // 監聽登入狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsAdmin(session.user.email?.includes('admin')); // 簡易管理員判斷
        fetchUserStories(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 📝 抓取個人故事
  const fetchUserStories = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', userId || user?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUserStories(data || []);
    } catch (e) {
      console.error("抓取個人故事失敗", e);
    }
  };

  // 📝 抓取所有故事 (管理員用)
  const fetchAllStories = async () => {
    try {
      const { data, error } = await supabase.from('stories').select('*');
      if (error) throw error;
      setAllStories(data || []);
    } catch (e) {
      console.error("抓取全域故事失敗", e);
    }
  };

  const deleteStory = async (id) => {
    try {
      const { error } = await supabase.from('stories').delete().eq('id', id);
      if (error) throw error;
      setUserStories(prev => prev.filter(s => s.id !== id));
      setAllStories(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (e) {
      console.error("刪除失敗", e);
      return false;
    }
  };

  // 🔐 Auth: 註冊
  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // 🔐 Auth: 登入
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  // 🔐 Auth: 登出
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  // 📝 核心功能：創建故事 (擴充 memory_date)
  const createStory = async (storyData) => {
    try {
      const payload = {
        title: storyData.title,
        content: storyData.content,
        cover_image: storyData.cover_image,
        category: storyData.category || 'novel',
        style: storyData.style || 'scifi',
        visibility: storyData.visibility || 'public',
        memory_date: storyData.memory_date || new Date().toISOString(),
        author_id: user?.id,
        author_name: user?.email?.split('@')[0] || "匿名旅人",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('stories')
        .insert([payload])
        .select();

      if (error) throw error;
      setBalance(prev => prev - 10);
      fetchUserStories(); // 重新整理列表
      return data[0];
    } catch (error) {
      console.error("Error creating story:", error);
      throw error;
    }
  };

  // 📝 訪客模式：儲存到本地 (localStorage)
  const saveAsGuest = (storyData) => {
    try {
      const guestStories = JSON.parse(localStorage.getItem('guest_stories') || '[]');
      const newStory = {
        id: `guest_${Date.now()}`,
        title: storyData.title,
        content: storyData.content,
        cover_image: storyData.cover_image,
        category: storyData.category || 'novel',
        style: storyData.style || 'scifi',
        visibility: 'private',
        memory_date: storyData.memory_date || new Date().toISOString(),
        author_name: '訪客旅人',
        created_at: new Date().toISOString(),
        is_guest: true
      };
      guestStories.unshift(newStory);
      localStorage.setItem('guest_stories', JSON.stringify(guestStories));
      return newStory;
    } catch (error) {
      console.error('訪客儲存失敗:', error);
      throw error;
    }
  };

  // 📝 取得訪客本地故事
  const getGuestStories = () => {
    try {
      return JSON.parse(localStorage.getItem('guest_stories') || '[]');
    } catch {
      return [];
    }
  };

  // 🔄 同步訪客故事到雲端
  const syncGuestStories = async () => {
    if (!user) throw new Error('必須登入才能同步');

    const guestStories = getGuestStories();
    if (guestStories.length === 0) return { synced: 0 };

    const results = [];
    for (const story of guestStories) {
      try {
        const payload = {
          title: story.title,
          content: story.content,
          cover_image: story.cover_image,
          category: story.category || 'novel',
          style: story.style || 'scifi',
          visibility: story.visibility || 'private',
          memory_date: story.memory_date || new Date().toISOString(),
          author_id: user.id,
          author_name: user.email?.split('@')[0] || '旅人',
          created_at: story.created_at || new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('stories')
          .insert([payload])
          .select();

        if (error) throw error;
        results.push({ success: true, id: data[0].id });
      } catch (error) {
        console.error('同步故事失敗:', story.title, error);
        results.push({ success: false, title: story.title });
      }
    }

    // 同步成功後清除本地故事
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      clearGuestStories();
      fetchUserStories(user.id); // 重新取得雲端故事
    }

    return { synced: successCount, total: guestStories.length, results };
  };

  // 🗑️ 清除本地訪客故事
  const clearGuestStories = () => {
    localStorage.removeItem('guest_stories');
  };

  const value = {
    user,
    loading,
    balance,
    appMode,
    setAppMode,
    userStories,
    allStories,
    isAdmin,
    transactions,
    createStory,
    deleteStory,
    fetchAllStories,
    saveAsGuest,
    getGuestStories,
    syncGuestStories,
    clearGuestStories,
    signUp,
    signIn,
    signOut,
  };

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
};