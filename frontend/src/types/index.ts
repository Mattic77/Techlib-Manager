export enum UserRole {
  READER = 'reader',
  LIBRARIAN = 'librarian',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  publication_year: number | null;
  category: string | null;
  summary: string | null;
  keywords: string[];
  physical_location: string | null;
  digital_format: string | null;
  availability: boolean;
  created_at: string;
  updated_at: string;
}

export enum LoanStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
}

export interface Loan {
  id: string;
  document_id: string;
  user_id: string;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  status: LoanStatus;
}
