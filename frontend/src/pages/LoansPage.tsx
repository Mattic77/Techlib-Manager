import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanApi } from '../api';
import { Loan, LoanStatus } from '../types';
import { 
  Book, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeftRight,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

const LoansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: loans, isLoading } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => loanApi.myLoans().then(res => res.data as Loan[]),
  });

  const returnMutation = useMutation({
    mutationFn: (loanId: string) => loanApi.return(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-loans'] });
      alert('Book returned successfully!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Failed to return book');
    }
  });

  if (isLoading) return <div className="p-8 animate-pulse text-primary-500">Loading your loans...</div>;

  const activeLoans = loans?.filter(l => l.status === LoanStatus.ACTIVE) || [];
  const returnedLoans = loans?.filter(l => l.status === LoanStatus.RETURNED) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight">My Loans</h1>
        <p className="text-gray-500 mt-1">Manage your borrowed technical documents and track due dates.</p>
      </header>

      {/* Active Loans Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          Currently Borrowed ({activeLoans.length})
        </h2>
        
        {activeLoans.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">You don't have any active loans.</p>
            <Link to="/" className="text-primary-600 text-sm font-bold mt-2 inline-block hover:underline">
              Browse the catalog to borrow books
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoans.map(loan => (
              <div key={loan.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-primary-200 transition-all flex flex-col justify-between group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-16 bg-primary-50 rounded-lg flex items-center justify-center shadow-inner">
                      <Book className="w-6 h-6 text-primary-300" />
                    </div>
                    <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-orange-100">
                      Due {new Date(loan.due_date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <Link to={`/document/${loan.document_id}`} className="block group-hover:text-primary-600 transition-colors">
                    <h3 className="font-bold text-primary-900 leading-tight mb-1">{loan.document?.title}</h3>
                    <p className="text-xs text-gray-500 font-medium">{loan.document?.author}</p>
                  </Link>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Borrowed On</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Return By</div>
                    <div className="text-xs font-bold text-primary-800">{new Date(loan.loan_date).toLocaleDateString()}</div>
                    <div className="text-xs font-bold text-orange-600">{new Date(loan.due_date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <Link 
                    to={`/document/${loan.document_id}`}
                    className="text-xs font-bold text-primary-600 flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View Details <ChevronRight className="w-3 h-3" />
                  </Link>
                  <button 
                    onClick={() => returnMutation.mutate(loan.id)}
                    disabled={returnMutation.isPending}
                    className="px-4 py-2 bg-primary-900 text-white text-xs font-bold rounded-xl hover:bg-primary-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Return Book
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* History Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary-900 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-primary-500" />
          Loan History ({returnedLoans.length})
        </h2>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {returnedLoans.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm font-medium">
              No previous loan history found.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {returnedLoans.map(loan => (
                <div key={loan.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-primary-900">{loan.document?.title}</h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Returned on {loan.return_date ? new Date(loan.return_date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Link 
                    to={`/document/${loan.document_id}`}
                    className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-400 hover:text-primary-600"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LoansPage;
