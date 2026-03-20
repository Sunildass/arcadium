import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GAME_CATALOG, CATEGORIES } from '../core/catalog';
import { Gamepad2, Trophy, Clock, Search, ChevronRight, Play } from 'lucide-react';
import { PlayerProfileManager } from '../core/ai/PlayerProfileManager';
import { GameIcon } from '../components/GameIconMap';
import { formatMinutes } from '../utils/timeFormat';
import { ComingSoonModal } from '../components/modals/ComingSoonModal';
import { GameCatalogItem } from '../core/catalog';
import { useTheme } from '../theme/ThemeProvider';
import { ArcadiumLogo } from '../components/layout/ArcadiumLogo';
import { GLOBAL_THEME } from '../theme/theme.registry';

export default function MainMenu() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const { setThemeContext } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [comingSoonGame, setComingSoonGame] = useState<GameCatalogItem | null>(null);

  React.useEffect(() => {
    setThemeContext(categoryId, undefined);
  }, [categoryId, setThemeContext]);

  const filteredGames = GAME_CATALOG.filter(game => {
    const matchesCategory = categoryId ? game.categoryId === categoryId : true;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getProfileStats = (gameId: string) => {
      // In a real app we'd load this once or via Redux, but reading localStorage instantly is fast enough for menu
      const manager = new PlayerProfileManager(gameId);
      return manager.getStats();
  };

  return (
    <div className="min-h-screen flex flex-col items-center z-10 relative">
      {/* Header */}
      <header className="w-full max-w-7xl mx-auto p-6 flex flex-col sm:flex-row justify-between items-center border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <ArcadiumLogo onClick={() => { navigate('/dashboard'); setSearchQuery(''); }} />

        <div className="mt-4 sm:mt-0 relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-50" style={{ color: 'var(--color-text-secondary)' }} />
            <input 
                type="text" 
                placeholder="Search games..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border rounded-full py-2 pl-10 pr-4 outline-none transition-all text-sm backdrop-blur-sm"
                style={{
                   backgroundColor: 'var(--color-surface)',
                   color: 'var(--color-text-primary)',
                   borderColor: 'rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto p-6 flex-1 flex flex-col md:flex-row gap-8">
          {/* Sidebar Categories */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
             <h3 
                className="text-xs font-black uppercase tracking-widest pl-2 mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
             >
                Categories
             </h3>
             
             <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-between p-3 rounded-xl transition-all shadow-md group border border-transparent"
                style={{
                   backgroundColor: !categoryId ? 'var(--color-surface)' : 'transparent',
                   color: !categoryId ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                   borderColor: !categoryId ? 'var(--color-accent)' : 'transparent'
                }}
             >
                 <span className="font-bold">All Games</span>
                 {(!categoryId) && <ChevronRight className="w-4 h-4" />}
             </button>

             {CATEGORIES.map(cat => (
                 <button
                    key={cat.id}
                    onClick={() => navigate(`/dashboard/category/${cat.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl transition-all shadow-md group border border-transparent"
                    style={{
                       backgroundColor: categoryId === cat.id ? 'var(--color-surface)' : 'transparent',
                       color: categoryId === cat.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                       borderColor: categoryId === cat.id ? 'var(--color-accent)' : 'transparent'
                    }}
                 >
                     <div className="flex flex-col items-start">
                         <span className="font-bold">{cat.name}</span>
                         <span className="text-[10px] opacity-70">{cat.description}</span>
                     </div>
                     {(categoryId === cat.id) && <ChevronRight className="w-4 h-4" />}
                 </button>
             ))}
          </aside>

          {/* Game Grid */}
          <section className="flex-1">
              <div className="flex items-center justify-between mb-6">
                 <h2 
                    className="text-2xl font-black"
                    style={{ fontFamily: GLOBAL_THEME.typography.headingFont }}
                 >
                     {categoryId ? CATEGORIES.find(c => c.id === categoryId)?.name : 'All Games'}
                     <span 
                         className="ml-3 text-sm font-medium px-3 py-1 rounded-full border"
                         style={{ 
                             backgroundColor: 'var(--color-surface)',
                             color: 'var(--color-text-secondary)',
                             borderColor: 'rgba(255,255,255,0.1)'
                         }}
                     >
                         {filteredGames.length}
                     </span>
                 </h2>
              </div>

              {filteredGames.length === 0 ? (
                  <div 
                      className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-3xl"
                      style={{
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-text-secondary)',
                          color: 'var(--color-text-secondary)'
                      }}
                  >
                      <Gamepad2 className="w-16 h-16 mb-4 opacity-50" />
                      <p className="text-xl font-bold" style={{ color: 'var(--color-text-primary)'}}>No games found.</p>
                      <p className="text-sm">Try adjusting your search or category filter.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredGames.map(game => {
                          const category = CATEGORIES.find(c => c.id === game.categoryId);
                          const stats = getProfileStats(game.id);
                          
                          return (
                              <div 
                                  key={game.id} 
                                  className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 hover:shadow-2xl hover:shadow-[var(--color-accent)]/20 hover:-translate-y-1 ${!game.isImplemented ? 'opacity-60 grayscale' : ''}`}
                                  style={{
                                      backgroundColor: 'var(--color-surface)',
                                      borderColor: 'rgba(255,255,255,0.1)'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                              >
                                  {/* Thumbnail Placeholder */}
                                  <div 
                                      className={`h-32 w-full relative overflow-hidden flex items-center justify-center`}
                                      style={{
                                          // Note: In an expansive system, we may load thumbnails, but for now we inherit a generic radial gradient from the generic background or category theme directly
                                          background: 'rgba(255,255,255,0.05)'
                                      }}
                                  >
                                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-300" />
                                      <GameIcon 
                                        gameId={game.id} 
                                        gameTitle={game.title} 
                                        className="w-16 h-16 opacity-40 mix-blend-overlay transform transition-transform group-hover:scale-110 duration-500 group-hover:text-[var(--color-primary)] text-white" 
                                      />
                                      
                                      {game.isImplemented && (
                                         <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/game/${game.id}`);
                                            }}
                                            className="absolute opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 bg-white/20 backdrop-blur-md border border-white/30 text-white rounded-full p-4 hover:shadow-[0_0_30px_var(--color-primary)]"
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.1)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                                e.currentTarget.style.color = '#fff';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                            }}
                                         >
                                             <Play className="w-8 h-8 ml-1" fill="currentColor" />
                                         </button>
                                      )}

                                      {!game.isImplemented && (
                                          <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-2 text-center">
                                              <span className="text-xs font-bold text-white uppercase tracking-widest">Coming Soon</span>
                                          </div>
                                      )}
                                  </div>

                                  {/* Info */}
                                  <div className="p-4 flex flex-col flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                          <h3 
                                              className="font-bold text-lg leading-tight transition-colors"
                                              style={{ color: 'var(--color-text-primary)' }}
                                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
                                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                                          >
                                              {game.title}
                                          </h3>
                                      </div>
                                      <p 
                                          className="text-xs leading-relaxed mb-4 flex-1"
                                          style={{ color: 'var(--color-text-secondary)' }}
                                      >
                                          {game.description}
                                      </p>
                                      
                                      <div 
                                          className="flex justify-between items-center pt-3 border-t"
                                          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                                      >
                                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                              <Trophy className="w-3 h-3 text-amber-500" />
                                              <span>{stats.wins} Wins</span>
                                          </div>
                                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                              <Clock className="w-3 h-3 text-blue-400" />
                                              <span>{formatMinutes(stats.totalPlaytimeMs / 1000)}</span>
                                          </div>
                                      </div>
                                  </div>

                                  {/* Click overlay for accessibility without button press */}
                                  <div 
                                      className={`absolute inset-0 cursor-pointer hidden sm:block z-0 ${!game.isImplemented ? 'block' : ''}`}
                                      onClick={(e) => {
                                          if ((e.target as HTMLElement).tagName !== 'BUTTON') {
                                              if (game.comingSoon || !game.isImplemented) {
                                                  setComingSoonGame(game);
                                              } else {
                                                  navigate(`/game/${game.id}`);
                                              }
                                          }
                                      }}
                                  />
                              </div>
                          );
                      })}
                  </div>
              )}
          </section>
      </main>

      {/* Modals */}
      {comingSoonGame && (
          <ComingSoonModal
              isOpen={!!comingSoonGame}
              onClose={() => setComingSoonGame(null)}
              gameName={comingSoonGame.title}
              categoryId={comingSoonGame.categoryId}
          />
      )}
    </div>
  );
}
