const nodemailer = require("nodemailer");

function buildWhatsappUrl(order) {
  const phone = process.env.WHATSAPP_NOTIFY_NUMBER;
  if (!phone) {
    return null;
  }

  const itemLines = order.items
    .map((item) => `- ${item.name} x ${item.quantity} (${Number(item.price).toFixed(2)})`)
    .join("%0A");

  const message = [
    `New KETTYSCENT order`,
    `Order ID: ${order._id}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Address: ${order.address}`,
    `Total: NGN ${Number(order.totalAmount).toFixed(2)}`,
    `Items:`,
    itemLines
  ].join("%0A");

  return `https://wa.me/${phone}?text=${message}`;
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

async function sendOrderNotificationEmail(order) {
  const transporter = createTransporter();
  const recipient = process.env.NOTIFY_EMAIL_TO || process.env.ADMIN_EMAIL;

  if (!transporter || !recipient) {
    return { sent: false, skipped: true };
  }

  const htmlItems = order.items
    .map((item) => `<li>${item.name} x ${item.quantity} - NGN ${Number(item.price).toFixed(2)}</li>`)
    .join("");

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: recipient,
    subject: `New Order #${order._id} from ${order.customerName}`,
    html: `
      <h2>New KETTYSCENT Order</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Address:</strong> ${order.address}</p>
      <p><strong>Total:</strong> NGN ${Number(order.totalAmount).toFixed(2)}</p>
      <h3>Items</h3>
      <ul>${htmlItems}</ul>
    `
  });

  return { sent: true, skipped: false };
}

module.exports = {
  buildWhatsappUrl,
  sendOrderNotificationEmail
};
