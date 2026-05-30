const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'manvi.agrawal213@gmail.com',
        pass: 'qamp avsn uypl gxbj'
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: '"B2B Pharmacy" <manvi.agrawal213@gmail.com>',
            to, subject, html
        });
    } catch (err) {
        console.log('Email error:', err.message);
    }
};

const app = express();
const JWT_SECRET = 'b2bpharma_secret_key';

app.use(cors());
app.use(express.json());

// JWT Middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const authorizeDistributor = (req, res, next) => {
    if (req.user.role !== 'distributor') return res.status(403).json({ message: 'Access denied' });
    next();
};

const config = {
    user: 'sa',
    password: 'Gsquare@123',
    server: '72.62.240.189',
    port: 1433,
    database: 'b2bPharmacyDB',
    options: {
        trustServerCertificate: true
    }
};

sql.connect(config)
.then(async () => {
    console.log('Database Connected');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='name')
        ALTER TABLE Users ADD name NVARCHAR(100) NOT NULL DEFAULT 'Unknown'
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='role')
        ALTER TABLE Users ADD role NVARCHAR(20) NOT NULL DEFAULT 'retailer'
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Users' AND COLUMN_NAME='isApproved')
        ALTER TABLE Users ADD isApproved BIT DEFAULT 0
    `);
    await sql.query(`UPDATE Users SET isApproved = 1 WHERE role = 'distributor'`);
    console.log('Users table ready');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='imageUrl')
        ALTER TABLE Products ADD imageUrl NVARCHAR(500) NULL
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='hsnCode')
        ALTER TABLE Products ADD hsnCode NVARCHAR(50) NULL
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='batchNumber')
        ALTER TABLE Products ADD batchNumber NVARCHAR(50) NULL
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='manufacturingDate')
        ALTER TABLE Products ADD manufacturingDate DATE NULL
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Products' AND COLUMN_NAME='expiryDate')
        ALTER TABLE Products ADD expiryDate DATE NULL
    `);
    console.log('Products table ready');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
        CREATE TABLE Orders (
            id INT IDENTITY(1,1) PRIMARY KEY,
            userId INT NOT NULL,
            productId INT NOT NULL,
            quantity INT NOT NULL,
            totalPrice DECIMAL(10,2) NOT NULL,
            status NVARCHAR(20) DEFAULT 'Pending',
            createdAt DATETIME DEFAULT GETDATE()
        )
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Orders' AND COLUMN_NAME='status')
        ALTER TABLE Orders ADD status NVARCHAR(20) DEFAULT 'Pending'
    `);
    await sql.query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Orders' AND COLUMN_NAME='createdAt')
        ALTER TABLE Orders ADD createdAt DATETIME DEFAULT GETDATE()
    `);
    console.log('Orders table ready');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CreditAccounts' AND xtype='U')
        CREATE TABLE CreditAccounts (
            id INT IDENTITY(1,1) PRIMARY KEY,
            userId INT NOT NULL UNIQUE,
            creditLimit DECIMAL(10,2) DEFAULT 50000,
            usedCredit DECIMAL(10,2) DEFAULT 0,
            createdAt DATETIME DEFAULT GETDATE()
        )
    `);
    console.log('CreditAccounts table ready');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' AND xtype='U')
        CREATE TABLE Invoices (
            id INT IDENTITY(1,1) PRIMARY KEY,
            invoiceNumber NVARCHAR(50) UNIQUE NOT NULL,
            userId INT NOT NULL,
            orderId INT NOT NULL,
            subtotal DECIMAL(10,2) NOT NULL,
            cgst DECIMAL(10,2) NOT NULL,
            sgst DECIMAL(10,2) NOT NULL,
            totalAmount DECIMAL(10,2) NOT NULL,
            paidAmount DECIMAL(10,2) DEFAULT 0,
            status NVARCHAR(20) DEFAULT 'Unpaid',
            createdAt DATETIME DEFAULT GETDATE()
        )
    `);
    console.log('Invoices table ready');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Payments' AND xtype='U')
        CREATE TABLE Payments (
            id INT IDENTITY(1,1) PRIMARY KEY,
            invoiceId INT NOT NULL,
            userId INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            paymentMode NVARCHAR(50) DEFAULT 'Cash',
            createdAt DATETIME DEFAULT GETDATE()
        )
    `);
    console.log('Payments table ready');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Returns' AND xtype='U')
        CREATE TABLE Returns (
            id INT IDENTITY(1,1) PRIMARY KEY,
            orderId INT NOT NULL,
            userId INT NOT NULL,
            reason NVARCHAR(500) NOT NULL,
            status NVARCHAR(20) DEFAULT 'Pending',
            refundAmount DECIMAL(10,2) NULL,
            createdAt DATETIME DEFAULT GETDATE()
        )
    `);
    console.log('Returns table ready');

    await sql.query(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Promotions' AND xtype='U')
        CREATE TABLE Promotions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            title NVARCHAR(100) NOT NULL,
            discountType NVARCHAR(20) NOT NULL,
            discountValue DECIMAL(10,2) NOT NULL,
            minQuantity INT DEFAULT 1,
            productId INT NULL,
            isActive BIT DEFAULT 1,
            createdAt DATETIME DEFAULT GETDATE()
        )
    `);
    console.log('Promotions table ready');
})
.catch(err => console.log(err));

// Register
app.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await sql.query`INSERT INTO Users (fullName, email, password, role) VALUES (${name}, ${email}, ${hashedPassword}, ${role})`;
        res.json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await sql.query`SELECT * FROM Users WHERE email = ${email}`;
        const user = result.recordset[0];
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        if (user.role === 'retailer' && !user.isApproved) {
            return res.status(403).json({ message: 'Account pending approval from distributor' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, name: user.fullName, id: user.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Products with search and filter (expired blocked, FIFO order)
app.get('/products', async (req, res) => {
    const { search, category } = req.query;
    try {
        let query = `SELECT * FROM Products WHERE 1=1 AND (expiryDate IS NULL OR expiryDate > GETDATE())`;
        if (search) query += ` AND productName LIKE '%${search}%'`;
        if (category) query += ` AND category = '${category}'`;
        query += ` ORDER BY expiryDate ASC`;
        const result = await sql.query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Get all categories
app.get('/categories', async (req, res) => {
    try {
        const result = await sql.query('SELECT DISTINCT category FROM Products WHERE category IS NOT NULL');
        res.json(result.recordset.map(r => r.category));
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Place Order
app.post('/orders', async (req, res) => {
    const { userId, productId, quantity, totalPrice } = req.body;
    try {
        // Check credit
        let credit = await sql.query`SELECT * FROM CreditAccounts WHERE userId = ${userId}`;
        if (credit.recordset.length === 0) {
            await sql.query`INSERT INTO CreditAccounts (userId) VALUES (${userId})`;
            credit = await sql.query`SELECT * FROM CreditAccounts WHERE userId = ${userId}`;
        }
        const account = credit.recordset[0];
        const remaining = account.creditLimit - account.usedCredit;
        if (totalPrice > remaining) {
            return res.status(400).json({ message: `Credit limit exceeded! Remaining credit: ₹${remaining}` });
        }
        await sql.query`INSERT INTO Orders (userId, productId, quantity, totalPrice, status) VALUES (${userId}, ${productId}, ${quantity}, ${totalPrice}, 'Pending')`;
        await sql.query`UPDATE CreditAccounts SET usedCredit = usedCredit + ${totalPrice} WHERE userId = ${userId}`;
        const newOrder = await sql.query`SELECT TOP 1 id FROM Orders WHERE userId = ${userId} ORDER BY id DESC`;
        const orderId = newOrder.recordset[0].id;

        // Get user email
        const userResult = await sql.query`SELECT email, fullName FROM Users WHERE id = ${userId}`;
        const user = userResult.recordset[0];

        // Send order confirmation email
        await sendEmail(
            user.email,
            '✅ Order Placed Successfully - B2B Pharmacy',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#1890ff;">Order Confirmed!</h2>
                <p>Dear <strong>${user.fullName}</strong>,</p>
                <p>Your order has been placed successfully.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr style="background:#f0f2f5;"><td style="padding:10px;"><strong>Order ID</strong></td><td style="padding:10px;">#${orderId}</td></tr>
                    <tr><td style="padding:10px;"><strong>Amount</strong></td><td style="padding:10px;">₹${totalPrice}</td></tr>
                    <tr style="background:#f0f2f5;"><td style="padding:10px;"><strong>Status</strong></td><td style="padding:10px;">Pending</td></tr>
                </table>
                <p style="color:#888;">Thank you for your order!</p>
                <p style="color:#1890ff;"><strong>B2B Pharmacy Team</strong></p>
            </div>`
        );

        res.json({ message: 'Order placed successfully', orderId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Orders by User
app.get('/orders/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await sql.query`
            SELECT o.id, o.quantity, o.totalPrice, o.status, o.createdAt,
                   p.productName, p.imageUrl
            FROM Orders o
            JOIN Products p ON o.productId = p.id
            WHERE o.userId = ${userId}
            ORDER BY o.createdAt DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Order Status (Distributor)
app.put('/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await sql.query`UPDATE Orders SET status = ${status} WHERE id = ${id}`;

        // Send status update email to retailer
        const orderResult = await sql.query`
            SELECT o.userId, o.totalPrice, u.email, u.fullName, p.productName
            FROM Orders o
            JOIN Users u ON o.userId = u.id
            JOIN Products p ON o.productId = p.id
            WHERE o.id = ${id}`;
        const order = orderResult.recordset[0];

        const statusColors = { Approved: '#52c41a', Packed: '#722ed1', Dispatched: '#fa8c16', Delivered: '#1890ff' };
        const color = statusColors[status] || '#333';

        await sendEmail(
            order.email,
            `📦 Order Status Updated: ${status} - B2B Pharmacy`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:${color};">Order ${status}!</h2>
                <p>Dear <strong>${order.fullName}</strong>,</p>
                <p>Your order status has been updated.</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr style="background:#f0f2f5;"><td style="padding:10px;"><strong>Order ID</strong></td><td style="padding:10px;">#${id}</td></tr>
                    <tr><td style="padding:10px;"><strong>Product</strong></td><td style="padding:10px;">${order.productName}</td></tr>
                    <tr style="background:#f0f2f5;"><td style="padding:10px;"><strong>Amount</strong></td><td style="padding:10px;">₹${order.totalPrice}</td></tr>
                    <tr><td style="padding:10px;"><strong>New Status</strong></td><td style="padding:10px;color:${color};"><strong>${status}</strong></td></tr>
                </table>
                <p style="color:#1890ff;"><strong>B2B Pharmacy Team</strong></p>
            </div>`
        );

        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Retailers (Distributor)
app.get('/retailers', authenticate, authorizeDistributor, async (req, res) => {
    try {
        const result = await sql.query(`SELECT id, fullName, email, isApproved, createdAt FROM Users WHERE role = 'retailer'`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve/Reject Retailer (Distributor)
app.put('/retailers/:id/approve', authenticate, authorizeDistributor, async (req, res) => {
    const { id } = req.params;
    const { isApproved } = req.body;
    try {
        await sql.query`UPDATE Users SET isApproved = ${isApproved} WHERE id = ${id}`;
        if (isApproved) {
            const user = await sql.query`SELECT email, fullName FROM Users WHERE id = ${id}`;
            await sendEmail(
                user.recordset[0].email,
                '✅ Account Approved - B2B Pharmacy',
                `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                    <h2 style="color:#52c41a;">Account Approved!</h2>
                    <p>Dear <strong>${user.recordset[0].fullName}</strong>,</p>
                    <p>Your retailer account has been approved. You can now login and place orders.</p>
                    <p style="color:#1890ff;"><strong>B2B Pharmacy Team</strong></p>
                </div>`
            );
        }
        res.json({ message: isApproved ? 'Retailer approved' : 'Retailer rejected' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Orders (Distributor)
app.get('/orders', authenticate, authorizeDistributor, async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT o.id, o.quantity, o.totalPrice, o.status, o.createdAt,
                   p.productName, u.fullName as retailerName
            FROM Orders o
            JOIN Products p ON o.productId = p.id
            JOIN Users u ON o.userId = u.id
            ORDER BY o.createdAt DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Credit Account
app.get('/credit/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        let result = await sql.query`SELECT * FROM CreditAccounts WHERE userId = ${userId}`;
        if (result.recordset.length === 0) {
            await sql.query`INSERT INTO CreditAccounts (userId) VALUES (${userId})`;
            result = await sql.query`SELECT * FROM CreditAccounts WHERE userId = ${userId}`;
        }
        const account = result.recordset[0];
        res.json({
            creditLimit: account.creditLimit,
            usedCredit: account.usedCredit,
            remainingCredit: account.creditLimit - account.usedCredit
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update Credit Limit (Distributor)
app.put('/credit/:userId', authenticate, authorizeDistributor, async (req, res) => {
    const { userId } = req.params;
    const { creditLimit } = req.body;
    try {
        const exists = await sql.query`SELECT * FROM CreditAccounts WHERE userId = ${userId}`;
        if (exists.recordset.length === 0) {
            await sql.query`INSERT INTO CreditAccounts (userId, creditLimit) VALUES (${userId}, ${creditLimit})`;
        } else {
            await sql.query`UPDATE CreditAccounts SET creditLimit = ${creditLimit} WHERE userId = ${userId}`;
        }
        res.json({ message: 'Credit limit updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Retailers Credit (Distributor)
app.get('/credits', authenticate, authorizeDistributor, async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT u.id, u.fullName, u.email,
                   ISNULL(c.creditLimit, 50000) as creditLimit,
                   ISNULL(c.usedCredit, 0) as usedCredit,
                   ISNULL(c.creditLimit, 50000) - ISNULL(c.usedCredit, 0) as remainingCredit
            FROM Users u
            LEFT JOIN CreditAccounts c ON u.id = c.userId
            WHERE u.role = 'retailer'
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Invoice
app.post('/invoices', async (req, res) => {
    const { userId, orderId, subtotal, gstRate = 18 } = req.body;
    try {
        const cgst = parseFloat((subtotal * gstRate / 200).toFixed(2));
        const sgst = parseFloat((subtotal * gstRate / 200).toFixed(2));
        const totalAmount = parseFloat((subtotal + cgst + sgst).toFixed(2));
        const invoiceNumber = 'INV-' + Date.now();
        await sql.query`INSERT INTO Invoices (invoiceNumber, userId, orderId, subtotal, cgst, sgst, totalAmount) VALUES (${invoiceNumber}, ${userId}, ${orderId}, ${subtotal}, ${cgst}, ${sgst}, ${totalAmount})`;
        const result = await sql.query`SELECT * FROM Invoices WHERE invoiceNumber = ${invoiceNumber}`;
        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Invoices by User
app.get('/invoices/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await sql.query`
            SELECT i.*, o.quantity, p.productName, p.hsnCode
            FROM Invoices i
            JOIN Orders o ON i.orderId = o.id
            JOIN Products p ON o.productId = p.id
            WHERE i.userId = ${userId}
            ORDER BY i.createdAt DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Invoices (Distributor)
app.get('/invoices', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT i.*, u.fullName as retailerName, p.productName, p.hsnCode
            FROM Invoices i
            JOIN Users u ON i.userId = u.id
            JOIN Orders o ON i.orderId = o.id
            JOIN Products p ON o.productId = p.id
            ORDER BY i.createdAt DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Promotions
app.get('/promotions', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT p.*, pr.productName
            FROM Promotions p
            LEFT JOIN Products pr ON p.productId = pr.id
            ORDER BY p.createdAt DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Promotion (Distributor)
app.post('/promotions', async (req, res) => {
    const { title, discountType, discountValue, minQuantity, productId } = req.body;
    try {
        await sql.query`INSERT INTO Promotions (title, discountType, discountValue, minQuantity, productId) VALUES (${title}, ${discountType}, ${discountValue}, ${minQuantity}, ${productId || null})`;
        res.json({ message: 'Promotion created' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Toggle Promotion Active/Inactive
app.put('/promotions/:id', async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    try {
        await sql.query`UPDATE Promotions SET isActive = ${isActive} WHERE id = ${id}`;
        res.json({ message: 'Promotion updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Active Promotions for a Product
app.get('/promotions/product/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        const result = await sql.query`
            SELECT * FROM Promotions
            WHERE isActive = 1 AND (productId = ${productId} OR productId IS NULL)
            ORDER BY discountValue DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Sales Report
app.get('/reports/sales', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT 
                CONVERT(DATE, o.createdAt) as date,
                COUNT(o.id) as totalOrders,
                SUM(o.totalPrice) as totalRevenue,
                COUNT(DISTINCT o.userId) as uniqueRetailers
            FROM Orders o
            GROUP BY CONVERT(DATE, o.createdAt)
            ORDER BY date DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Inventory Report
app.get('/reports/inventory', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT id, productName, category, stock, price, expiryDate,
                CASE 
                    WHEN stock = 0 THEN 'Out of Stock'
                    WHEN stock < 20 THEN 'Low Stock'
                    ELSE 'In Stock'
                END as stockStatus
            FROM Products
            ORDER BY stock ASC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Retailer Analytics
app.get('/reports/retailers', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT 
                u.id, u.fullName, u.email,
                COUNT(o.id) as totalOrders,
                ISNULL(SUM(o.totalPrice), 0) as totalPurchases,
                ISNULL(c.usedCredit, 0) as usedCredit,
                ISNULL(c.creditLimit, 50000) as creditLimit
            FROM Users u
            LEFT JOIN Orders o ON u.id = o.userId
            LEFT JOIN CreditAccounts c ON u.id = c.userId
            WHERE u.role = 'retailer'
            GROUP BY u.id, u.fullName, u.email, c.usedCredit, c.creditLimit
            ORDER BY totalPurchases DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Outstanding Payments Report
app.get('/reports/outstanding', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT 
                u.fullName as retailerName, u.email,
                i.invoiceNumber, i.totalAmount, i.paidAmount,
                i.totalAmount - i.paidAmount as outstanding,
                i.status, i.createdAt
            FROM Invoices i
            JOIN Users u ON i.userId = u.id
            WHERE i.status != 'Paid'
            ORDER BY outstanding DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create Return Request
app.post('/returns', async (req, res) => {
    const { orderId, userId, reason } = req.body;
    try {
        const existing = await sql.query`SELECT * FROM Returns WHERE orderId = ${orderId} AND userId = ${userId}`;
        if (existing.recordset.length > 0) return res.status(400).json({ message: 'Return request already submitted for this order' });
        await sql.query`INSERT INTO Returns (orderId, userId, reason) VALUES (${orderId}, ${userId}, ${reason})`;
        res.json({ message: 'Return request submitted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Returns by User
app.get('/returns/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await sql.query`
            SELECT r.*, p.productName, o.totalPrice
            FROM Returns r
            JOIN Orders o ON r.orderId = o.id
            JOIN Products p ON o.productId = p.id
            WHERE r.userId = ${userId}
            ORDER BY r.createdAt DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Returns (Distributor)
app.get('/returns', async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT r.*, p.productName, o.totalPrice, u.fullName as retailerName
            FROM Returns r
            JOIN Orders o ON r.orderId = o.id
            JOIN Products p ON o.productId = p.id
            JOIN Users u ON r.userId = u.id
            ORDER BY r.createdAt DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Approve/Reject Return (Distributor)
app.put('/returns/:id', async (req, res) => {
    const { id } = req.params;
    const { status, refundAmount } = req.body;
    try {
        await sql.query`UPDATE Returns SET status = ${status}, refundAmount = ${refundAmount} WHERE id = ${id}`;
        if (status === 'Approved') {
            const ret = await sql.query`SELECT * FROM Returns WHERE id = ${id}`;
            const userId = ret.recordset[0].userId;
            await sql.query`UPDATE CreditAccounts SET usedCredit = usedCredit - ${refundAmount} WHERE userId = ${userId}`;
        }
        res.json({ message: `Return ${status}` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Make Payment
app.post('/payments', async (req, res) => {
    const { invoiceId, userId, amount, paymentMode } = req.body;
    try {
        const invoice = await sql.query`SELECT * FROM Invoices WHERE id = ${invoiceId}`;
        const inv = invoice.recordset[0];
        const newPaid = parseFloat(inv.paidAmount) + parseFloat(amount);
        const status = newPaid >= inv.totalAmount ? 'Paid' : 'Partial';
        await sql.query`INSERT INTO Payments (invoiceId, userId, amount, paymentMode) VALUES (${invoiceId}, ${userId}, ${amount}, ${paymentMode})`;
        await sql.query`UPDATE Invoices SET paidAmount = ${newPaid}, status = ${status} WHERE id = ${invoiceId}`;
        if (status === 'Paid') {
            await sql.query`UPDATE CreditAccounts SET usedCredit = usedCredit - ${inv.totalAmount} WHERE userId = ${userId}`;
        }

        // Send payment confirmation email
        const userResult = await sql.query`SELECT email, fullName FROM Users WHERE id = ${userId}`;
        const user = userResult.recordset[0];
        await sendEmail(
            user.email,
            `💰 Payment Received - B2B Pharmacy`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                <h2 style="color:#52c41a;">Payment Confirmed!</h2>
                <p>Dear <strong>${user.fullName}</strong>,</p>
                <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                    <tr style="background:#f0f2f5;"><td style="padding:10px;"><strong>Invoice</strong></td><td style="padding:10px;">${inv.invoiceNumber}</td></tr>
                    <tr><td style="padding:10px;"><strong>Amount Paid</strong></td><td style="padding:10px;">₹${amount}</td></tr>
                    <tr style="background:#f0f2f5;"><td style="padding:10px;"><strong>Payment Mode</strong></td><td style="padding:10px;">${paymentMode}</td></tr>
                    <tr><td style="padding:10px;"><strong>Status</strong></td><td style="padding:10px;color:#52c41a;"><strong>${status}</strong></td></tr>
                </table>
                <p style="color:#1890ff;"><strong>B2B Pharmacy Team</strong></p>
            </div>`
        );

        res.json({ message: 'Payment recorded', status });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
