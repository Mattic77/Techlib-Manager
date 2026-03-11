import React from 'react';
import { Document } from '../../types';
import { Book, ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BookCardProps {
  book: Document;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-40 bg-primary-100 flex items-center justify-center relative group-hover:bg-primary-200 transition-colors">
        <Book className="w-16 h-16 text-primary-400 opacity-50" />
        <div className="absolute inset-0 bg-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        {book.digital_format && (
          <span className="absolute top-3 right-3 bg-white/90 px-2 py-1 rounded text-[10px] font-bold text-primary-700 shadow-sm">
            {book.digital_format}
          </span>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">
            {book.category}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            book.availability 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {book.availability ? 'Available' : 'Borrowed'}
          </span>
        </div>
        
        <h3 className="font-bold text-primary-900 leading-tight mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
          {book.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3 truncate">{book.author}</p>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center text-[10px] text-gray-400">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate max-w-[80px]">{book.physical_location}</span>
          </div>
          <Link 
            to={`/document/${book.id}`}
            className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center gap-1"
          >
            Details
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
