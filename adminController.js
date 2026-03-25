const { Product, Order } = require("../models");

async function getDashboardOverview(_req, res) {
  try {
    const [totalProducts, totalOrders, pendingOrders, deliveredOrders] = await Promise.all([
      Product.count(),
      Order.count(),
      Order.count({ where: { status: "Pending" } }),
      Order.count({ where: { status: "Delivered" } })
    ]);

    res.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders
    });
  } catch (_error) {
    res.status(500).json({ message: "Failed to fetch dashboard overview." });
  }
}

module.exports = { getDashboardOverview };
