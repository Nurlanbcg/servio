import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import { getSocket } from '../../lib/socket';
import toast from 'react-hot-toast';
import { HiOutlineCash, HiOutlineCheck } from 'react-icons/hi';

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    tableNumber: string;
    items: OrderItem[];
    totalPrice: number;
    status: string;
    createdAt: string;
    paidAt?: string;
}

const CashierDashboard: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'confirmed' | 'paid'>('all');

    useEffect(() => {
        fetchOrders();
        const socket = getSocket();

        socket.on('new-order', (order: Order) => {
            setOrders((prev) => [order, ...prev]);
            toast.success(`New order — Table #${order.tableNumber}`, { icon: '🔔' });
        });

        return () => {
            socket.off('new-order');
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/cashier/orders');
            setOrders(data);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const togglePay = async (orderId: string) => {
        try {
            const { data } = await api.patch(`/cashier/orders/${orderId}/pay`);
            setOrders((prev) =>
                prev.map((o) => (o._id === orderId ? data : o))
            );
            toast.success(data.status === 'paid' ? 'Order marked as paid' : 'Order marked as unpaid');
        } catch {
            toast.error('Failed to update order');
        }
    };

    const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

    const totalRevenue = orders
        .filter((o) => o.status === 'paid')
        .reduce((sum, o) => sum + o.totalPrice, 0);

    const pendingTotal = orders
        .filter((o) => o.status === 'confirmed')
        .reduce((sum, o) => sum + o.totalPrice, 0);

    return (
        <Layout title="Cashier Panel">
            <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="card bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                        <p className="text-xs text-emerald-400 font-medium">Total Paid</p>
                        <p className="text-2xl font-bold text-emerald-400">${totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                        <p className="text-xs text-amber-400 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-amber-400">${pendingTotal.toFixed(2)}</p>
                    </div>
                    <div className="card">
                        <p className="text-xs text-surface-400 font-medium">Total Orders</p>
                        <p className="text-2xl font-bold text-surface-100">{orders.length}</p>
                    </div>
                </div>

                {/* Filter + Live indicator */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        {(['all', 'confirmed', 'paid'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f
                                    ? 'bg-brand-500 text-white'
                                    : 'bg-surface-800 text-surface-400 hover:text-surface-200'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                        <span className="text-xs text-surface-400">Live</span>
                    </div>
                </div>

                {/* Orders */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-surface-400">No orders found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order) => (
                            <div
                                key={order._id}
                                className={`card animate-fade-in transition-all ${order.status === 'paid' ? 'opacity-70' : ''
                                    }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center">
                                            <span className="text-xl font-bold text-brand-400">{order.tableNumber}</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-surface-100">Table #{order.tableNumber}</h3>
                                            <p className="text-xs text-surface-400">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={order.status === 'paid' ? 'badge-paid' : 'badge-confirmed'}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Items table */}
                                <div className="overflow-x-auto mb-4">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-surface-400 border-b border-surface-700/50">
                                                <th className="text-left py-2 font-medium">Item</th>
                                                <th className="text-center py-2 font-medium">Qty</th>
                                                <th className="text-right py-2 font-medium">Price</th>
                                                <th className="text-right py-2 font-medium">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, idx) => (
                                                <tr key={idx} className="border-b border-surface-700/30">
                                                    <td className="py-2 text-surface-200">{item.name}</td>
                                                    <td className="py-2 text-center text-surface-300">{item.quantity}</td>
                                                    <td className="py-2 text-right text-surface-300">${item.price.toFixed(2)}</td>
                                                    <td className="py-2 text-right text-surface-100 font-medium">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-surface-600">
                                                <td colSpan={3} className="py-3 text-right font-bold text-surface-200">
                                                    Total
                                                </td>
                                                <td className="py-3 text-right text-lg font-bold text-brand-400">
                                                    ${order.totalPrice.toFixed(2)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>

                                <button
                                    onClick={() => togglePay(order._id)}
                                    className={order.status === 'paid' ? 'btn-secondary w-full' : 'btn-success w-full'}
                                >
                                    {order.status === 'paid' ? (
                                        <>
                                            <HiOutlineCash className="w-4 h-4" />
                                            Mark Unpaid
                                        </>
                                    ) : (
                                        <>
                                            <HiOutlineCheck className="w-4 h-4" />
                                            Mark as Paid
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CashierDashboard;
