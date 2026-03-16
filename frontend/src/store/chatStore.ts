import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Document } from '../types';

interface ChatState {
  messages: Message[];
  mentionedDocs: Document[];
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, suggestedDocs?: string[]) => void;
  setMentionedDocs: (docs: Document[]) => void;
  addMentionedDocs: (docs: Document[]) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      mentionedDocs: [],
      addMessage: (message) => 
        set((state) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (content, suggestedDocs) => 
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = { 
              ...newMessages[newMessages.length - 1], 
              content,
              suggestedDocs: suggestedDocs || newMessages[newMessages.length - 1].suggestedDocs
            };
          }
          return { messages: newMessages };
        }),
      setMentionedDocs: (docs) => set({ mentionedDocs: docs }),
      addMentionedDocs: (newDocs) => 
        set((state) => {
          const existingIds = new Set(state.mentionedDocs.map(d => d.id));
          const uniqueNewDocs = newDocs.filter(d => !existingIds.has(d.id));
          return { mentionedDocs: [...state.mentionedDocs, ...uniqueNewDocs] };
        }),
      clearChat: () => set({ messages: [], mentionedDocs: [] }),
    }),
    {
      name: 'chat-storage',
    }
  )
);
