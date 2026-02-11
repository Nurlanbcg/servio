import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface OrderItem {
    name: string;
    quantity: number;
}

interface Order {
    _id: string;
    tableNumber: string;
    items: OrderItem[];
    status: string;
    createdAt: string;
}

const WaiterOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/waiter/orders');
            setOrders(data);
        } catch {
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout
            title="Waiter Panel"
            navItems={[
                { label: 'New Order', path: '/waiter' },
                { label: 'My Orders', path: '/waiter/orders' },
            ]}
        >
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-surface-100">My Orders</h2>
                    <button onClick={fetchOrders} className="btn-secondary btn-sm">
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-surface-400">No orders yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {orders.map((order) => (
                            <div key={order._id} className="card animate-slide-up space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-bold text-brand-400">
                                            #{order.tableNumber}
                                        </span>
                                        <span className="text-xs text-surface-500">Table</span>
                                    </div>
                                    <span className={order.status === 'paid' ? 'badge-paid' : 'badge-confirmed'}>
                                        {order.status}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-surface-300">{item.name}</span>
                                            <span className="text-surface-400">×{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-xs text-surface-500">
                                    {new Date(order.createdAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WaiterOrders;
