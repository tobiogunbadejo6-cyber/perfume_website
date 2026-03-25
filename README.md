# KETTYSCENT

Luxury perfume e-commerce website with a customer storefront, cart and checkout flow, plus an admin dashboard for products and orders.

All storefront and admin prices display in Nigerian Naira (`NGN` / `Naira`).

## Stack

- Frontend: HTML, Tailwind CSS (CDN), JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL, Sequelize

## Features

- Luxury homepage with hero banner, featured products, category filtering
- Product detail page with add-to-cart flow
- Cart with quantity updates, remove item, and total price
- Checkout form that saves orders to PostgreSQL
- Order confirmation page
- Admin login with JWT authentication
- Admin overview metrics
- Product CRUD management
- Order list with delivered status updates
- Optional email notifications for new orders
- WhatsApp-ready order links inside admin
- Automatic new-order alert banner in admin
- Order ID search in the admin dashboard

## Project Structure

```text
public/
  admin.html
  checkout.html
  confirmation.html
  index.html
  product.html
  css/styles.css
  js/
server/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  schema.sql
server.js
```

## Local Setup

1. Make sure PostgreSQL is running locally.
2. Create a database named `kettyscent`.
3. Copy `.env.example` to `.env`.
4. Update values in `.env` if needed.
5. Install dependencies.
6. Seed sample products and the admin account.
7. Start the server.

Optional notification settings:

- `WHATSAPP_NOTIFY_NUMBER`: WhatsApp number for quick order alerts in admin
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`: SMTP settings for order email notifications
- `NOTIFY_EMAIL_TO`: inbox that receives new order emails

## Windows PowerShell Commands

Because PowerShell may block `npm.ps1`, use `npm.cmd`:

```powershell
Copy-Item .env.example .env
cmd /c "set npm_config_cache=%cd%\\.npm-cache && npm.cmd install"
cmd /c "set npm_config_cache=%cd%\\.npm-cache && npm.cmd run seed"
cmd /c npm.cmd start
```

Open [http://localhost:5000](http://localhost:5000)

## Default Admin Login

- Username: `admin`
- Email: `admin@kettyscent.com`
- Password: `admin123`

These values come from `.env` and can be changed there.

## API Endpoints

- `POST /api/auth/login`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/orders`
- `GET /api/orders`
- `PATCH /api/orders/:id/deliver`
- `GET /api/admin/overview`

Protected admin routes require a Bearer token.

## Database Schema

The SQL schema is available in [server/schema.sql](C:\Users\HP\Desktop\aunty website\server\schema.sql).

Tables:

- `users`
- `products`
- `orders`
- `order_items`

Relationships:

- One order has many order items
- One product can appear in many order items

## Render Deployment

1. Create a Render PostgreSQL database.
2. Copy the database connection string into `DATABASE_URL`.
3. Create a Render Web Service from this repository.
4. Set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `ADMIN_USERNAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
5. Build command: `npm install`
6. Start command: `npm start`
7. Run `npm run seed` once after the database is connected.

The backend uses `sequelize.sync()` on startup and automatically enables SSL for Render-style PostgreSQL URLs.
