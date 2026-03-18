import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, Document } from '../types';

interface ChatSession {
  messages: Message[];
  mentionedDocs: Document[];
}

interface ChatState {
  userId: string | null;
  messages: Message[];
  mentionedDocs: Document[];
  sessions: Record<string, ChatSession>;
  setUserId: (userId: string | null) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string, suggestedDocs?: string[]) => void;
  setMentionedDocs: (docs: Document[]) => void;
  addMentionedDocs: (docs: Document[]) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      userId: null,
      messages: [],
      mentionedDocs: [],
      sessions: {},

      setUserId: (userId) => {
        const state = get();
        if (state.userId === userId) return;

        // Save current session before switching
        const sessions = { ...state.sessions };
        if (state.userId) {
          sessions[state.userId] = {
            messages: state.messages,
            mentionedDocs: state.mentionedDocs,
          };
        }

        // Load new session
        const nextSession = userId ? sessions[userId] : null;

        set({
          userId,
          messages: nextSession?.messages || [],
          mentionedDocs: nextSession?.mentionedDocs || [],
          sessions,
        });
      },

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateLastMessage: (content, suggestedDocs) =>
        set((state) => {
          const newMessages = [...state.messages];
          if (newMessages.length > 0) {
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content,
              suggestedDocs: suggestedDocs || newMessages[newMessages.length - 1].suggestedDocs,
            };
          }
          return { messages: newMessages };
        }),

      setMentionedDocs: (docs) => set({ mentionedDocs: docs }),

      addMentionedDocs: (newDocs) =>
        set((state) => {
          const existingIds = new Set(state.mentionedDocs.map((d) => d.id));
          const uniqueNewDocs = newDocs.filter((d) => !existingIds.has(d.id));
          return { mentionedDocs: [...state.mentionedDocs, ...uniqueNewDocs] };
        }),

      clearChat: () => set({ messages: [], mentionedDocs: [] }),
    }),
    {
      name: 'chat-storage',
      // Ensure we don't persist current messages/docs twice if they are already in sessions
      // Actually, persisting them as is is fine for quick reload.
    }
  )
);
