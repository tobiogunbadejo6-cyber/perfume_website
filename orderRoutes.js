const express = require("express");

const { createOrder, getOrders, markOrderDelivered } = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createOrder);
router.get("/", protect, getOrders);
router.patch("/:id/deliver", protect, markOrderDelivered);

module.exports = router;
