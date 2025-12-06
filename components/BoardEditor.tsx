import React, { useState, useRef } from 'react';
import { Board, BoardItem, ItemType } from '../types';
import { MoodItem } from './MoodItem';
import { ArrowLeft, Plus, Wand2, Image as ImageIcon, Type as TypeIcon, Smile, Palette, Save, Share2, X, Link as LinkIcon, Facebook, Twitter } from 'lucide-react';
import { generateSingleItem } from '../services/geminiService';

interface BoardEditorProps {
  board: Board;
  onSave: (board: Board) => void;
  onBack: () => void;
}

const getRandomRotation = () => Math.random() * 6 - 3; // -3 to 3 degrees
const getRandomScale = () => 0.98 + Math.random() * 0.04;

export const BoardEditor: React.FC<BoardEditorProps> = ({ board, onSave, onBack }) => {
  const [currentBoard, setCurrentBoard] = useState<Board>(board);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateItem = (id: string, updates: Partial<BoardItem['style']>) => {
    const newItems = currentBoard.items.map(item => 
      item.id === id ? { ...item, style: { ...item.style, ...updates } } : item
    );
    const updatedBoard = { ...currentBoard, items: newItems };
    setCurrentBoard(updatedBoard);
    onSave(updatedBoard); // Auto-save logic can be debounced in a real app
  };

  const handleDeleteItem = (id: string) => {
    const newItems = currentBoard.items.filter(i => i.id !== id);
    const updatedBoard = { ...currentBoard, items: newItems };
    setCurrentBoard(updatedBoard);
    onSave(updatedBoard);
    setSelectedItemId(null);
  };

  const addItem = (type: ItemType, content: string, extraStyle = {}) => {
    const newItem: BoardItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      content,
      style: {
        rotation: getRandomRotation(),
        scale: getRandomScale(),
        backgroundColor: type === 'color' ? content : (type === 'text' ? '#dcd0c0' : undefined),
        textColor: type === 'text' ? '#000' : undefined,
        zIndex: 1,
        gridSpan: '1x1',
        ...extraStyle
      }
    };
    const updatedBoard = { ...currentBoard, items: [...currentBoard.items, newItem] };
    setCurrentBoard(updatedBoard);
    onSave(updatedBoard);
    setShowAddMenu(false);
  };

  const handleAiItem = async () => {
    if (!aiPrompt) return;
    setIsAiLoading(true);
    const result = await generateSingleItem(aiPrompt, 'text');
    if (result) {
        addItem('text', result, { fontFamily: 'hand', backgroundColor: '#dcd0c0' });
    }
    setIsAiLoading(false);
    setAiPrompt('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  addItem('image', event.target.result as string, { gridSpan: '2x2' });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSocialShare = (platform: string) => {
      const url = window.location.href;
      const text = `Check out this mood board for ${currentBoard.friendName} on FriendFolk!`;
      
      let shareUrl = '';
      if (platform === 'twitter') {
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      } else if (platform === 'facebook') {
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      }

      if (shareUrl) {
          window.open(shareUrl, '_blank', 'width=600,height=400');
          setShowShareModal(false);
      }
  };

  const copyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!"); // Simple feedback
      setShowShareModal(false);
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-coffin/90 backdrop-blur-md border-b border-blood/20 px-6 py-4 flex items-center justify-between shadow-lg animate-fade-in-up" style={{ animationDuration: '0.4s' }}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-ash hover:text-blood" />
          </button>
          <div>
            <h1 className="font-bold text-xl text-bone font-display tracking-wide">{currentBoard.friendName}</h1>
            <p className="text-xs text-ash/70 truncate max-w-[200px] font-sans italic">{currentBoard.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2 mr-4 hidden sm:flex">
                {currentBoard.themeColors.map((c, i) => (
                    <div key={i} className="w-6 h-6 rounded-full border border-coffin shadow-sm" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            
            <button
                onClick={() => setShowShareModal(true)}
                className="bg-paper border border-blood/50 text-blood hover:bg-blood hover:text-white px-3 py-2 rounded-sm transition-all hover:shadow-[0_0_10px_rgba(138,3,3,0.3)]"
                title="Spread the Curse"
            >
                <Share2 size={18} />
            </button>

            <button 
                onClick={() => onSave(currentBoard)}
                className="bg-blood text-white px-4 py-2 rounded-sm text-sm font-medium flex items-center gap-2 hover:bg-crimson transition-colors font-display tracking-wider hover:shadow-[0_0_15px_rgba(138,3,3,0.4)]"
            >
                <Save size={16} />
                <span className="hidden sm:inline">PRESERVE</span>
            </button>
        </div>
      </header>

      {/* Canvas */}
      <main 
        className="flex-1 p-6 md:p-10 overflow-y-auto"
        onClick={() => setSelectedItemId(null)}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 auto-rows-[150px] gap-6 pb-20">
          {currentBoard.items.map((item, index) => (
            <MoodItem
              key={item.id}
              item={item}
              index={index}
              isSelected={selectedItemId === item.id}
              onSelect={setSelectedItemId}
              onDelete={handleDeleteItem}
              onUpdate={handleUpdateItem}
            />
          ))}
          
          {/* Add Button Tile */}
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="col-span-1 row-span-1 border border-dashed border-blood/30 rounded-lg flex flex-col items-center justify-center text-blood/50 hover:text-blood hover:border-blood hover:bg-coffin/50 transition-all gap-2 group bg-transparent animate-fade-in-up"
            style={{ animationDelay: `${currentBoard.items.length * 50}ms` }}
          >
             <Plus size={32} className="group-hover:scale-110 transition-transform group-hover:rotate-90 duration-300"/>
             <span className="text-sm font-medium font-display tracking-widest">SUMMON</span>
          </button>
        </div>
      </main>

      {/* Floating Toolbar / Add Menu */}
      {showAddMenu && (
        <div className="fixed bottom-24 right-6 md:right-10 bg-coffin shadow-[0_0_30px_rgba(0,0,0,0.5)] rounded-lg p-4 w-72 border border-blood/30 animate-in slide-in-from-bottom-5 z-50">
            <h3 className="text-sm font-bold text-ash mb-3 uppercase tracking-widest font-display text-center">Artifacts</h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
                <button 
                    onClick={() => addItem('text', 'New Note', { fontFamily: 'hand', backgroundColor: '#dcd0c0' })}
                    className="flex flex-col items-center justify-center p-3 bg-paper border border-white/5 rounded hover:bg-white/5 hover:text-gold transition-colors text-ash"
                >
                    <TypeIcon size={20} className="mb-1" />
                    <span className="text-xs font-medium font-display">Script</span>
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-3 bg-paper border border-white/5 rounded hover:bg-white/5 hover:text-blue-400 transition-colors text-ash"
                >
                    <ImageIcon size={20} className="mb-1" />
                    <span className="text-xs font-medium font-display">Portrait</span>
                </button>
                <button 
                    onClick={() => addItem('sticker', '🦇', { rotation: 10 })}
                    className="flex flex-col items-center justify-center p-3 bg-paper border border-white/5 rounded hover:bg-white/5 hover:text-pink-400 transition-colors text-ash"
                >
                    <Smile size={20} className="mb-1" />
                    <span className="text-xs font-medium font-display">Glyph</span>
                </button>
                <button 
                     onClick={() => addItem('color', currentBoard.themeColors[0] || '#8a0303')}
                    className="flex flex-col items-center justify-center p-3 bg-paper border border-white/5 rounded hover:bg-white/5 hover:text-purple-400 transition-colors text-ash"
                >
                    <Palette size={20} className="mb-1" />
                    <span className="text-xs font-medium font-display">Essence</span>
                </button>
            </div>

            <div className="border-t border-white/10 pt-3">
                 <label className="text-xs font-bold text-blood mb-2 block flex items-center gap-1 font-display tracking-wider">
                    <Wand2 size={12} />
                    Dark Whispers (AI)
                 </label>
                 <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. vampire joke..."
                        className="flex-1 bg-paper border border-blood/30 rounded px-2 py-1.5 text-sm text-bone focus:border-blood outline-none placeholder:text-gray-700"
                     />
                     <button 
                        onClick={handleAiItem}
                        disabled={isAiLoading || !aiPrompt}
                        className="bg-blood text-white rounded px-3 py-1.5 disabled:opacity-50 hover:bg-crimson transition-colors"
                     >
                         {isAiLoading ? '...' : <Wand2 size={14} />}
                     </button>
                 </div>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-coffin border border-blood/50 p-6 rounded-lg shadow-[0_0_50px_rgba(138,3,3,0.2)] max-w-xs w-full relative">
                <button
                    onClick={() => setShowShareModal(false)}
                    className="absolute top-3 right-3 text-ash hover:text-blood transition-colors"
                >
                    <X size={20} />
                </button>
                <h3 className="text-xl font-display text-blood mb-6 text-center tracking-widest border-b border-blood/20 pb-2">Spread the Curse</h3>
                <div className="space-y-3">
                    <button 
                        onClick={() => handleSocialShare('twitter')} 
                        className="w-full flex items-center justify-center gap-3 p-3 bg-paper border border-white/5 rounded hover:border-blue-400/50 hover:text-blue-400 hover:shadow-inner transition-all group"
                    >
                        <Twitter size={18} className="group-hover:scale-110 transition-transform" /> 
                        <span className="font-sans text-sm font-medium">Twitter</span>
                    </button>
                    <button 
                        onClick={() => handleSocialShare('facebook')} 
                        className="w-full flex items-center justify-center gap-3 p-3 bg-paper border border-white/5 rounded hover:border-blue-600/50 hover:text-blue-600 hover:shadow-inner transition-all group"
                    >
                        <Facebook size={18} className="group-hover:scale-110 transition-transform" /> 
                        <span className="font-sans text-sm font-medium">Facebook</span>
                    </button>
                    <button 
                        onClick={copyLink} 
                        className="w-full flex items-center justify-center gap-3 p-3 bg-paper border border-white/5 rounded hover:border-gold/50 hover:text-gold hover:shadow-inner transition-all group"
                    >
                        <LinkIcon size={18} className="group-hover:scale-110 transition-transform" /> 
                        <span className="font-sans text-sm font-medium">Copy Link</span>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};