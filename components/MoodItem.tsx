import React from 'react';
import { BoardItem } from '../types';
import { X, Move, Type, Palette } from 'lucide-react';

interface MoodItemProps {
  item: BoardItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BoardItem['style']>) => void;
  index: number;
}

export const MoodItem: React.FC<MoodItemProps> = ({ item, isSelected, onSelect, onDelete, onUpdate, index }) => {
  const getSpanClass = (span?: string) => {
    switch (span) {
      case '1x2': return 'row-span-2';
      case '2x1': return 'col-span-2';
      case '2x2': return 'col-span-2 row-span-2';
      default: return 'col-span-1 row-span-1';
    }
  };

  const baseClasses = `
    relative group transition-all duration-300 ease-out
    ${getSpanClass(item.style.gridSpan)}
    flex items-center justify-center p-4 overflow-hidden
    cursor-pointer rounded-sm shadow-md hover:shadow-xl hover:shadow-blood/20
    border-2 animate-fade-in-up opacity-0
  `;

  // Default parchment color for text items if not specified
  const bgColor = item.type === 'text' && !item.style.backgroundColor 
    ? '#dcd0c0' 
    : (item.style.backgroundColor || '#ffffff');
    
  const textColor = item.type === 'text' && !item.style.textColor 
    ? '#000000' 
    : (item.style.textColor || '#000000');

  // Dynamic inline styles for rotation and scale to give "collage" feel
  const transformStyle = {
    transform: `rotate(${item.style.rotation}deg) scale(${isSelected ? 1.05 : item.style.scale})`,
    backgroundColor: bgColor,
    borderColor: isSelected ? '#8a0303' : 'transparent',
    color: textColor,
    fontFamily: item.style.fontFamily === 'hand' ? '"Nosifer", cursive' : '"Crimson Pro", serif',
    zIndex: isSelected ? 50 : 10,
    animationDelay: `${index * 50}ms`,
  };

  return (
    <div 
      className={baseClasses}
      style={transformStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item.id);
      }}
    >
      {/* Content Rendering */}
      {item.type === 'text' && (
        <p className="text-center font-bold text-lg md:text-xl leading-tight break-words w-full drop-shadow-sm">
          {item.content}
        </p>
      )}

      {item.type === 'sticker' && (
        <div className="text-6xl md:text-8xl select-none animate-float drop-shadow-md">
          {item.content}
        </div>
      )}

      {item.type === 'image' && (
        <div className="w-full h-full relative p-1 bg-white shadow-inner">
            <img 
            src={item.content} 
            alt="Mood" 
            className="w-full h-full object-cover rounded-[1px] pointer-events-none filter sepia-[.4] contrast-125 brightness-90 hover:sepia-0 hover:brightness-100 transition-all duration-700"
            />
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent pointer-events-none mix-blend-overlay"></div>
        </div>
      )}

      {item.type === 'color' && (
        <div className="w-full h-full flex items-end justify-start p-2">
            <span className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono uppercase text-white border border-white/10">
                {item.content}
            </span>
        </div>
      )}

      {/* Edit Controls (Visible when selected) */}
      {isSelected && (
        <div className="absolute -top-3 -right-3 flex gap-1 z-50 animate-fade-in-up" style={{animationDelay: '0ms'}}>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="bg-blood text-white p-1.5 rounded-full hover:bg-red-700 shadow-lg transition-transform hover:scale-110 border border-white/20"
          >
            <X size={14} />
          </button>
        </div>
      )}
      
      {isSelected && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-coffin border border-blood/30 p-1 rounded-full shadow-lg z-50 px-3 animate-fade-in-up" style={{animationDelay: '0ms'}}>
             <button 
                className="p-1 hover:bg-white/10 rounded-full text-bone transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    const next = item.style.fontFamily === 'sans' ? 'hand' : 'sans';
                    onUpdate(item.id, { fontFamily: next });
                }}
             >
                <Type size={14} />
             </button>
             <button 
                className="p-1 hover:bg-white/10 rounded-full text-bone transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    // Simple rotation cycle
                    const newRot = (item.style.rotation + 5) % 10; 
                    onUpdate(item.id, { rotation: newRot - 5 }); // Keep between -5 and 5 roughly
                }}
             >
                <Move size={14} />
             </button>
             <button 
                className="p-1 hover:bg-white/10 rounded-full text-bone transition-colors"
                onClick={(e) => {
                    e.stopPropagation();
                    const spans = ['1x1', '1x2', '2x1', '2x2'] as const;
                    const currentIdx = spans.indexOf(item.style.gridSpan || '1x1');
                    const nextSpan = spans[(currentIdx + 1) % spans.length];
                    onUpdate(item.id, { gridSpan: nextSpan });
                }}
             >
                 <div className="w-3 h-3 grid grid-cols-2 gap-[1px]">
                     <div className="bg-current rounded-[1px]"></div>
                     <div className="bg-current rounded-[1px]"></div>
                     <div className="bg-current rounded-[1px]"></div>
                     <div className="bg-current rounded-[1px] opacity-30"></div>
                 </div>
             </button>
          </div>
      )}
    </div>
  );
};