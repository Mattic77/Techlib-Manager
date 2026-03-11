import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi, aiApi, loanApi } from '../api';
import { 
  Book, 
  Calendar, 
  Tag, 
  Hash, 
  MapPin, 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserRole, Document } from '../types';
import { clsx } from 'clsx';

const DocumentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'ai'>('summary');
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: () => documentApi.get(id!).then(res => res.data as Document),
  });

  const { data: aiInsight, isLoading: insightLoading } = useQuery({
    queryKey: ['ai-summary', id],
    queryFn: () => aiApi.getSummary(id!).then(res => res.data),
    enabled: activeTab === 'ai' && !!id,
  });

  const borrowMutation = useMutation({
    mutationFn: () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 2 weeks
      return loanApi.create({ document_id: id!, due_date: dueDate.toISOString() });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      alert('Book borrowed successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to borrow book');
    }
  });

  if (isLoading) return <div className="p-8 animate-pulse text-primary-500">Loading document details...</div>;
  if (!document) return <div className="p-8 text-red-500">Document not found.</div>;

  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'details', label: 'Technical Details', icon: Tag },
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-primary-600 transition-colors">Dashboard</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/catalog" className="hover:text-primary-600 transition-colors">Catalog</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-primary-900 font-medium truncate max-w-[200px]">{document.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 h-64 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner">
              <Book className="w-20 h-20 text-primary-300" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-bold uppercase tracking-wide">
                  {document.category}
                </span>
                {document.digital_format && (
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {document.digital_format}
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-extrabold text-primary-900 leading-tight">
                {document.title}
              </h1>
              
              <p className="text-xl text-gray-500 font-medium">{document.author}</p>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  <span>Published: {document.publication_year}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="w-4 h-4 text-primary-400" />
                  <span>ISBN: {document.isbn || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2",
                    activeTab === tab.id 
                      ? "border-primary-600 text-primary-600 bg-white" 
                      : "border-transparent text-gray-500 hover:text-primary-400 hover:bg-gray-50"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8 min-h-[300px]">
              {activeTab === 'summary' && (
                <div className="prose prose-primary max-w-none">
                  <h3 className="text-lg font-bold text-primary-900 mb-4">Book Description</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {document.summary || "No description available for this document."}
                  </p>
                  
                  {document.keywords && document.keywords.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {document.keywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Physical Location</p>
                      <div className="flex items-center gap-2 text-primary-900 font-bold">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        {document.physical_location || 'Digital Only'}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Internal Reference ID</p>
                      <div className="flex items-center gap-2 text-primary-900 font-bold">
                        <Hash className="w-4 h-4 text-primary-500" />
                        {document.id.split('-')[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Added to Library</p>
                      <div className="flex items-center gap-2 text-primary-900 font-bold">
                        <Clock className="w-4 h-4 text-primary-500" />
                        {new Date(document.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ai' && (
                <div className="space-y-8">
                  <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Sparkles className="w-24 h-24 text-indigo-600" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-indigo-900">AI-Generated Analysis</h3>
                      </div>
                      
                      {insightLoading ? (
                        <div className="space-y-3">
                          <div className="h-4 bg-indigo-200/50 animate-pulse rounded w-3/4" />
                          <div className="h-4 bg-indigo-200/50 animate-pulse rounded w-full" />
                          <div className="h-4 bg-indigo-200/50 animate-pulse rounded w-5/6" />
                        </div>
                      ) : (
                        <p className="text-indigo-900/80 leading-relaxed whitespace-pre-line">
                          {aiInsight?.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-primary-900 mb-4 flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-green-500" />
                       Extracted Technical Concepts
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                       {document.keywords.map((kw, i) => (
                         <div key={i} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm text-xs font-bold text-primary-700 hover:border-primary-300 transition-colors cursor-default">
                           {kw}
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 sticky top-24">
            <div className="mb-6">
              <div className={clsx(
                "flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold mb-4",
                document.availability 
                  ? "bg-green-50 text-green-700 border border-green-100" 
                  : "bg-red-50 text-red-700 border border-red-100"
              )}>
                {document.availability ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Available in Library
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    Currently Borrowed
                  </>
                )}
              </div>
              
              <p className="text-xs text-center text-gray-500 px-4">
                {document.availability 
                  ? "You can borrow this technical book for up to 14 days." 
                  : "This book is currently with another reader. You can place a reservation."}
              </p>
            </div>

            <div className="space-y-3">
              {document.availability ? (
                <button 
                  onClick={() => borrowMutation.mutate()}
                  disabled={borrowMutation.isPending}
                  className="w-full bg-primary-900 hover:bg-primary-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Borrow Physical Copy
                </button>
              ) : (
                <button className="w-full bg-white border-2 border-primary-900 text-primary-900 font-bold py-4 rounded-2xl hover:bg-primary-50 transition-all flex items-center justify-center gap-2">
                  Place Reservation
                </button>
              )}
              
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-primary-900 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Preview Digital Version
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Library Info</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Inventory ID:</span>
                  <span className="font-bold text-primary-900">{document.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-bold text-primary-900">{document.physical_location || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Copies:</span>
                  <span className="font-bold text-primary-900">1 (Limited Edition)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Librarian Controls */}
          {(user?.role === UserRole.LIBRARIAN || user?.role === UserRole.ADMIN) && (
            <div className="bg-red-50 rounded-3xl p-6 border border-red-100 space-y-4">
              <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                Librarian Controls
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button className="w-full bg-white border border-red-200 text-red-600 py-3 rounded-xl text-xs font-bold hover:bg-red-100 transition-all">
                  Edit Metadata
                </button>
                <button className="w-full bg-red-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-red-700 transition-all">
                  Archive Document
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentPage;
