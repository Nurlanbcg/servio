import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';

interface User {
    _id: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

const adminNav = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Menu', path: '/admin/menu' },
    { label: 'Inventory', path: '/admin/inventory' },
    { label: 'Users', path: '/admin/users' },
    { label: 'Reports', path: '/admin/reports' },
    { label: 'Settings', path: '/admin/settings' },
];

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ username: '', password: '', role: 'waiter' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({ username: '', password: '', role: 'waiter' });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                const payload: any = { username: form.username, role: form.role };
                if (form.password) payload.password = form.password;
                const { data } = await api.put(`/admin/users/${editingId}`, payload);
                setUsers((prev) => prev.map((u) => (u._id === editingId ? { ...u, ...data } : u)));
                toast.success('User updated');
            } else {
                const { data } = await api.post('/admin/users', form);
                setUsers((prev) => [data, ...prev]);
                toast.success('User created');
            }
            resetForm();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (user: User) => {
        setForm({ username: user.username, password: '', role: user.role });
        setEditingId(user._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            setUsers((prev) => prev.filter((u) => u._id !== id));
            toast.success('User deleted');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    const toggleActive = async (user: User) => {
        try {
            const { data } = await api.put(`/admin/users/${user._id}`, { isActive: !user.isActive });
            setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, ...data } : u)));
            toast.success(`User ${data.isActive ? 'activated' : 'deactivated'}`);
        } catch {
            toast.error('Failed to update');
        }
    };

    const roleBadge: Record<string, string> = {
        admin: 'badge-admin',
        waiter: 'badge-waiter',
        kitchen: 'badge-kitchen',
        bar: 'badge-kitchen',
        cashier: 'badge-cashier',
    };

    return (
        <Layout title="Admin Panel" navItems={adminNav}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-surface-100">User Management</h2>
                    <button
                        onClick={() => { resetForm(); setShowForm(!showForm); }}
                        className={showForm ? 'btn-secondary' : 'btn-primary'}
                    >
                        {showForm ? <><HiOutlineX className="w-4 h-4" /> Cancel</> : <><HiOutlinePlus className="w-4 h-4" /> Add User</>}
                    </button>
                </div>

                {showForm && (
                    <div className="card animate-slide-up">
                        <h3 className="text-lg font-semibold text-surface-100 mb-4">
                            {editingId ? 'Edit User' : 'Create New User'}
                        </h3>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="label">Username</label>
                                <input
                                    className="input"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                    required
                                    placeholder="e.g. John"
                                />
                            </div>
                            <div>
                                <label className="label">{editingId ? 'New Password (optional)' : 'Password'}</label>
                                <input
                                    className="input"
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    required={!editingId}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="label">Role</label>
                                <select
                                    className="input"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="waiter">Waiter</option>
                                    <option value="kitchen">Kitchen</option>
                                    <option value="bar">Bar</option>
                                    <option value="cashier">Cashier</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="sm:col-span-3">
                                <button type="submit" className="btn-primary">
                                    {editingId ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="card overflow-x-auto p-0">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-700/50 text-surface-400">
                                    <th className="text-left p-4 font-medium">Username</th>
                                    <th className="text-left p-4 font-medium">Role</th>
                                    <th className="text-center p-4 font-medium">Status</th>
                                    <th className="text-left p-4 font-medium">Created</th>
                                    <th className="text-right p-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id} className="border-b border-surface-700/30 hover:bg-surface-800/30 transition">
                                        <td className="p-4 font-medium text-surface-100">{user.username}</td>
                                        <td className="p-4">
                                            <span className={roleBadge[user.role] || 'badge'}>{user.role}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => toggleActive(user)}
                                                disabled={user._id === currentUser?.id}
                                                title={user._id === currentUser?.id ? 'You cannot deactivate your own account' : ''}
                                                className={`badge transition-all ${user._id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${user.isActive
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}
                                            >
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-surface-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEdit(user)} className="btn-ghost btn-sm">
                                                    <HiOutlinePencil className="w-4 h-4" />
                                                </button>
                                                {user._id !== currentUser?.id && (
                                                    <button onClick={() => handleDelete(user._id)} className="btn-ghost btn-sm text-red-400 hover:text-red-300">
                                                        <HiOutlineTrash className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default UserManagement;
