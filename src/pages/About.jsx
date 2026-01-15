import React from 'react';
import { Sprout, Heart, Zap, Globe, ArrowRight, Leaf, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white pb-20 animate-fade">
      {/* 1. Hero Section: 核心願景 */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 to-[#050505] z-10" />
        <img 
            src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2940&auto=format&fit=crop" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            alt="Farm and Future"
        />
        <div className="relative z-20 text-center px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Everyone has a vision.
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 font-medium leading-relaxed">
                我們正在模糊虛擬與現實的邊界。<br/>
                從一個故事開始，建立一套可持續的糧食基礎設施。
            </p>
        </div>
      </div>

      {/* 2. 為什麼要做這個？ (Origin) */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Sprout className="text-green-400"/> 起源：一個現實的問題
        </h2>
        <div className="bg-[#111] p-8 rounded-3xl border border-white/10 leading-loose text-lg text-gray-300">
            <p className="mb-6">
                在科技高度發達的今天，為什麼仍有大量人群無法穩定取得乾淨、安全的糧食？
                生產端依賴天候，流通端層層加價，消費者被迫在「便利」與「健康」間妥協。
            </p>
            <p className="font-bold text-white">
                STORYS 不只是一個故事平台，它是我們解決方案的「接觸層」。
            </p>
            <p className="mt-4">
                我們提出一個新的架構：以科技降低成本（垂直農場），以去中心化縮短距離（自取站），以社群機制確保公平（糧食代幣）。
            </p>
        </div>
      </div>

      {/* 3. 生態系三部曲 (The Ecosystem) */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-center text-3xl font-bold mb-12">我們的生態系藍圖</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 卡片 A */}
            <div className="bg-[#18181b] p-8 rounded-3xl border border-gray-800 hover:border-purple-500 transition group">
                <div className="w-14 h-14 bg-purple-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Globe className="text-purple-400" size={28}/>
                </div>
                <h3 className="text-xl font-bold mb-4">STORYS 故事宇宙</h3>
                <p className="text-gray-400 leading-relaxed">
                    這是社群的起點。在這裡，您透過創作與閱讀累積「種子代幣 ($SEED)」。您的每一次互動，都在為實體世界累積能量。
                </p>
            </div>

            {/* 卡片 B */}
            <div className="bg-[#18181b] p-8 rounded-3xl border border-gray-800 hover:border-green-500 transition group">
                <div className="w-14 h-14 bg-green-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Leaf className="text-green-400" size={28}/>
                </div>
                <h3 className="text-xl font-bold mb-4">智慧垂直農場</h3>
                <p className="text-gray-400 leading-relaxed">
                    利用 AI 與 IoT 技術，在城市中建立無毒、不受天候影響的室內農場。這是我們未來的「生產層」，確保糧食安全。
                </p>
            </div>

            {/* 卡片 C */}
            <div className="bg-[#18181b] p-8 rounded-3xl border border-gray-800 hover:border-orange-500 transition group">
                <div className="w-14 h-14 bg-orange-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <Heart className="text-orange-400" size={28}/>
                </div>
                <h3 className="text-xl font-bold mb-4">公益與公平分配</h3>
                <p className="text-gray-400 leading-relaxed">
                    代幣不僅是點數，更是未來的「糧食券」。每一筆消費都提撥 1% 支持公益，讓弱勢族群也能獲得新鮮蔬菜。
                </p>
            </div>
        </div>
      </div>

      {/* 4. Call to Action */}
      <div className="max-w-3xl mx-auto text-center py-20 px-6">
        <h2 className="text-4xl font-black mb-6">加入這場溫柔的革命</h2>
        <p className="text-xl text-gray-400 mb-10">
            如果您也相信「糧食應該更靠近人」，如果您也相信「故事可以改變世界」。<br/>
            那我們正在做的，就是未來。
        </p>
        <button 
            onClick={() => navigate('/creator')}
            className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition flex items-center gap-2 mx-auto"
        >
            開始創作，累積種子 <ArrowRight size={20}/>
        </button>
      </div>
    </div>
  );
};

export default About;