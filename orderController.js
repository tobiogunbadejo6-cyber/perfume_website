const { Op } = require("sequelize");

const { Order, OrderItem, Product, sequelize } = require("../models");
const { serializeOrder } = require("../utils/serializers");
const { buildWhatsappUrl, sendOrderNotificationEmail } = require("../utils/notifications");

function includeOrderRelations() {
  return [
    {
      model: OrderItem,
      as: "items",
      include: [
        {
          model: Product,
          as: "product"
        }
      ]
    }
  ];
}

async function createOrder(req, res) {
  const transaction = await sequelize.transaction();

  try {
    const { customerName, phone, address, items } = req.body;

    if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: "Customer details and items are required." });
    }

    const productIds = items.map((item) => Number(item.productId));
    const products = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      transaction
    });

    const normalizedItems = items.map((item) => {
      const product = products.find((entry) => entry.id === Number(item.productId));

      if (!product) {
        throw new Error("One or more products are invalid.");
      }

      return {
        productId: product.id,
        price: product.price,
        quantity: Math.max(1, Number(item.quantity) || 1)
      };
    });

    const totalPrice = normalizedItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    const order = await Order.create({
      customerName,
      phone,
      address,
      totalPrice
    }, { transaction });

    await OrderItem.bulkCreate(
      normalizedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      })),
      { transaction }
    );

    await transaction.commit();

    const createdOrder = await Order.findByPk(order.id, { include: includeOrderRelations() });
    const serializedOrder = serializeOrder(createdOrder);

    let emailNotification = { sent: false, skipped: true };
    try {
      emailNotification = await sendOrderNotificationEmail(serializedOrder);
    } catch (notificationError) {
      console.error("Order email notification failed:", notificationError.message);
    }

    return res.status(201).json(
      serializeOrder(createdOrder, {
        whatsappNotificationUrl: buildWhatsappUrl(serializedOrder),
        emailNotificationSent: emailNotification.sent
      })
    );
  } catch (error) {
    await transaction.rollback();
    return res.status(400).json({ message: error.message || "Failed to place order." });
  }
}

async function getOrders(_req, res) {
  try {
    const { search } = _req.query;
    const where = {};

    if (search) {
      const numericId = Number(search);
      where.id = Number.isNaN(numericId) ? -1 : numericId;
    }

    const orders = await Order.findAll({
      where,
      include: includeOrderRelations(),
      order: [["created_at", "DESC"]]
    });

    res.json(
      orders.map((order) => {
        const serialized = serializeOrder(order);
        return {
          ...serialized,
          whatsappNotificationUrl: buildWhatsappUrl(serialized)
        };
      })
    );
  } catch (_error) {
    res.status(500).json({ message: "Failed to fetch orders." });
  }
}

async function markOrderDelivered(req, res) {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    await order.update({ status: "Delivered" });

    const updatedOrder = await Order.findByPk(order.id, { include: includeOrderRelations() });

    const serialized = serializeOrder(updatedOrder);
    return res.json({
      ...serialized,
      whatsappNotificationUrl: buildWhatsappUrl(serialized)
    });
  } catch (_error) {
    return res.status(500).json({ message: "Failed to update order." });
  }
}

module.exports = {
  createOrder,
  getOrders,
  markOrderDelivered
};
