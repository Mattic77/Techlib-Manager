import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentApi } from '../api';
import { Document } from '../types';
import BookCard from '../components/Dashboard/BookCard';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const CatalogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', category, search],
    queryFn: () => documentApi.list({ category, q: search }).then(res => res.data as Document[]),
  });

  const categories = ["Cloud Computing", "Distributed Systems", "Frontend", "Backend", "DevOps", "AI/ML"];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight">Technical Catalog</h1>
          <p className="text-gray-500 mt-1">Explore our complete collection of technical documentation and books.</p>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          <button 
            onClick={() => setCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!category ? 'bg-primary-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${category === cat ? 'bg-primary-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : documents?.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Search className="w-8 h-8 text-gray-200" />
           </div>
           <h3 className="text-lg font-bold text-primary-900">No documents found</h3>
           <p className="text-gray-500 mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {documents?.map(doc => (
            <BookCard key={doc.id} book={doc} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
