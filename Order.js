const { DataTypes } = require("sequelize");

module.exports = (sequelize) => sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "customer_name",
      validate: {
        notEmpty: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    totalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "total_price",
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.ENUM("Pending", "Delivered"),
      allowNull: false,
      defaultValue: "Pending"
    }
  },
  {
    tableName: "orders",
    underscored: true,
    createdAt: "created_at",
    updatedAt: false
  }
);
