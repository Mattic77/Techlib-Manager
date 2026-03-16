import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanApi } from '../api';
import { Loan, LoanStatus } from '../types';
import { 
  History, 
  User, 
  Book, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  RotateCcw,
  Search
} from 'lucide-react';
import { clsx } from 'clsx';

const LoanManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');

  const { data: loans, isLoading } = useQuery({
    queryKey: ['admin-loans'],
    queryFn: () => loanApi.list().then(res => res.data as Loan[]),
  });

  const returnMutation = useMutation({
    mutationFn: (loanId: string) => loanApi.return(loanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
      alert('Book returned successfully!');
    },
  });

  const filteredLoans = loans?.filter(l => 
    l.document?.title.toLowerCase().includes(search.toLowerCase()) ||
    l.user_id.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-primary-900 tracking-tight flex items-center gap-3">
          <History className="w-8 h-8 text-primary-600" />
          Loan & Circulation Tracking
        </h1>
        <p className="text-gray-500 mt-1">Monitor active loans, handle returns, and identify overdue items.</p>
      </header>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by book title or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Document</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Borrower</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Due Date</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">Loading data...</td></tr>
              ) : filteredLoans.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">No loan records found.</td></tr>
              ) : (
                filteredLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Book className="w-4 h-4 text-primary-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-primary-900 truncate max-w-xs">{loan.document?.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium">ID: {loan.document_id.slice(0,8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{loan.user_id.slice(0,12)}...</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        loan.status === LoanStatus.ACTIVE && "bg-orange-100 text-orange-700",
                        loan.status === LoanStatus.RETURNED && "bg-green-100 text-green-700",
                        loan.status === LoanStatus.OVERDUE && "bg-red-100 text-red-700"
                      )}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className={clsx(
                        "flex items-center gap-2 text-xs font-bold",
                        loan.status === LoanStatus.ACTIVE && new Date(loan.due_date) < new Date() ? "text-red-600" : "text-gray-500"
                      )}>
                        <Calendar className="w-3 h-3" />
                        {new Date(loan.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status === LoanStatus.ACTIVE && (
                        <button 
                          onClick={() => returnMutation.mutate(loan.id)}
                          disabled={returnMutation.isPending}
                          className="px-4 py-2 bg-primary-900 text-white text-xs font-bold rounded-xl hover:bg-primary-800 transition-colors flex items-center gap-2 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanManagementPage;
