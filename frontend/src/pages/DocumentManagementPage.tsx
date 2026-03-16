import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApi } from '../api';
import { Document } from '../types';
import { 
  Library, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Archive, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Hash,
  MapPin,
  Tag
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

const DocumentManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-documents', search, showArchived],
    queryFn: () => documentApi.list({ q: search, include_archived: showArchived }).then(res => res.data as Document[]),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => documentApi.toggleArchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      alert('Document archived (soft-deleted).');
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight flex items-center gap-3">
            <Library className="w-8 h-8 text-primary-600" />
            Inventory Management
          </h1>
          <p className="text-gray-500 mt-1">Add, update, and manage your library's document collection.</p>
        </div>
        <Link 
          to="/admin/documents/new"
          className="px-6 py-3 bg-primary-900 text-white font-bold rounded-xl shadow-lg shadow-primary-900/20 hover:bg-primary-800 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Book
        </Link>
      </header>

      {/* Toolbar */}
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
        <button 
          onClick={() => setShowArchived(!showArchived)}
          className={clsx(
            "px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            showArchived ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          <Archive className="w-4 h-4" />
          {showArchived ? "Hiding Active" : "Show Archived"}
        </button>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 animate-pulse">Scanning database...</div>
        ) : documents?.length === 0 ? (
          <div className="p-12 text-center text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
            No documents found matching your criteria.
          </div>
        ) : (
          documents?.map(doc => (
            <div 
              key={doc.id} 
              className={clsx(
                "bg-white p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6 transition-all",
                doc.archived ? "opacity-60 border-gray-100 bg-gray-50/50" : "border-gray-100 hover:border-primary-200"
              )}
            >
              <div className="w-16 h-20 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
                <Library className="w-8 h-8 text-primary-300" />
              </div>
              
              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                  <h3 className="font-bold text-primary-900 truncate max-w-md">{doc.title}</h3>
                  {doc.archived && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[9px] font-bold uppercase">Archived</span>
                  )}
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                    doc.availability ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  )}>
                    {doc.availability ? "Available" : "Borrowed"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mb-3">{doc.author} • {doc.category}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <Hash className="w-3 h-3" />
                    {doc.isbn || 'No ISBN'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <MapPin className="w-3 h-3" />
                    {doc.physical_location || 'N/A'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    {doc.digital_format || 'Physical'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link 
                  to={`/document/${doc.id}`}
                  className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all"
                  title="View Public Page"
                >
                  <Eye className="w-5 h-5" />
                </Link>
                <Link 
                  to={`/admin/documents/edit/${doc.id}`}
                  className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                  title="Edit Metadata"
                >
                  <Edit className="w-5 h-5" />
                </Link>
                <button 
                  onClick={() => archiveMutation.mutate(doc.id)}
                  className={clsx(
                    "p-3 rounded-xl transition-all",
                    doc.archived ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                  )}
                  title={doc.archived ? "Restore Document" : "Archive Document"}
                >
                  <Archive className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DocumentManagementPage;
