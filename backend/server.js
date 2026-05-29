const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const JWT_SECRET = 'b2bpharma_secret_key';

app.use(cors());
app.use(express.json());

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

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: user.role, name: user.fullName, id: user.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Products with search and filter
app.get('/products', async (req, res) => {
    const { search, category } = req.query;
    try {
        let query = 'SELECT * FROM Products WHERE 1=1';
        if (search) query += ` AND productName LIKE '%${search}%'`;
        if (category) query += ` AND category = '${category}'`;
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
        await sql.query`INSERT INTO Orders (userId, productId, quantity, totalPrice, status) VALUES (${userId}, ${productId}, ${quantity}, ${totalPrice}, 'Pending')`;
        res.json({ message: 'Order placed successfully' });
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
        res.json({ message: 'Order status updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get All Orders (Distributor)
app.get('/orders', async (req, res) => {
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

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
