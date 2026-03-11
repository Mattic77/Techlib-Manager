import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Book, 
  Download, 
  Search,
  BookOpen,
  Library,
  Terminal,
  Cpu,
  RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx } from 'clsx';
import { documentApi } from '../api';
import { Document } from '../types';
import { Link } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedDocs?: string[]; // Array of doc IDs
}

const ChatPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hello ${user?.username}! I'm your TechLib AI Librarian. I can help you find technical documentation, summarize complex topics, or recommend books from our collection. What are you looking for today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mentionedDocs, setMentionedDocs] = useState<Document[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchDocDetails = async (ids: string[]) => {
    try {
      const uniqueNewIds = ids.filter(id => !mentionedDocs.some(d => d.id === id));
      if (uniqueNewIds.length === 0) return;

      const newDocs: Document[] = [];
      for (const id of uniqueNewIds) {
        const res = await documentApi.get(id);
        newDocs.push(res.data);
      }
      setMentionedDocs(prev => [...prev, ...newDocs]);
    } catch (error) {
      console.error("Failed to fetch mentioned docs", error);
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';
    const assistantMessageIndex = messages.length + 1;
    
    // Add placeholder assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: textToSend, top_k: 5 })
      });

      if (!response.ok) throw new Error('Failed to fetch AI response');

      // Extract suggested docs from header
      const suggestedDocsHeader = response.headers.get('X-Matched-Docs');
      const suggestedDocIds = suggestedDocsHeader ? JSON.parse(suggestedDocsHeader) : [];
      if (suggestedDocIds.length > 0) {
        fetchDocDetails(suggestedDocIds);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;
          
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { 
              ...updated[updated.length - 1], 
              content: assistantContent,
              suggestedDocs: suggestedDocIds
            };
            return updated;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error connecting to the AI service. Please make sure the local LLM is running." 
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Search Python books", icon: Terminal },
    { label: "Summarize Microservices", icon: Cpu },
    { label: "Cloud architecture guide", icon: Library },
    { label: "Frontend best practices", icon: Search },
  ];

  const exportChat = () => {
    const chatContent = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const element = document.createElement("a");
    const file = new Blob([chatContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `techlib-chat-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-900 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-300" />
            </div>
            <div>
              <h2 className="font-bold text-primary-900 leading-none">TechLib Assistant</h2>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                AI Online (qwen2.5:0.5b)
              </p>
            </div>
          </div>
          <button 
            onClick={exportChat}
            className="p-2 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-primary-600"
            title="Export Conversation"
          >
            <Download className="w-5 h-5" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={clsx(
              "flex gap-4",
              msg.role === 'user' ? "flex-row-reverse" : "flex-row"
            )}>
              <div className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1",
                msg.role === 'user' ? "bg-primary-100 text-primary-700" : "bg-primary-900 text-primary-300"
              )}>
                {msg.role === 'user' ? <BookOpen className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              
              <div className={clsx(
                "max-w-[80%] space-y-4",
                msg.role === 'user' ? "items-end text-right" : "items-start"
              )}>
                <div className={clsx(
                  "px-5 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary-600 text-white rounded-tr-none" 
                    : "bg-gray-100 text-primary-900 rounded-tl-none shadow-sm"
                )}>
                  <ReactMarkdown className="prose prose-sm prose-primary max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {/* Suggested Docs in Message */}
                {msg.role === 'assistant' && msg.suggestedDocs && msg.suggestedDocs.length > 0 && !isLoading && (
                   <div className="flex flex-wrap gap-2 mt-2">
                      <p className="text-[10px] font-bold text-gray-400 w-full mb-1 uppercase">Related Documentation</p>
                      {msg.suggestedDocs.slice(0, 3).map(id => {
                        const doc = mentionedDocs.find(d => d.id === id);
                        return doc ? (
                          <Link 
                            key={id}
                            to={`/document/${id}`}
                            className="bg-white border border-gray-200 px-3 py-2 rounded-xl flex items-center gap-2 hover:border-primary-500 transition-all group"
                          >
                            <Book className="w-3 h-3 text-primary-400 group-hover:text-primary-600" />
                            <span className="text-xs font-medium text-primary-900 truncate max-w-[150px]">{doc.title}</span>
                          </Link>
                        ) : null;
                      })}
                   </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-primary-900 flex items-center justify-center flex-shrink-0 mt-1">
                <RefreshCw className="w-4 h-4 text-primary-300 animate-spin" />
              </div>
              <div className="bg-gray-100 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-6 pt-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action.label)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 hover:border-primary-500 hover:text-primary-600 transition-all flex items-center gap-2 shadow-sm"
              >
                <action.icon className="w-3 h-3" />
                {action.label}
              </button>
            ))}
          </div>
          
          <div className="relative group">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask TechLib Assistant anything about our technical collection..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-6 pr-14 py-4 text-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-primary-900 text-white rounded-xl flex items-center justify-center hover:bg-primary-800 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mentioned Documents Sidebar */}
      <aside className="w-72 border-l border-gray-100 bg-gray-50/30 flex flex-col">
        <div className="p-6 border-b border-gray-100 bg-white">
          <h3 className="font-bold text-primary-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" />
            Context References
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest font-bold">
            {mentionedDocs.length} Documents found
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mentionedDocs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                As you chat, relevant books from our library will appear here for quick access.
              </p>
            </div>
          ) : (
            mentionedDocs.map(doc => (
              <Link 
                key={doc.id}
                to={`/document/${doc.id}`}
                className="block p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-primary-500 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-12 bg-primary-50 rounded flex items-center justify-center flex-shrink-0">
                    <Book className="w-5 h-5 text-primary-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-primary-900 leading-tight group-hover:text-primary-600 truncate">
                      {doc.title}
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{doc.author}</p>
                    <div className="flex items-center gap-1 mt-2">
                       <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold">
                         {doc.category}
                       </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-white">
          <button className="w-full py-3 bg-primary-50 text-primary-700 text-xs font-bold rounded-xl hover:bg-primary-100 transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download Summary Report
          </button>
        </div>
      </aside>
    </div>
  );
};

export default ChatPage;
