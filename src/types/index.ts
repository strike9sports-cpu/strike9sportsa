export type UserRole = 'SUPER_ADMIN' | 'SHAREHOLDER' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  passwordHash?: string; // For mock/credential auth demo
  canAddRevenue?: boolean; // For shareholders: whether Super Admin allows revenue creation
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareholderConfig {
  id: string;
  userId: string;
  name: string;
  ownershipPercentage: number; // e.g. 50
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  logoUrl: string;
  currency: string; // Default: 'INR'
  currencySymbol: string; // Default: '₹'
  contactInformation: string;
  address: string;
  shareholdersCanManageRevenue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string; // Base64 or ObjectURL representation for secure preview & download
  uploadedBy: string;
  uploadedAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  paidByUserId: string; // Must map to a shareholder user
  paidByName: string;
  expenseDate: string; // YYYY-MM-DD
  vendor: string;
  invoiceNumber: string;
  description: string;
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque' | 'UPI / Online';
  notes: string;
  attachments: ExpenseAttachment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  id: string;
  amount: number;
  revenueDate: string; // YYYY-MM-DD
  customer: string;
  invoiceNumber: string;
  paymentStatus: 'Received' | 'Pending' | 'Overdue';
  paymentMethod: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque' | 'UPI / Online';
  description: string;
  notes: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementPayment {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  settlementDate: string;
  status: 'Pending' | 'Paid';
  notes: string;
  paidAt?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  recordAffected: string;
  details: string;
  timestamp: string;
}

export interface SettlementCalculation {
  totalExpenses: number;
  shareholders: {
    userId: string;
    name: string;
    percentage: number;
    actualPaid: number;
    fairShare: number;
    balance: number; // positive = paid more (is owed), negative = paid less (owes)
  }[];
  // Net settlement summary
  hasSettlement: boolean;
  debtorId: string | null;
  debtorName: string | null;
  creditorId: string | null;
  creditorName: string | null;
  settlementAmount: number;
  statusText: string;
}
