import React, { useState, useEffect } from 'react';
import { Board, BoardItem } from './types';
import { BoardEditor } from './components/BoardEditor';
import { generateBoardSuggestions } from './services/geminiService';
import { Sparkles, User, Heart, Zap, Palette, Loader2, Trash2, Moon } from 'lucide-react';

const STORAGE_KEY = 'friendfolk_boards';

const VampireDecorations = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    {/* Blood Vignette */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(138,3,3,0.15)_100%)] opacity-50"></div>
    
    {/* Spiderweb Top Left */}
    <svg className="absolute top-0 left-0 w-64 h-64 text-ash/10" viewBox="0 0 100 100" fill="none" stroke="currentColor">
       <path d="M0 0 L100 0 M0 0 L0 100 M0 0 L80 20 M0 0 L60 40 M0 0 L40 60 M0 0 L20 80" strokeWidth="0.5" />
       <path d="M80 0 Q70 20 60 40 Q50 60 40 80" strokeWidth="0.2" fill="none" />
       <path d="M60 0 Q50 15 40 30 Q30 45 20 60" strokeWidth="0.2" fill="none" />
       <path d="M40 0 Q35 10 30 20 Q20 30 10 40" strokeWidth="0.2" fill="none" />
    </svg>

    {/* Spiderweb Bottom Right */}
    <svg className="absolute bottom-0 right-0 w-96 h-96 text-ash/10 rotate-180" viewBox="0 0 100 100" fill="none" stroke="currentColor">
       <path d="M0 0 L100 0 M0 0 L0 100 M0 0 L80 20 M0 0 L60 40 M0 0 L40 60 M0 0 L20 80" strokeWidth="0.5" />
       <path d="M80 0 Q70 20 60 40 Q50 60 40 80" strokeWidth="0.2" fill="none" />
       <path d="M60 0 Q50 15 40 30 Q30 45 20 60" strokeWidth="0.2" fill="none" />
    </svg>

    {/* Bats */}
    <div className="absolute animate-bat-fly-1 opacity-60 text-4xl">🦇</div>
    <div className="absolute animate-bat-fly-2 opacity-40 text-2xl" style={{ animationDelay: '5s' }}>🦇</div>
    <div className="absolute animate-bat-fly-3 opacity-50 text-3xl" style={{ animationDelay: '2s' }}>🦇</div>
  </div>
);

