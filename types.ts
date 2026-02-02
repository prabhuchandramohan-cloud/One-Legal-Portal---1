
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface CaseFile {
  id: string;
  title: string;
  client: string;
  status: 'Active' | 'Pending' | 'Closed';
  type: 'Compliance' | 'Real Estate';
  category?: 'Fraud';
  description: string;
  lastUpdate: string;
}

export interface Task {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Done';
  assignee: string;
  dueDate: string;
}

export interface MortgageData {
  loanAmount: number;
  interestRate: number;
  loanTerm: number; // in years
  creditScore: number;
  monthlyIncome: number;
}

export enum AppModule {
  DASHBOARD = 'dashboard',
  MORTGAGE = 'mortgage',
  TOOLBOX = 'toolbox'
}

export type UserRole = 'Super Admin' | 'Admin' | 'Legal Officer' | 'Viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
}
