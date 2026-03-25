const { sequelize } = require("../config/db");
const defineUser = require("./User");
const defineProduct = require("./Product");
const defineOrder = require("./Order");
const defineOrderItem = require("./OrderItem");

const User = defineUser(sequelize);
const Product = defineProduct(sequelize);
const Order = defineOrder(sequelize);
const OrderItem = defineOrderItem(sequelize);

Order.hasMany(OrderItem, { as: "items", foreignKey: "orderId", onDelete: "CASCADE" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });

Product.hasMany(OrderItem, { as: "orderItems", foreignKey: "productId" });
OrderItem.belongsTo(Product, { as: "product", foreignKey: "productId" });

module.exports = {
  sequelize,
  User,
  Product,
  Order,
  OrderItem
};
