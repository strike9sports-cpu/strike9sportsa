import { AppUser, CompanySettings, ExpenseCategory, ShareholderConfig, Expense, Revenue, SettlementPayment, AuditLog } from '../types';

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  id: 'default',
  companyName: 'Strike9 Sports & Entertainment',
  logoUrl: '',
  currency: 'INR',
  currencySymbol: '₹',
  contactInformation: 'strike9sports@gmail.com',
  address: 'Corporate Headquarters',
  shareholdersCanManageRevenue: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user_admin',
    name: 'Super Admin',
    email: 'strike9sports@gmail.com',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    passwordHash: 'admin123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_shareholder_1',
    name: 'Shareholder 1 (50%)',
    email: 'shareholder1@strike9.com',
    role: 'SHAREHOLDER',
    status: 'ACTIVE',
    passwordHash: 'shareholder123',
    canAddRevenue: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_shareholder_2',
    name: 'Shareholder 2 (50%)',
    email: 'shareholder2@strike9.com',
    role: 'SHAREHOLDER',
    status: 'ACTIVE',
    passwordHash: 'shareholder123',
    canAddRevenue: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_employee_1',
    name: 'Finance Associate',
    email: 'employee@strike9.com',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    passwordHash: 'employee123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SHAREHOLDERS: ShareholderConfig[] = [
  {
    id: 'sh_1',
    userId: 'user_shareholder_1',
    name: 'Shareholder 1 (50%)',
    ownershipPercentage: 50,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sh_2',
    userId: 'user_shareholder_2',
    name: 'Shareholder 2 (50%)',
    ownershipPercentage: 50,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat_rent', name: 'Office Rent & Facilities', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_salaries', name: 'Salaries & Stipends', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_marketing', name: 'Marketing & Advertising', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_software', name: 'Software & Cloud Subscriptions', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_internet', name: 'Internet & Telecommunications', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_electricity', name: 'Electricity & Utilities', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_travel', name: 'Travel & Accommodation', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_supplies', name: 'Office Supplies & Stationery', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_equipment', name: 'Equipment & Hardware', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_legal', name: 'Legal & Professional Fees', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_bank', name: 'Bank Charges & Processing', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_taxes', name: 'Taxes & Regulatory Filing', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cat_misc', name: 'Miscellaneous Expenses', status: 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

// Sample data removed - starts completely clean from Firestore
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_REVENUES: Revenue[] = [];
export const INITIAL_SETTLEMENTS: SettlementPayment[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
