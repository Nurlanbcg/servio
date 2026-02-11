import { Router, Response } from 'express';
import Order from '../models/Order';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { getIO } from '../socket';

const router = Router();

// All cashier routes require cashier role
router.use(authenticate, authorize('cashier'));

// GET /api/cashier/orders — confirmed orders with prices
router.get('/orders', async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orders = await Order.find()
            .select('tableNumber items.name items.quantity items.price totalPrice status createdAt paidAt')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// PATCH /api/cashier/orders/:id/pay — mark order as paid
router.patch('/orders/:id/pay', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            res.status(404).json({ message: 'Order not found.' });
            return;
        }

        if (order.status === 'paid') {
            // Toggle back to confirmed (unpaid)
            order.status = 'confirmed';
            order.paidAt = undefined;
        } else {
            order.status = 'paid';
            order.paidAt = new Date();
        }

        await order.save();

        const io = getIO();
        io.to('kitchen').emit('order-updated', {
            _id: order._id,
            status: order.status,
        });

        res.json({
            _id: order._id,
            tableNumber: order.tableNumber,
            items: order.items,
            totalPrice: order.totalPrice,
            status: order.status,
            paidAt: order.paidAt,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

export default router;
