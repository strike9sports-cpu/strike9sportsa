import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { AppUser, UserRole } from '../types';
import { formatDate } from '../utils/formatters';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Lock, 
  Edit3, 
  UserX, 
  CheckCircle, 
  AlertCircle,
  X,
  Key,
  Briefcase
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const { 
    currentUser, 
    users, 
    createUser, 
    updateUser, 
    deactivateUser, 
    resetUserPassword 
  } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [passwordResetUserId, setPasswordResetUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE' as UserRole,
    passwordHash: 'password123',
    canAddRevenue: false,
  });

  const [formError, setFormError] = useState('');

  if (currentUser?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 text-center text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200">
        <Shield className="w-8 h-8 mx-auto mb-2" />
        <div className="font-bold">Access Denied</div>
        <p className="text-xs mt-1">Only the Super Admin has permission to view and manage users.</p>
      </div>
    );
  }

  const openAddUser = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      role: 'EMPLOYEE',
      passwordHash: 'password123',
      canAddRevenue: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditUser = (u: AppUser) => {
    setEditingUserId(u.id);
    setFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      passwordHash: u.passwordHash || '',
      canAddRevenue: !!u.canAddRevenue,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('User full name is required.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('A valid email address is required.');
      return;
    }

    if (editingUserId) {
      updateUser(editingUserId, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        canAddRevenue: formData.canAddRevenue,
      });
    } else {
      createUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        status: 'ACTIVE',
        passwordHash: formData.passwordHash || 'password123',
        canAddRevenue: formData.canAddRevenue,
      });
    }

    setIsModalOpen(false);
  };

  const handlePasswordResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim() || !passwordResetUserId) return;
    resetUserPassword(passwordResetUserId, newPasswordInput.trim());
    setPasswordResetUserId(null);
    setNewPasswordInput('');
    alert('User password updated successfully.');
  };

  return (
    <div id="users-management-view" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              User &amp; Access Control
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
              Super Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Provision roles (Super Admin, Shareholder, Employee), reset credentials, and govern portal access
          </p>
        </div>

        <button
          type="button"
          onClick={openAddUser}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Revenue Permission</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 font-bold flex items-center justify-center text-slate-700 dark:text-slate-300">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
                        : u.role === 'SHAREHOLDER'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                    }`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    {u.role === 'EMPLOYEE' ? (
                      <span className="text-emerald-600 font-medium">Native (Always Allowed)</span>
                    ) : u.role === 'SHAREHOLDER' ? (
                      u.canAddRevenue ? (
                        <span className="text-emerald-600 font-medium">Enabled by Admin</span>
                      ) : (
                        <span className="text-slate-400">Disabled</span>
                      )
                    ) : (
                      <span className="text-purple-600 font-medium">All Permissions (Admin)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => openEditUser(u)}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-indigo-600"
                      title="Edit User"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordResetUserId(u.id);
                        setNewPasswordInput('');
                      }}
                      className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-600"
                      title="Reset Password"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    {u.id !== currentUser.id && u.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to deactivate ${u.name}?`)) {
                            deactivateUser(u.id);
                          }
                        }}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600"
                        title="Deactivate Account"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {passwordResetUserId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <Key className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset User Password</h3>
            </div>
            <form onSubmit={handlePasswordResetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordResetUserId(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUserId ? 'Edit User Attributes' : 'Create New User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Mehta"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@apextech.io"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  System Role *
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full company authority)</option>
                  <option value="SHAREHOLDER">SHAREHOLDER (Record expenses, 50/50 settlement)</option>
                  <option value="EMPLOYEE">EMPLOYEE (Restricted: record revenue only)</option>
                </select>
              </div>

              {!editingUserId && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.passwordHash}
                    onChange={e => setFormData({ ...formData, passwordHash: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs"
                  />
                </div>
              )}

              {formData.role === 'SHAREHOLDER' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="canAddRevenueCheckbox"
                    checked={formData.canAddRevenue}
                    onChange={e => setFormData({ ...formData, canAddRevenue: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="canAddRevenueCheckbox" className="text-xs text-slate-700 dark:text-slate-300">
                    Allow this Shareholder to add/manage customer revenue
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                >
                  {editingUserId ? 'Save User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