const App = () => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [newFriendDesc, setNewFriendDesc] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setBoards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load boards", e);
      }
    }
  }, []);

  const saveBoards = (newBoards: Board[]) => {
    setBoards(newBoards);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newBoards));
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
    const updated = boards.map(b => b.id === updatedBoard.id ? updatedBoard : b);
    saveBoards(updated);
  };

  const handleDeleteBoard = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm("Condemn this board to the void?")) {
          const updated = boards.filter(b => b.id !== id);
          saveBoards(updated);
      }
  }

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName || !newFriendDesc) return;

    setIsGenerating(true);

    try {
      // AI Magic
      const suggestions = await generateBoardSuggestions(newFriendDesc);
      
      const newItems: BoardItem[] = [];
      const timestamp = Date.now();

      if (suggestions) {
        suggestions.items.forEach((sug, idx) => {
           let content = sug.content;
           // Improved Image Generation Logic
           if (sug.type === 'image') {
               const seed = Math.floor(Math.random() * 9999);
               // Use Pollinations.ai for realistic generation without a key
               const prompt = encodeURIComponent(`gothic vampire aesthetic, dark moody lighting, photorealistic 8k, ${content}, masterpiece, victorian horror style`);
               content = `https://image.pollinations.ai/prompt/${prompt}?width=600&height=600&nologo=true&seed=${seed}`;
           }

           const isText = sug.type === 'text';
           
           newItems.push({
             id: `${timestamp}-${idx}`,
             type: sug.type as any,
             content: content,
             style: {
               rotation: Math.random() * 6 - 3,
               scale: 1,
               zIndex: 1,
               // If text, default to parchment or suggested color. 
               backgroundColor: isText ? (suggestions.colors[idx % suggestions.colors.length] || '#dcd0c0') : undefined,
               textColor: isText ? '#000' : undefined,
               fontFamily: Math.random() > 0.5 ? 'hand' : 'sans',
               gridSpan: sug.gridSpan || '1x1'
             }
           });
        });
      }

      const newBoard: Board = {
        id: timestamp.toString(),
        friendName: newFriendName,
        description: newFriendDesc,
        themeColors: suggestions?.colors || ['#360e0e', '#5e1b1b', '#8a0303', '#dcd0c0', '#1a1a1a'],
        items: newItems,
        createdAt: timestamp,
      };

      saveBoards([newBoard, ...boards]);
      setIsCreating(false);
      setNewFriendName('');
      setNewFriendDesc('');
      setActiveBoardId(newBoard.id);

    } catch (err) {
      console.error(err);
      alert("The spirits failed to conjure a board. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (activeBoardId) {
    const activeBoard = boards.find(b => b.id === activeBoardId);
    if (activeBoard) {
      return (
        <>
            <VampireDecorations />
            <BoardEditor 
            board={activeBoard} 
            onSave={handleUpdateBoard} 
            onBack={() => setActiveBoardId(null)} 
            />
        </>
      );
    }
  }

  return (
    <div className="min-h-screen bg-paper text-bone font-sans selection:bg-blood selection:text-white relative overflow-x-hidden">
      <VampireDecorations />
      <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10">
        
        {/* Hero */}
        <div className="mb-16 text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight font-display text-blood drop-shadow-[0_0_15px_rgba(138,3,3,0.8)] animate-float">
            Friend<span className="text-bone font-display">Folk</span>
          </h1>
          <p className="text-xl text-ash max-w-2xl mx-auto leading-relaxed italic animate-flicker">
            "Immortalize your coven. Create eternal mood boards powered by dark magic."
          </p>
        </div>

        {/* Create Action */}
        {!isCreating ? (
          <div className="flex justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <button 
              onClick={() => setIsCreating(true)}
              className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-300 bg-blood font-display text-lg tracking-widest rounded-sm border border-transparent hover:border-red-500 hover:shadow-[0_0_30px_rgba(138,3,3,0.6)] hover:scale-105"
            >
              <Moon className="mr-3 group-hover:text-gold transition-colors group-hover:animate-pulse" size={20} />
              CONJURE BOARD
            </button>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-coffin p-8 rounded-lg shadow-2xl mb-16 border border-blood/30 animate-in fade-in zoom-in duration-500 relative overflow-hidden backdrop-blur-sm">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blood to-transparent animate-pulse-slow"></div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-display text-blood">
                <Sparkles className="text-gold animate-spin-slow" />
                Summoning Ritual
            </h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ash mb-1 uppercase tracking-wider text-xs">Chosen One</label>
                <div className="relative group">
                    <User className="absolute left-3 top-3 text-blood group-hover:scale-110 transition-transform" size={18} />
                    <input
                    type="text"
                    required
                    placeholder="Name of the mortal..."
                    className="w-full pl-10 pr-4 py-2.5 rounded bg-paper border border-blood/30 text-bone focus:border-blood focus:ring-1 focus:ring-blood outline-none transition-all placeholder:text-gray-700 hover:border-blood/60"
                    value={newFriendName}
                    onChange={e => setNewFriendName(e.target.value)}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ash mb-1 uppercase tracking-wider text-xs">Essence</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe their soul..."
                  className="w-full px-4 py-3 rounded bg-paper border border-blood/30 text-bone focus:border-blood focus:ring-1 focus:ring-blood outline-none transition-all resize-none placeholder:text-gray-700 hover:border-blood/60"
                  value={newFriendDesc}
                  onChange={e => setNewFriendDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 px-4 rounded border border-ash/20 text-ash font-medium hover:bg-white/5 transition-colors font-display hover:text-white"
                >
                  FLEE
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 py-3 px-4 rounded bg-blood text-white font-bold hover:bg-crimson transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-display tracking-wide hover:shadow-[0_0_15px_rgba(138,3,3,0.5)]"
                >
                  {isGenerating ? (
                    <>
                        <Loader2 className="animate-spin" size={18} />
                        SUMMONING...
                    </>
                  ) : (
                    <>
                        SUMMON
                        <Zap size={18} fill="currentColor" className="text-gold" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Board List */}
        {boards.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-2 font-display tracking-wide text-ash animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                <Heart className="text-blood animate-pulse" fill="currentColor" />
                YOUR COVEN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {boards.map((board, index) => (
                <div 
                  key={board.id}
                  onClick={() => setActiveBoardId(board.id)}
                  className="group bg-coffin rounded-lg overflow-hidden shadow-lg hover:shadow-blood/40 transition-all duration-500 cursor-pointer border border-blood/20 hover:-translate-y-2 relative opacity-0 animate-enter-card z-10"
                  style={{ animationDelay: `${index * 150 + 400}ms` }}
                >
                  <div className="h-48 bg-paper relative overflow-hidden p-4 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                    {/* Mini Preview of items */}
                    <div className="grid grid-cols-3 gap-2 h-full w-full">
                        {board.items.slice(0, 6).map((item, i) => (
                             <div 
                                key={i} 
                                className="rounded-sm overflow-hidden flex items-center justify-center text-[8px] bg-paper shadow-sm border border-white/5 transition-transform duration-700 group-hover:scale-105"
                                style={{ 
                                    backgroundColor: item.type === 'color' ? item.content : (item.style.backgroundColor || '#dcd0c0'),
                                    transform: `rotate(${item.style.rotation}deg)` 
                                }}
                             >
                                 {item.type === 'image' && <img src={item.content} className="w-full h-full object-cover filter sepia-[.3] contrast-125" />}
                                 {item.type === 'text' && <div className="p-1 text-center truncate text-black font-serif">{item.content}</div>}
                                 {item.type === 'sticker' && <span className="text-lg">{item.content}</span>}
                             </div>
                        ))}
                    </div>
                  </div>
                  <div className="p-6 border-t border-blood/10 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-xl font-display text-bone tracking-wide group-hover:text-blood transition-colors duration-300">{board.friendName}</h4>
                        <div className="flex -space-x-2">
                            {board.themeColors.slice(0,3).map((c,i) => (
                                <div key={i} className="w-5 h-5 rounded-full border border-coffin" style={{backgroundColor: c}}></div>
                            ))}
                        </div>
                    </div>
                    <p className="text-ash text-sm line-clamp-2 mb-4 italic font-light group-hover:text-gray-300 transition-colors">{board.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-600 font-medium uppercase tracking-widest">
                        <span>{board.items.length} artifacts</span>
                        <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                     onClick={(e) => handleDeleteBoard(e, board.id)}
                     className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur text-blood rounded hover:bg-blood hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
                  >
                      <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {boards.length === 0 && !isCreating && (
            <div className="text-center py-20 bg-coffin/50 rounded-lg border border-dashed border-blood/20 animate-fade-in-up relative z-10" style={{ animationDelay: '400ms' }}>
                <Palette className="mx-auto text-blood/50 mb-4 animate-float" size={48} />
                <p className="text-ash font-medium font-display tracking-widest">The crypt is empty. Summon a board.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;