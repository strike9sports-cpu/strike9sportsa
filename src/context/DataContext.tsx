import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase';
import { 
  AppUser, 
  CompanySettings, 
  ExpenseCategory, 
  ShareholderConfig, 
  Expense, 
  Revenue, 
  SettlementPayment, 
  AuditLog,
  SettlementCalculation
} from '../types';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_USERS,
  INITIAL_SHAREHOLDERS,
  INITIAL_CATEGORIES,
  INITIAL_EXPENSES,
  INITIAL_REVENUES,
  INITIAL_SETTLEMENTS,
  INITIAL_AUDIT_LOGS,
} from '../data/seedData';
import { calculateShareholderSettlement } from '../services/settlementCalculator';

interface DataContextType {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  users: AppUser[];
  companySettings: CompanySettings;
  categories: ExpenseCategory[];
  shareholders: ShareholderConfig[];
  expenses: Expense[];
  revenues: Revenue[];
  settlements: SettlementPayment[];
  auditLogs: AuditLog[];
  settlementCalc: SettlementCalculation;
  isFirestoreConnected: boolean;
  isLoading: boolean;
  // Actions
  login: (email: string, passwordHash: string) => { success: boolean; message?: string };
  logout: () => void;
  // User Management
  createUser: (user: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<AppUser>) => Promise<void>;
  deactivateUser: (id: string) => Promise<void>;
  resetUserPassword: (id: string, newPass: string) => Promise<void>;
  // Company Settings
  updateCompanySettings: (updates: Partial<CompanySettings>) => Promise<void>;
  // Categories
  createCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deactivateCategory: (id: string) => Promise<void>;
  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  // Revenues
  addRevenue: (revenue: Omit<Revenue, 'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRevenue: (id: string, updates: Partial<Revenue>) => Promise<void>;
  deleteRevenue: (id: string) => Promise<void>;
  // Settlements
  recordSettlementPayment: (payment: Omit<SettlementPayment, 'id' | 'createdAt' | 'updatedAt' | 'recordedBy'>) => Promise<void>;
  markSettlementAsPaid: (id: string) => Promise<void>;
  // Shareholder equity config
  updateShareholderPercentages: (updates: { id: string; ownershipPercentage: number }[]) => Promise<{ success: boolean; message?: string }>;
  // Audit log
  addAuditLog: (action: string, recordAffected: string, details: string) => Promise<void>;
  // Reset helper
  resetToDefaultData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'strike9_active_user_id';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_COMPANY_SETTINGS);
  const [categories, setCategories] = useState<ExpenseCategory[]>(INITIAL_CATEGORIES);
  const [shareholders, setShareholders] = useState<ShareholderConfig[]>(INITIAL_SHAREHOLDERS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [revenues, setRevenues] = useState<Revenue[]>(INITIAL_REVENUES);
  const [settlements, setSettlements] = useState<SettlementPayment[]>(INITIAL_SETTLEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Clear legacy mock sample data keys from localStorage
  useEffect(() => {
    try {
      const keysToRemove = [
        'apex_fin_currentUser',
        'apex_fin_users',
        'apex_fin_companySettings',
        'apex_fin_categories',
        'apex_fin_shareholders',
        'apex_fin_expenses',
        'apex_fin_revenues',
        'apex_fin_settlements',
        'apex_fin_auditLogs'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }, []);

  // Bootstrap initial configurations to Firestore if database collections are empty
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const bootstrapIfEmpty = async () => {
      try {
        // 1. Company Settings
        const settingsSnap = await getDocs(collection(db, 'company_settings'));
        if (settingsSnap.empty) {
          await setDoc(doc(db, 'company_settings', 'default'), INITIAL_COMPANY_SETTINGS);
        }

        // 2. Categories
        const catSnap = await getDocs(collection(db, 'expense_categories'));
        if (catSnap.empty) {
          const batch = writeBatch(db);
          INITIAL_CATEGORIES.forEach(cat => {
            batch.set(doc(db, 'expense_categories', cat.id), cat);
          });
          await batch.commit();
        }

        // 3. Users
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          const batch = writeBatch(db);
          INITIAL_USERS.forEach(u => {
            batch.set(doc(db, 'users', u.id), u);
          });
          await batch.commit();
        }

        // 4. Shareholders
        const shSnap = await getDocs(collection(db, 'shareholders'));
        if (shSnap.empty) {
          const batch = writeBatch(db);
          INITIAL_SHAREHOLDERS.forEach(sh => {
            batch.set(doc(db, 'shareholders', sh.id), sh);
          });
          await batch.commit();
        }
      } catch (err) {
        console.warn('Bootstrap note (safe to continue with existing data):', err);
      }
    };

    bootstrapIfEmpty();
  }, []);

  // Real-time Firestore Listeners
  useEffect(() => {
    // 1. Listen to Expenses
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as Expense);
        });
        // Sort newest date first
        list.sort((a, b) => (b.expenseDate || '').localeCompare(a.expenseDate || ''));
        setExpenses(list);
        setIsFirestoreConnected(true);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'expenses');
        setIsFirestoreConnected(false);
      }
    );

    // 2. Listen to Revenues
    const unsubRevenues = onSnapshot(
      collection(db, 'revenues'),
      (snapshot) => {
        const list: Revenue[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as Revenue);
        });
        list.sort((a, b) => (b.revenueDate || '').localeCompare(a.revenueDate || ''));
        setRevenues(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'revenues');
      }
    );

    // 3. Listen to Settlements
    const unsubSettlements = onSnapshot(
      collection(db, 'settlements'),
      (snapshot) => {
        const list: SettlementPayment[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as SettlementPayment);
        });
        list.sort((a, b) => (b.settlementDate || '').localeCompare(a.settlementDate || ''));
        setSettlements(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settlements');
      }
    );

    // 4. Listen to Categories
    const unsubCategories = onSnapshot(
      collection(db, 'expense_categories'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ExpenseCategory[] = [];
          snapshot.forEach((d) => {
            list.push({ ...d.data(), id: d.id } as ExpenseCategory);
          });
          list.sort((a, b) => a.name.localeCompare(b.name));
          setCategories(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'expense_categories');
      }
    );

    // 5. Listen to Company Settings
    const unsubSettings = onSnapshot(
      collection(db, 'company_settings'),
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data() as CompanySettings;
          setCompanySettings(data);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'company_settings');
      }
    );

    // 6. Listen to Users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AppUser[] = [];
          snapshot.forEach((d) => {
            list.push({ ...d.data(), id: d.id } as AppUser);
          });
          setUsers(list);

          // Restore or initialize active user
          const savedUserId = localStorage.getItem(CURRENT_USER_KEY);
          if (savedUserId) {
            const found = list.find(u => u.id === savedUserId);
            if (found && found.status === 'ACTIVE') {
              setCurrentUser(found);
            } else if (list.length > 0) {
              setCurrentUser(list[0]);
            }
          } else {
            // Default to Super Admin for immediate seamless preview
            const admin = list.find(u => u.role === 'SUPER_ADMIN') || list[0];
            setCurrentUser(admin || null);
          }
        }
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
        setIsLoading(false);
      }
    );

    // 7. Listen to Shareholders
    const unsubShareholders = onSnapshot(
      collection(db, 'shareholders'),
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ShareholderConfig[] = [];
          snapshot.forEach((d) => {
            list.push({ ...d.data(), id: d.id } as ShareholderConfig);
          });
          setShareholders(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'shareholders');
      }
    );

    // 8. Listen to Audit Logs
    const unsubLogs = onSnapshot(
      collection(db, 'audit_logs'),
      (snapshot) => {
        const list: AuditLog[] = [];
        snapshot.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as AuditLog);
        });
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setAuditLogs(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'audit_logs');
      }
    );

    return () => {
      unsubExpenses();
      unsubRevenues();
      unsubSettlements();
      unsubCategories();
      unsubSettings();
      unsubUsers();
      unsubShareholders();
      unsubLogs();
    };
  }, []);

  // Dynamic settlement calculation computed automatically on live expenses and shareholders
  const settlementCalc = calculateShareholderSettlement(expenses, shareholders);

  const addAuditLog = async (action: string, recordAffected: string, details: string) => {
    const id = 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newLog: AuditLog = {
      id,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'System / Guest',
      action,
      recordAffected,
      details,
      timestamp: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'audit_logs', id), newLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'audit_logs');
    }
  };

  const login = (email: string, pass: string) => {
    const trimmed = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === trimmed);
    if (!user) {
      return { success: false, message: 'Invalid credentials. User email not found in database.' };
    }
    if (user.status === 'INACTIVE') {
      return { success: false, message: 'This account has been deactivated by Super Admin.' };
    }
    if (user.passwordHash && user.passwordHash !== pass) {
      return { success: false, message: 'Incorrect password.' };
    }
    setCurrentUser(user);
    try {
      localStorage.setItem(CURRENT_USER_KEY, user.id);
    } catch {
      // ignore
    }
    addAuditLog('USER_LOGIN', user.email, `User ${user.name} logged in.`);
    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('USER_LOGOUT', currentUser.email, `User ${currentUser.name} logged out.`);
    }
    setCurrentUser(null);
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {
      // ignore
    }
  };

  const createUser = async (userData: Omit<AppUser, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = 'user_' + Date.now();
    const now = new Date().toISOString();
    const newUser: AppUser = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'users', id), newUser);
      await addAuditLog('USER_CREATED', newUser.email, `Created user ${newUser.name} with role ${newUser.role}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  };

  const updateUser = async (id: string, updates: Partial<AppUser>) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', id), { ...updates, updatedAt: now });
      if (currentUser?.id === id) {
        setCurrentUser(prev => (prev ? { ...prev, ...updates, updatedAt: now } : null));
      }
      if (updates.name) {
        const matchSh = shareholders.find(sh => sh.userId === id);
        if (matchSh) {
          await updateDoc(doc(db, 'shareholders', matchSh.id), { name: updates.name, updatedAt: now });
        }
      }
      await addAuditLog('USER_UPDATED', id, `Updated attributes for user ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const deactivateUser = async (id: string) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', id), { status: 'INACTIVE', updatedAt: now });
      await addAuditLog('USER_DEACTIVATED', id, `Deactivated user account ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const resetUserPassword = async (id: string, newPass: string) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', id), { passwordHash: newPass, updatedAt: now });
      await addAuditLog('PASSWORD_RESET', id, `Password reset for user ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const updateCompanySettings = async (updates: Partial<CompanySettings>) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'company_settings', 'default'), { ...updates, updatedAt: now });
      await addAuditLog('COMPANY_SETTINGS_UPDATED', 'company_settings', 'Updated company profile, currency or logo configuration.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'company_settings');
    }
  };

  const createCategory = async (name: string) => {
    const id = 'cat_' + Date.now();
    const now = new Date().toISOString();
    const newCat: ExpenseCategory = {
      id,
      name,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'expense_categories', id), newCat);
      await addAuditLog('CATEGORY_CREATED', name, `Added new expense category "${name}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expense_categories');
    }
  };

  const updateCategory = async (id: string, name: string) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'expense_categories', id), { name, updatedAt: now });
      await addAuditLog('CATEGORY_UPDATED', id, `Renamed expense category to "${name}"`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'expense_categories');
    }
  };

  const deactivateCategory = async (id: string) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'expense_categories', id), { status: 'INACTIVE', updatedAt: now });
      await addAuditLog('CATEGORY_DEACTIVATED', id, `Marked category ${id} as inactive`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'expense_categories');
    }
  };

  const addExpense = async (data: Omit<Expense, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => {
    const id = 'exp_' + Date.now();
    const now = new Date().toISOString();
    const newExpense: Expense = {
      ...data,
      id,
      createdBy: currentUser?.id || 'unknown',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'expenses', id), newExpense);
      await addAuditLog('EXPENSE_CREATED', newExpense.invoiceNumber || id, `Recorded expense of ${companySettings.currencySymbol}${newExpense.amount} for ${newExpense.categoryName} paid by ${newExpense.paidByName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'expenses', id), { ...updates, updatedAt: now });
      await addAuditLog('EXPENSE_UPDATED', id, `Updated expense details for record ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'expenses');
    }
  };

  const deleteExpense = async (id: string) => {
    const exp = expenses.find(e => e.id === id);
    try {
      await deleteDoc(doc(db, 'expenses', id));
      await addAuditLog('EXPENSE_DELETED', id, `Deleted expense record ${id} (amount: ${companySettings.currencySymbol}${exp?.amount || 0})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'expenses');
    }
  };

  const addRevenue = async (data: Omit<Revenue, 'id' | 'createdBy' | 'createdByName' | 'createdAt' | 'updatedAt'>) => {
    const id = 'rev_' + Date.now();
    const now = new Date().toISOString();
    const newRev: Revenue = {
      ...data,
      id,
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.name || 'Staff',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'revenues', id), newRev);
      await addAuditLog('REVENUE_CREATED', newRev.invoiceNumber || id, `Added revenue of ${companySettings.currencySymbol}${newRev.amount} from customer ${newRev.customer}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'revenues');
    }
  };

  const updateRevenue = async (id: string, updates: Partial<Revenue>) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'revenues', id), { ...updates, updatedAt: now });
      await addAuditLog('REVENUE_UPDATED', id, `Updated revenue record ${id}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'revenues');
    }
  };

  const deleteRevenue = async (id: string) => {
    const rev = revenues.find(r => r.id === id);
    try {
      await deleteDoc(doc(db, 'revenues', id));
      await addAuditLog('REVENUE_DELETED', id, `Deleted revenue entry ${id} (amount: ${companySettings.currencySymbol}${rev?.amount || 0})`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'revenues');
    }
  };

  const recordSettlementPayment = async (data: Omit<SettlementPayment, 'id' | 'createdAt' | 'updatedAt' | 'recordedBy'>) => {
    const id = 'set_' + Date.now();
    const now = new Date().toISOString();
    const newPayment: SettlementPayment = {
      ...data,
      id,
      recordedBy: currentUser?.id || 'system',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'settlements', id), newPayment);
      await addAuditLog('SETTLEMENT_RECORDED', id, `Recorded settlement payment of ${companySettings.currencySymbol}${newPayment.amount} from ${newPayment.fromUserName} to ${newPayment.toUserName}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'settlements');
    }
  };

  const markSettlementAsPaid = async (id: string) => {
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'settlements', id), { status: 'Paid', paidAt: now, updatedAt: now });
      await addAuditLog('SETTLEMENT_PAID', id, `Marked settlement payment ${id} as Paid`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settlements');
    }
  };

  const updateShareholderPercentages = async (updates: { id: string; ownershipPercentage: number }[]) => {
    const total = updates.reduce((sum, item) => sum + (Number(item.ownershipPercentage) || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      return { success: false, message: `Total ownership percentage must equal exactly 100%. Currently: ${total}%` };
    }
    const now = new Date().toISOString();
    try {
      const batch = writeBatch(db);
      updates.forEach(u => {
        batch.update(doc(db, 'shareholders', u.id), {
          ownershipPercentage: Number(u.ownershipPercentage),
          updatedAt: now,
        });
      });
      await batch.commit();
      await addAuditLog('EQUITY_PERCENTAGES_UPDATED', 'shareholders', `Updated shareholder ownership distribution: ${JSON.stringify(updates)}`);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'shareholders');
      return { success: false, message: 'Failed to update shareholder percentages in database.' };
    }
  };

  const resetToDefaultData = async () => {
    try {
      // Clear expenses, revenues, settlements from Firestore
      const expDocs = await getDocs(collection(db, 'expenses'));
      const revDocs = await getDocs(collection(db, 'revenues'));
      const setDocs = await getDocs(collection(db, 'settlements'));

      const batch = writeBatch(db);
      expDocs.forEach(d => batch.delete(d.ref));
      revDocs.forEach(d => batch.delete(d.ref));
      setDocs.forEach(d => batch.delete(d.ref));
      await batch.commit();

      await addAuditLog('DATABASE_CLEARED', 'expenses,revenues,settlements', 'Cleared all ledger records from database.');
    } catch (err) {
      console.error('Failed to reset database records:', err);
    }
  };

  return (
    <DataContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        companySettings,
        categories,
        shareholders,
        expenses,
        revenues,
        settlements,
        auditLogs,
        settlementCalc,
        isFirestoreConnected,
        isLoading,
        login,
        logout,
        createUser,
        updateUser,
        deactivateUser,
        resetUserPassword,
        updateCompanySettings,
        createCategory,
        updateCategory,
        deactivateCategory,
        addExpense,
        updateExpense,
        deleteExpense,
        addRevenue,
        updateRevenue,
        deleteRevenue,
        recordSettlementPayment,
        markSettlementAsPaid,
        updateShareholderPercentages,
        addAuditLog,
        resetToDefaultData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
