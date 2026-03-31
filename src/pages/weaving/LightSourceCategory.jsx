import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WeavingLayout from '../../components/weaving/WeavingLayout';
import familyImg from '../../assets/categories/family.png';
import friendsImg from '../../assets/categories/friends.png';
import workImg from '../../assets/categories/work.png';
import petsImg from '../../assets/categories/pets.png';

const CATEGORIES = [
    { id: 'family', icon: 'family_restroom', name: '親密家人', subtitle: '溫暖的避風港', image: familyImg },
    { id: 'friends', icon: 'diversity_1', name: '摯友夥伴', subtitle: '靈魂的共鳴', image: friendsImg },
    { id: 'work', icon: 'work', name: '職場戰友', subtitle: '並肩作戰', image: workImg },
    { id: 'pets', icon: 'pets', name: '毛孩家人', subtitle: '無條件的愛', image: petsImg },
];

const LightSourceCategory = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(null);

    return (
        <WeavingLayout showNav={false}>
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                <button onClick={() => navigate(-1)} className="size-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition">
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h1 className="text-lg font-bold font-display">織光</h1>
                <div className="size-10" />
            </header>

            <main className="flex-1 flex flex-col px-6 pb-24 pt-4 overflow-y-auto">
                <div className="mb-8 mt-4 text-center">
                    <h2 className="text-[28px] font-bold leading-tight tracking-tight mb-3 font-display">
                        誰是你生命中的<br />那道光？
                    </h2>
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-[15px] leading-relaxed max-w-[280px] mx-auto">
                        選擇你想記錄的關係，<br />開始編織你們之間獨一無二的故事。
                    </p>
                </div>

                {/* Self Card — 放在最上方 */}
                <label className="group relative cursor-pointer mb-4 block">
                    <input type="radio" name="category" className="peer sr-only" checked={selected === 'self'} onChange={() => setSelected('self')} />
                    <div className="relative flex flex-row items-center w-full overflow-hidden rounded-2xl bg-primary/10 dark:bg-surface-dark border border-primary/20 transition-all peer-checked:ring-2 peer-checked:ring-primary p-4 shadow-sm hover:shadow-soft h-[88px]">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <span className="material-symbols-outlined text-[28px]">person</span>
                        </div>
                        <div className="ml-4 flex flex-col justify-center">
                            <h3 className="text-lg font-bold font-display">自己</h3>
                            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-light">與內心對話的旅程</p>
                        </div>
                        <div className="ml-auto opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                            <span className="material-symbols-outlined text-[28px]">check_circle</span>
                        </div>
                    </div>
                </label>

                <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map(cat => (
                        <label key={cat.id} className="group relative cursor-pointer">
                            <input
                                type="radio" name="category" className="peer sr-only"
                                checked={selected === cat.id}
                                onChange={() => setSelected(cat.id)}
                            />
                            <div className="relative flex flex-col aspect-[4/5] w-full overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark transition-all duration-300 peer-checked:ring-2 peer-checked:ring-primary shadow-sm hover:shadow-soft">
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-90" style={{ backgroundImage: `url('${cat.image}')` }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                </div>
                                <div className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white opacity-0 peer-checked:opacity-100 scale-75 peer-checked:scale-100 transition-all">
                                    <span className="material-symbols-outlined text-[20px]">check</span>
                                </div>
                                <div className="mt-auto p-4 relative z-10">
                                    <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white">
                                        <span className="material-symbols-outlined">{cat.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white font-display">{cat.name}</h3>
                                    <p className="text-xs text-white/80 mt-1 font-light">{cat.subtitle}</p>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </main>

            <div className="fixed bottom-0 w-full max-w-md mx-auto bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-black/5 dark:border-white/5 p-5 z-20">
                <button
                    onClick={() => selected && navigate(`/story-options?category=${selected}`)}
                    className={`w-full flex items-center justify-center rounded-xl h-14 font-bold text-[17px] tracking-wide shadow-lg transition-all active:scale-[0.98] ${selected ? 'bg-primary text-primary-foreground shadow-primary/30 hover:bg-primary-dark' : 'bg-primary/30 text-primary-foreground/50 cursor-not-allowed'
                        }`}
                >
                    下一步
                </button>
            </div>
        </WeavingLayout>
    );
};

export default LightSourceCategory;
