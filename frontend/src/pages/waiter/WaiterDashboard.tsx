import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineMinus, HiOutlineShoppingCart, HiOutlineCheck, HiOutlineArrowLeft, HiOutlineX } from 'react-icons/hi';

interface MenuItem {
    _id: string;
    name: string;
    category: string;
}

interface CartItem {
    menuItemId: string;
    name: string;
    quantity: number;
}

interface Hall {
    name: string;
    tables: number[];
    type: 'hall' | 'cabinet';
}

const WaiterDashboard: React.FC = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [halls, setHalls] = useState<Hall[]>([]);
    const [activeHall, setActiveHall] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('All');

    useEffect(() => {
        fetchMenu();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            const h = data.halls || [];
            setHalls(h);
            if (h.length > 0) setActiveHall(h[0].name);
        } catch {
            // Use default
        }
    };

    const fetchMenu = async () => {
        try {
            const { data } = await api.get('/waiter/menu');
            setMenuItems(data);
        } catch {
            toast.error('Failed to load menu');
        } finally {
            setLoading(false);
        }
    };

    const categories = ['All', ...Array.from(new Set(menuItems.map((i) => i.category))).sort((a, b) => a.localeCompare(b))];

    const filteredItems = activeCategory === 'All'
        ? menuItems
        : menuItems.filter((i) => i.category === activeCategory);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.menuItemId === item._id);
            if (existing) {
                return prev.map((c) =>
                    c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, { menuItemId: item._id, name: item.name, quantity: 1 }];
        });
    };

    const removeFromCart = (menuItemId: string) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.menuItemId === menuItemId);
            if (existing && existing.quantity > 1) {
                return prev.map((c) =>
                    c.menuItemId === menuItemId ? { ...c, quantity: c.quantity - 1 } : c
                );
            }
            return prev.filter((c) => c.menuItemId !== menuItemId);
        });
    };

    const getCartQty = (menuItemId: string): number => {
        return cart.find((c) => c.menuItemId === menuItemId)?.quantity || 0;
    };

    const handleSubmitOrder = async () => {
        if (cart.length === 0) {
            toast.error('Please add items to the order');
            return;
        }
        if (!tableNumber) {
            toast.error('Please select a table');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/waiter/orders', {
                tableNumber,
                items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
            });
            toast.success(`Order for Table ${tableNumber} confirmed!`);
            setCart([]);
            setTableNumber(null);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit order');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBackToTables = () => {
        setTableNumber(null);
        setCart([]);
        setActiveCategory('All');
    };

    const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);

    const currentHall = halls.find((h) => h.name === activeHall);
    const currentTables = currentHall ? currentHall.tables : [];

    // ─── STEP 1: Table Selection ───
    if (tableNumber === null) {
        return (
            <Layout
                title="Waiter Panel"
                navItems={[
                    { label: 'New Order', path: '/waiter' },
                    { label: 'My Orders', path: '/waiter/orders' },
                ]}
            >
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-surface-100">Select a Table</h2>
                        <p className="text-surface-400 text-sm">Choose the table number to start a new order</p>
                    </div>

                    {/* Hall tabs & Cabinet buttons */}
                    {halls.length > 0 && (
                        <div className="flex items-center gap-2 justify-center flex-wrap">
                            {halls.filter((h) => h.type !== 'cabinet').length > 1 && halls.filter((h) => h.type !== 'cabinet').map((hall) => (
                                <button
                                    key={hall.name}
                                    onClick={() => setActiveHall(hall.name)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeHall === hall.name
                                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                                        : 'bg-surface-800 border border-surface-700/50 text-surface-400 hover:bg-surface-700 hover:text-surface-200'
                                        }`}
                                >
                                    {hall.name}
                                </button>
                            ))}
                            {halls.filter((h) => h.type !== 'cabinet').length === 1 && (
                                <span className="text-surface-400 text-sm font-medium">{halls.find((h) => h.type !== 'cabinet')?.name}</span>
                            )}
                        </div>
                    )}

                    {/* Table grid for active hall */}
                    {currentHall && currentHall.type !== 'cabinet' && (
                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {currentTables.map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTableNumber(String(t))}
                                    className="aspect-square rounded-2xl text-xl font-bold transition-all
                                        bg-surface-800 border border-surface-700/50 text-surface-300
                                        hover:bg-brand-500 hover:text-white hover:border-brand-500
                                        hover:shadow-lg hover:shadow-brand-500/20 hover:scale-105
                                        active:scale-95"
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Cabinet buttons */}
                    {halls.some((h) => h.type === 'cabinet') && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-surface-400 text-center uppercase tracking-wider">Cabinets</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {halls.filter((h) => h.type === 'cabinet').map((cab) => (
                                    <button
                                        key={cab.name}
                                        onClick={() => setTableNumber(cab.name)}
                                        className="py-4 px-6 rounded-2xl text-base font-bold transition-all
                                            bg-purple-500/10 border border-purple-500/30 text-purple-300
                                            hover:bg-purple-500 hover:text-white hover:border-purple-500
                                            hover:shadow-lg hover:shadow-purple-500/20 hover:scale-105
                                            active:scale-95"
                                    >
                                        🚪 {cab.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentTables.length === 0 && currentHall?.type !== 'cabinet' && (
                        <p className="text-center text-surface-500 py-8">No tables in this hall. Ask admin to set up tables.</p>
                    )}
                </div>
            </Layout>
        );
    }

    // ─── STEP 2: Menu Selection & Order ───
    return (
        <Layout
            title="Waiter Panel"
            navItems={[
                { label: 'New Order', path: '/waiter' },
                { label: 'My Orders', path: '/waiter/orders' },
            ]}
        >
            <div className="flex gap-4 h-full">
                {/* Left sidebar — Back button + Categories */}
                <div className="w-48 flex-shrink-0">
                    <div className="sticky top-24 space-y-3">
                        {/* Back to tables — standalone */}
                        <button
                            onClick={handleBackToTables}
                            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                                bg-surface-800 border border-surface-700/50 text-surface-300
                                hover:bg-surface-700 hover:text-surface-100 flex items-center gap-2"
                        >
                            <HiOutlineArrowLeft className="w-4 h-4" />
                            Back to Tables
                        </button>

                        {/* Categories card */}
                        <div className="card p-3 space-y-1">
                            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider px-3 mb-2">Categories</h3>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === cat
                                        ? 'bg-brand-500 text-white'
                                        : 'text-surface-400 hover:bg-surface-700 hover:text-surface-200'
                                        }`}
                                >
                                    {cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center — Menu items */}
                <div className="flex-1 min-w-0 space-y-4">
                    {/* Table indicator */}
                    <div className="card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-500/30">
                                {tableNumber}
                            </span>
                            <div>
                                <h3 className="font-semibold text-surface-100">Table {tableNumber}</h3>
                                <p className="text-xs text-surface-400">Select items for this table</p>
                            </div>
                        </div>
                        <button
                            onClick={handleBackToTables}
                            className="text-sm text-surface-400 hover:text-surface-200 transition-colors"
                        >
                            Change table
                        </button>
                    </div>

                    {/* Menu grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {filteredItems.map((item) => {
                                const qty = getCartQty(item._id);
                                return (
                                    <div
                                        key={item._id}
                                        onClick={() => addToCart(item)}
                                        className={`card flex items-center justify-between transition-all cursor-pointer
                                            hover:border-brand-500/30 hover:bg-brand-500/5 active:scale-[0.98]
                                            ${qty > 0 ? 'border-brand-500/50 bg-brand-500/5' : ''}`}
                                    >
                                        <div>
                                            <h3 className="font-semibold text-surface-100">{item.name}</h3>
                                            <p className="text-xs text-surface-400">{item.category.toUpperCase()}</p>
                                        </div>
                                        {qty > 0 && (
                                            <span className="min-w-7 h-7 px-2 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-brand-500/30">
                                                {qty}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right sidebar — Cart */}
                <div className="w-72 flex-shrink-0">
                    <div className="card sticky top-24 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-surface-100 flex items-center gap-2">
                                <HiOutlineShoppingCart className="w-5 h-5 text-brand-400" />
                                Order — Table {tableNumber}
                            </h2>
                            {totalItems > 0 && (
                                <span className="badge bg-brand-500/20 text-brand-400 border border-brand-500/30">
                                    {totalItems} items
                                </span>
                            )}
                        </div>

                        {cart.length === 0 ? (
                            <p className="text-surface-500 text-sm text-center py-8">
                                No items added yet
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {cart.map((item) => (
                                    <div
                                        key={item.menuItemId}
                                        className="flex items-center justify-between py-2 border-b border-surface-700/50"
                                    >
                                        <span className="text-sm text-surface-200 flex-1 mr-2">{item.name}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => removeFromCart(item.menuItemId)}
                                                className="w-6 h-6 rounded bg-surface-700 text-surface-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all text-xs"
                                            >
                                                <HiOutlineMinus className="w-3 h-3" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-semibold text-brand-400">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => addToCart({ _id: item.menuItemId, name: item.name, category: '' })}
                                                className="w-6 h-6 rounded bg-brand-500 text-white hover:bg-brand-600 flex items-center justify-center transition-all text-xs"
                                            >
                                                <HiOutlinePlus className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => setCart((prev) => prev.filter((c) => c.menuItemId !== item.menuItemId))}
                                                className="w-6 h-6 rounded bg-surface-700 text-surface-400 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all text-xs ml-1"
                                            >
                                                <HiOutlineX className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleSubmitOrder}
                            disabled={cart.length === 0 || submitting}
                            className="btn-primary w-full py-3"
                        >
                            {submitting ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <HiOutlineCheck className="w-5 h-5" />
                                    Confirm Order
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default WaiterDashboard;
