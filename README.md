# B2B Pharmacy Platform

A complete B2B pharmaceutical distribution system built with React.js, Node.js, Express, and Microsoft SQL Server.

## Tech Stack
- **Frontend:** React.js, Ant Design
- **Backend:** Node.js, Express.js
- **Database:** Microsoft SQL Server
- **Authentication:** JWT
- **Email:** Nodemailer

## Project Structure
```
B2B-Pharmacy/
├── backend/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/
    │   ├── App.js
    │   └── index.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js installed (https://nodejs.org)
- Microsoft SQL Server access

### Step 1 — Backend Setup
Open terminal and run:
```bash
cd backend
npm install
node server.js
```
Backend will start on **http://localhost:5000**

You should see:
```
Server running on port 5000
Database Connected
Users table ready
Products table ready
Orders table ready
...
```

### Step 2 — Frontend Setup
Open a **new terminal** and run:
```bash
cd frontend
npm install
npm start
```
Frontend will open on **http://localhost:3000**

## Default Credentials
- Register a new **Distributor** account first
- Then register **Retailer** accounts
- Distributor must approve retailers before they can login

## Modules
1. Authentication & Role-based Access
2. Retailer Approval System
3. Product Catalog with Search & Filter
4. Inventory Management (Batch, Expiry, FIFO)
5. Order Management with Credit Control
6. GST Billing & PDF Invoices
7. Payment Tracking
8. Return & Refund Management
9. Promotions & Discounts
10. Reports & Analytics
11. Email Notifications
