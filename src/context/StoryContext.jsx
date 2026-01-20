import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StoryContext = createContext();

export const useStory = () => useContext(StoryContext);

export const StoryProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(100); // 模擬 SEED 餘額

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
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // 📝 核心功能：創建故事
  const createStory = async (storyData) => {
    try {
      const payload = {
        title: storyData.title,
        content: storyData.content,
        cover_image: storyData.cover_image,
        category: storyData.category,
        visibility: storyData.visibility,
        author_name: user?.email?.split('@')[0] || "匿名旅人",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('stories')
        .insert([payload])
        .select();

      if (error) throw error;
      setBalance(prev => prev - 10);
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
    createStory,
    signUp,  // 🚀 新增
    signIn,  // 🚀 新增
    signOut, // 🚀 新增
  };

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
};