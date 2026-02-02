import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAudio } from '../context/AudioContext';
import { useToast } from '../context/ToastContext';
import {
    LayoutDashboard, BookOpen, Users, TrendingUp, Eye, EyeOff,
    Trash2, Search, BarChart3, PieChart,
    DollarSign, Crown, Lock, LogOut, RefreshCw,
    ArrowLeft, Settings, Sparkles
} from 'lucide-react';

// 管理者密碼
const ADMIN_PASSWORD = 'ru1022620';

const Admin = () => {
    const navigate = useNavigate();
    const { playClick, playHover, playSuccess } = useAudio();
    const { showToast } = useToast();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [authError, setAuthError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');

    const [stats, setStats] = useState({
        totalStories: 0,
        totalUsers: 0,
        totalCollections: 0,
        todayStories: 0,
        publicStories: 0,
        privateStories: 0,
    });
    const [stories, setStories] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        playClick?.();
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setAuthError('');
            playSuccess?.();
            showToast?.('🔓 歡迎進入管理後台！', 'success');
            sessionStorage.setItem('admin_auth', 'true');
        } else {
            setAuthError('密碼錯誤，請重試');
            setPasswordInput('');
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem('admin_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStats();
            fetchStories();
            fetchUsers();
        }
    }, [isAuthenticated]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const { count: totalStories } = await supabase.from('stories').select('*', { count: 'exact', head: true });
            const { count: publicStories } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('visibility', 'public');
            const today = new Date().toISOString().split('T')[0];
            const { count: todayStories } = await supabase.from('stories').select('*', { count: 'exact', head: true }).gte('created_at', today);
            const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: totalCollections } = await supabase.from('collections').select('*', { count: 'exact', head: true });

            setStats({
                totalStories: totalStories || 0,
                totalUsers: totalUsers || 0,
                totalCollections: totalCollections || 0,
                todayStories: todayStories || 0,
                publicStories: publicStories || 0,
                privateStories: (totalStories || 0) - (publicStories || 0),
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStories = async () => {
        try {
            const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(100);
            setStories(data || []);
        } catch (error) {
            console.error('Error fetching stories:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleLogout = () => {
        playClick?.();
        sessionStorage.removeItem('admin_auth');
        setIsAuthenticated(false);
        showToast?.('已登出管理後台', 'info');
    };

    // 密碼驗證畫面
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#0f1016] flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-gradient-to-br from-[#1a1b26] to-[#13141c] border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <Lock size={32} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">管理者後台</h1>
                            <p className="text-slate-400 text-sm">請輸入管理者密碼以繼續</p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder="輸入密碼..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20"
                                    autoFocus
                                />
                                {authError && <p className="text-rose-400 text-sm mt-2">{authError}</p>}
                            </div>
                            <button type="submit" className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30">
                                進入後台
                            </button>
                        </form>

                        <button onClick={() => navigate('/')} className="w-full mt-4 py-3 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl flex items-center justify-center gap-2">
                            <ArrowLeft size={16} /> 返回首頁
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 主要後台介面
    return (
        <div className="min-h-screen bg-[#0f1016] text-slate-200 flex">
            {/* 側邊導航 */}
            <aside className="w-64 bg-[#13141c] border-r border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Settings className="text-indigo-400" size={24} /> 管理後台
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { id: 'dashboard', label: '數據儀表板', icon: LayoutDashboard },
                        { id: 'stories', label: '故事管理', icon: BookOpen },
                        { id: 'users', label: '用戶管理', icon: Users },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { playClick?.(); setActiveTab(item.id); }}
                            onMouseEnter={playHover}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl">
                        <LogOut size={20} /> 登出後台
                    </button>
                </div>
            </aside>

            {/* 主內容區 */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b border-white/5 bg-[#13141c]/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
                    <h2 className="text-lg font-bold text-white">
                        {activeTab === 'dashboard' && '📊 數據儀表板'}
                        {activeTab === 'stories' && '📝 故事管理'}
                        {activeTab === 'users' && '👥 用戶管理'}
                    </h2>
                    <button onClick={() => { playClick?.(); fetchStats(); fetchStories(); fetchUsers(); showToast?.('數據已刷新', 'success'); }} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> 刷新數據
                    </button>
                </header>

                <div className="p-6">
                    {activeTab === 'dashboard' && <DashboardTab stats={stats} stories={stories} loading={loading} />}
                    {activeTab === 'stories' && <StoriesTab stories={stories} fetchStories={fetchStories} showToast={showToast} playClick={playClick} />}
                    {activeTab === 'users' && <UsersTab users={users} fetchUsers={fetchUsers} showToast={showToast} playClick={playClick} />}
                </div>
            </main>
        </div>
    );
};

// 儀表板
const DashboardTab = ({ stats, stories, loading }) => {
    const categoryLabels = { novel: '小說', fantasy: '奇幻', scifi: '科幻', romance: '浪漫', horror: '恐怖', memoir: '回憶', kids: '童話' };
    const categoryColors = { novel: '#10b981', fantasy: '#8b5cf6', scifi: '#06b6d4', romance: '#ec4899', horror: '#ef4444', memoir: '#f59e0b', kids: '#f472b6' };
    const categoryDistribution = stories.reduce((acc, story) => { const style = story.style || 'novel'; acc[style] = (acc[style] || 0) + 1; return acc; }, {});

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={BookOpen} label="總故事數" value={stats.totalStories} color="indigo" loading={loading} />
                <StatCard icon={Users} label="總用戶數" value={stats.totalUsers} color="purple" loading={loading} />
                <StatCard icon={Sparkles} label="總收藏數" value={stats.totalCollections} color="amber" loading={loading} />
                <StatCard icon={TrendingUp} label="今日新增" value={stats.todayStories} color="emerald" loading={loading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="本月收入" value="NT$ 12,580" color="green" loading={loading} isText />
                <StatCard icon={Crown} label="VIP 訂閱" value="23" color="yellow" loading={loading} />
                <StatCard icon={Eye} label="公開故事" value={stats.publicStories} color="cyan" loading={loading} />
                <StatCard icon={EyeOff} label="私人故事" value={stats.privateStories} color="slate" loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#1a1b26] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PieChart size={20} className="text-indigo-400" /> 故事分類分佈</h3>
                    <div className="space-y-3">
                        {Object.entries(categoryDistribution).map(([key, count]) => {
                            const percentage = stories.length > 0 ? ((count / stories.length) * 100).toFixed(1) : 0;
                            return (
                                <div key={key} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColors[key] || '#6366f1' }} />
                                    <span className="text-slate-300 text-sm w-16">{categoryLabels[key] || key}</span>
                                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: categoryColors[key] || '#6366f1' }} />
                                    </div>
                                    <span className="text-slate-400 text-sm w-20 text-right">{count} ({percentage}%)</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-[#1a1b26] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-emerald-400" /> 收入趨勢 (示意)</h3>
                    <div className="flex items-end justify-between h-40 gap-2">
                        {['一月', '二月', '三月', '四月', '五月', '六月'].map((month, i) => {
                            const heights = [45, 62, 55, 78, 85, 92];
                            return (
                                <div key={month} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg" style={{ height: `${heights[i]}%` }} />
                                    <span className="text-xs text-slate-500">{month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1b26] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">📚 最新故事</h3>
                <table className="w-full">
                    <thead><tr className="text-left text-slate-500 text-sm border-b border-white/5"><th className="pb-3">標題</th><th className="pb-3">作者</th><th className="pb-3">分類</th><th className="pb-3">可見度</th><th className="pb-3">建立時間</th></tr></thead>
                    <tbody>
                        {stories.slice(0, 5).map((story) => (
                            <tr key={story.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="py-3 text-white">{story.title || '無標題'}</td>
                                <td className="py-3 text-slate-400">{story.author_name || '匿名'}</td>
                                <td className="py-3"><span className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-300">{categoryLabels[story.style] || story.style || '一般'}</span></td>
                                <td className="py-3">{story.visibility === 'public' ? <span className="text-emerald-400 flex items-center gap-1"><Eye size={14} /> 公開</span> : <span className="text-slate-500 flex items-center gap-1"><EyeOff size={14} /> 私人</span>}</td>
                                <td className="py-3 text-slate-500 text-sm">{story.created_at ? new Date(story.created_at).toLocaleDateString('zh-TW') : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color, loading, isText }) => {
    const colorClasses = {
        indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400',
        purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
        amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
        emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
        yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
        cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
        slate: 'from-slate-500/20 to-slate-600/10 border-slate-500/30 text-slate-400',
    };
    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3"><Icon size={24} /></div>
            <p className="text-slate-400 text-sm mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{loading ? <span className="inline-block w-16 h-7 bg-white/10 rounded animate-pulse" /> : (isText ? value : (typeof value === 'number' ? value.toLocaleString() : value))}</p>
        </div>
    );
};

// 故事管理
const StoriesTab = ({ stories, fetchStories, showToast, playClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVisibility, setFilterVisibility] = useState('all');
    const filteredStories = stories.filter((s) => (s.title?.toLowerCase().includes(searchTerm.toLowerCase())) && (filterVisibility === 'all' || s.visibility === filterVisibility));

    const handleDelete = async (id, title) => {
        if (!confirm(`確定要刪除「${title}」嗎？`)) return;
        playClick?.();
        const { error } = await supabase.from('stories').delete().eq('id', id);
        if (error) { showToast?.('刪除失敗', 'error'); return; }
        showToast?.('故事已刪除', 'success');
        fetchStories();
    };

    const toggleVisibility = async (id, current) => {
        playClick?.();
        const newV = current === 'public' ? 'private' : 'public';
        await supabase.from('stories').update({ visibility: newV }).eq('id', id);
        showToast?.(`已設為${newV === 'public' ? '公開' : '私人'}`, 'success');
        fetchStories();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input type="text" placeholder="搜尋故事標題..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50" />
                </div>
                <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none">
                    <option value="all">全部</option><option value="public">公開</option><option value="private">私人</option>
                </select>
            </div>

            <div className="bg-[#1a1b26] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead><tr className="text-left text-slate-500 text-sm bg-white/5"><th className="px-6 py-4">標題</th><th className="px-6 py-4">作者</th><th className="px-6 py-4">可見度</th><th className="px-6 py-4">建立時間</th><th className="px-6 py-4">操作</th></tr></thead>
                    <tbody>
                        {filteredStories.map((story) => (
                            <tr key={story.id} className="border-t border-white/5 hover:bg-white/5">
                                <td className="px-6 py-4 text-white font-medium">{story.title || '無標題'}</td>
                                <td className="px-6 py-4 text-slate-400">{story.author_name || '匿名'}</td>
                                <td className="px-6 py-4"><button onClick={() => toggleVisibility(story.id, story.visibility)} className={story.visibility === 'public' ? 'text-emerald-400' : 'text-slate-500'}>{story.visibility === 'public' ? <><Eye size={14} /> 公開</> : <><EyeOff size={14} /> 私人</>}</button></td>
                                <td className="px-6 py-4 text-slate-500 text-sm">{story.created_at ? new Date(story.created_at).toLocaleDateString('zh-TW') : '-'}</td>
                                <td className="px-6 py-4"><button onClick={() => handleDelete(story.id, story.title)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredStories.length === 0 && <div className="py-12 text-center text-slate-500">沒有找到符合條件的故事</div>}
            </div>
        </div>
    );
};

// 用戶管理
const UsersTab = ({ users, fetchUsers, showToast, playClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredUsers = users.filter((u) => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const adjustBalance = async (id, current, amount) => {
        const newB = (current || 0) + amount;
        if (newB < 0) { showToast?.('餘額不能為負數', 'error'); return; }
        playClick?.();
        await supabase.from('profiles').update({ token_balance: newB }).eq('id', id);
        showToast?.(`餘額已調整為 ${newB}`, 'success');
        fetchUsers();
    };

    return (
        <div className="space-y-6">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-slate-500" size={18} />
                <input type="text" placeholder="搜尋 Email 或顯示名稱..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none" />
            </div>

            <div className="bg-[#1a1b26] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead><tr className="text-left text-slate-500 text-sm bg-white/5"><th className="px-6 py-4">Email</th><th className="px-6 py-4">顯示名稱</th><th className="px-6 py-4">會員等級</th><th className="px-6 py-4">星塵餘額</th><th className="px-6 py-4">餘額操作</th></tr></thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="border-t border-white/5 hover:bg-white/5">
                                <td className="px-6 py-4 text-white">{user.email || '-'}</td>
                                <td className="px-6 py-4 text-slate-400">{user.display_name || '-'}</td>
                                <td className="px-6 py-4">{user.membership_tier === 'vip' ? <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-300"><Crown size={12} className="inline" /> VIP</span> : <span className="px-2 py-1 text-xs rounded-full bg-slate-500/20 text-slate-400">免費</span>}</td>
                                <td className="px-6 py-4"><span className="text-amber-400 font-bold"><Sparkles size={14} className="inline" /> {user.token_balance || 0}</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => adjustBalance(user.id, user.token_balance, -10)} className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 text-sm font-bold">-10</button>
                                        <button onClick={() => adjustBalance(user.id, user.token_balance, 10)} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 text-sm font-bold">+10</button>
                                        <button onClick={() => adjustBalance(user.id, user.token_balance, 100)} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 text-sm font-bold">+100</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && <div className="py-12 text-center text-slate-500">沒有找到符合條件的用戶</div>}
            </div>
        </div>
    );
};

export default Admin;