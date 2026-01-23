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