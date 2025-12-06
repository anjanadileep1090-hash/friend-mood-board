export type ItemType = 'text' | 'image' | 'color' | 'sticker';

export interface BoardItem {
  id: string;
  type: ItemType;
  content: string; // Text content, Image URL, or Hex Code
  style: {
    rotation: number;
    scale: number;
    backgroundColor?: string;
    textColor?: string;
    zIndex: number;
    fontFamily?: 'sans' | 'hand';
    gridSpan?: '1x1' | '1x2' | '2x1' | '2x2';
  };
}

export interface Board {
  id: string;
  friendName: string;
  description: string;
  items: BoardItem[];
  themeColors: string[];
  createdAt: number;
}

export interface AIPromptResponse {
  colors: string[];
  items: {
    type: ItemType;
    content: string;
    gridSpan?: '1x1' | '1x2' | '2x1' | '2x2';
  }[];
}