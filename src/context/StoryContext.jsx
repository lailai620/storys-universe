import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const StoryContext = createContext();

export const useStory = () => useContext(StoryContext);

export const StoryProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stories, setStories] = useState([]);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. 監聽使用者登入狀態
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        // 登入後自動抓取所有資料
        await Promise.all([
            fetchStories(session.user.id), 
            fetchBalance(session.user.id), 
            fetchTransactions(session.user.id)
        ]);
      } else {
        setStories([]);
        setBalance(0);
        setTransactions([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. 抓取故事列表
  const fetchStories = async (userId = user?.id) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error("抓取故事失敗:", error.message);
    }
  };

  // 3. 抓取錢包餘額 (如果沒有錢包會自動建立)
  const fetchBalance = async (userId = user?.id) => {
    if (!userId) return;
    try {
      let { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .single();

      // 如果還沒有錢包，則建立一個並送 100 SEED
      if (error && error.code === 'PGRST116') {
         const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert([{ user_id: userId, balance: 100 }])
            .select()
            .single();
         
         if (!createError) {
             setBalance(newWallet.balance);
             return;
         }
      }

      if (data) setBalance(data.balance);
    } catch (error) {
      console.error("抓取餘額失敗:", error.message);
    }
  };

  // 4. 抓取交易紀錄
  const fetchTransactions = async (userId = user?.id) => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error) setTransactions(data || []);
    } catch (error) {
      console.error("抓取交易失敗:", error);
    }
  };

  // 5. 消費種子
  const spendSeeds = async (amount, type, description) => {
    if (!user) return false;
    // 重新確認餘額
    await fetchBalance();
    
    if (balance < amount) {
        alert("能量不足，請前往錢包儲值！");
        return false;
    }

    try {
        // 扣款
        const { error: updateError } = await supabase
            .from('wallets')
            .update({ balance: balance - amount })
            .eq('user_id', user.id);
        
        if (updateError) throw updateError;

        // 寫入紀錄
        await supabase.from('transactions').insert([{
            user_id: user.id,
            amount: -amount,
            type: type,
            description: description
        }]);

        // 更新前端狀態
        setBalance(prev => prev - amount);
        fetchTransactions(); 
        return true;
    } catch (error) {
        alert("交易失敗：" + error.message);
        return false;
    }
  };

  // 6. 發布故事
  const publishToCloud = async (storyData) => {
      if (!user) return false;
      try {
          const { error } = await supabase.from('stories').insert([{
              ...storyData,
              user_id: user.id,
              cover_image: storyData.coverImage 
          }]);
          if (error) throw error;
          await fetchStories(); 
          return true;
      } catch (error) {
          throw error;
      }
  };

  // 7. 刪除故事
  const deleteStory = async (id) => {
      try {
          const { error } = await supabase.from('stories').delete().eq('id', id);
          if (error) throw error;
          setStories(prev => prev.filter(s => s.id !== id));
      } catch (error) {
          alert("刪除失敗");
      }
  };

  return (
    <StoryContext.Provider value={{ 
        user, stories, balance, transactions, 
        fetchStories, fetchBalance, fetchTransactions, 
        spendSeeds, publishToCloud, deleteStory 
    }}>
      {!loading && children}
    </StoryContext.Provider>
  );
};