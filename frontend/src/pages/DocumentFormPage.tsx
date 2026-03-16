import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api';
import { 
  Save, 
  ArrowLeft, 
  Book, 
  Hash, 
  User, 
  Calendar, 
  Layers, 
  MapPin, 
  FileType, 
  TextQuote
} from 'lucide-react';

const DocumentFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publication_year: new Date().getFullYear(),
    category: 'Backend',
    summary: '',
    keywords: [] as string[],
    physical_location: '',
    digital_format: ''
  });

  const [keywordInput, setKeywordInput] = useState('');

  const { data: existingDoc, isLoading: fetchLoading } = useQuery({
    queryKey: ['admin-document', id],
    queryFn: () => documentApi.get(id!).then(res => res.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existingDoc) {
      setFormData({
        title: existingDoc.title || '',
        author: existingDoc.author || '',
        isbn: existingDoc.isbn || '',
        publication_year: existingDoc.publication_year || new Date().getFullYear(),
        category: existingDoc.category || 'Backend',
        summary: existingDoc.summary || '',
        keywords: existingDoc.keywords || [],
        physical_location: existingDoc.physical_location || '',
        digital_format: existingDoc.digital_format || ''
      });
    }
  }, [existingDoc]);

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit ? documentApi.update(id!, data) : documentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      alert(isEdit ? 'Document updated!' : 'Document created!');
      navigate('/admin/documents');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Operation failed');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({ ...prev, keywords: [...prev.keywords, keywordInput.trim()] }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }));
  };

  if (isEdit && fetchLoading) return <div className="p-12 text-center text-primary-500 animate-pulse">Loading document data...</div>;

  const categories = ["Cloud Computing", "Distributed Systems", "Frontend", "Backend", "DevOps", "Databases", "AI/ML", "Security", "Architecture", "Leadership"];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary-600 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight">
            {isEdit ? 'Edit Document' : 'Register New Document'}
          </h1>
          <p className="text-gray-500 mt-1">Provide detailed technical metadata for the catalog.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Document Title</label>
            <div className="relative">
              <Book className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all font-bold"
                placeholder="e.g. Designing Data-Intensive Applications"
                required
              />
            </div>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Primary Author</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="Author name"
              />
            </div>
          </div>

          {/* ISBN */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">ISBN / Identifier</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={formData.isbn}
                onChange={e => setFormData({ ...formData, isbn: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="Unique ID"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Knowledge Domain</label>
            <div className="relative">
              <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Publication Year</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="number"
                value={formData.publication_year}
                onChange={e => setFormData({ ...formData, publication_year: parseInt(e.target.value) })}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Physical Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={formData.physical_location}
                onChange={e => setFormData({ ...formData, physical_location: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="e.g. Shelf 4B"
              />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Digital Format</label>
            <div className="relative">
              <FileType className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={formData.digital_format}
                onChange={e => setFormData({ ...formData, digital_format: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="PDF, EPUB, etc."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Technical Summary</label>
            <div className="relative">
              <TextQuote className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
              <textarea 
                value={formData.summary}
                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                className="w-full pl-11 pr-4 py-4 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all min-h-[150px]"
                placeholder="Detailed description for the AI Assistant context..."
                required
              />
            </div>
          </div>

          {/* Keywords */}
          <div className="md:col-span-2 space-y-4">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Extracted Keywords</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                className="flex-1 px-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                placeholder="Add tag..."
              />
              <button 
                type="button"
                onClick={addKeyword}
                className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map(kw => (
                <span key={kw} className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-bold rounded-lg flex items-center gap-2">
                  {kw}
                  <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-50">
          <button 
            type="submit"
            disabled={mutation.isPending}
            className="w-full md:w-auto px-10 py-4 bg-primary-900 text-white font-bold rounded-2xl shadow-lg shadow-primary-900/20 hover:bg-primary-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isEdit ? 'Save Changes' : 'Register Document'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentFormPage;
