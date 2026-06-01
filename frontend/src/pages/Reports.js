import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Tag, Button, Typography, Avatar, Tabs, Statistic, Row, Col, Progress } from 'antd';
import { BarChartOutlined, MedicineBoxOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, CreditCardOutlined, FileTextOutlined, RollbackOutlined, GiftOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;

function Reports() {
    const [salesData, setSalesData] = useState([]);
    const [inventoryData, setInventoryData] = useState([]);
    const [retailerData, setRetailerData] = useState([]);
    const [outstandingData, setOutstandingData] = useState([]);
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    useEffect(() => {
        axios.get('http://localhost:5000/reports/sales').then(r => setSalesData(r.data)).catch(console.log);
        axios.get('http://localhost:5000/reports/inventory').then(r => setInventoryData(r.data)).catch(console.log);
        axios.get('http://localhost:5000/reports/retailers').then(r => setRetailerData(r.data)).catch(console.log);
        axios.get('http://localhost:5000/reports/outstanding').then(r => setOutstandingData(r.data)).catch(console.log);
    }, []);

    const totalRevenue = salesData.reduce((sum, r) => sum + parseFloat(r.totalRevenue || 0), 0);
    const totalOrders = salesData.reduce((sum, r) => sum + parseInt(r.totalOrders || 0), 0);
    const outstandingTotal = outstandingData.reduce((sum, r) => sum + parseFloat(r.outstanding || 0), 0);

    const downloadPDF = (title, columns, data) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`B2B Pharmacy - ${title}`, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
        autoTable(doc, { startY: 35, head: [columns], body: data });
        doc.save(`${title}.pdf`);
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const menuItems = [
        { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
        { key: 'products', icon: <MedicineBoxOutlined />, label: 'Products' },
        { key: 'orders', icon: <ShoppingOutlined />, label: 'Orders' },
        { key: 'credit', icon: <CreditCardOutlined />, label: 'Credit' },
        { key: 'billing', icon: <FileTextOutlined />, label: 'Billing' },
        { key: 'returns', icon: <RollbackOutlined />, label: 'Returns' },
        { key: 'promotions', icon: <GiftOutlined />, label: 'Promotions' },
        { key: 'reports', icon: <BarChartOutlined />, label: 'Reports' },
    ];

    const salesColumns = [
        { title: 'Date', dataIndex: 'date', render: v => new Date(v).toLocaleDateString() },
        { title: 'Total Orders', dataIndex: 'totalOrders' },
        { title: 'Revenue', dataIndex: 'totalRevenue', render: v => <Text strong style={{ color: '#52c41a' }}>₹{parseFloat(v).toFixed(2)}</Text> },
        { title: 'Unique Retailers', dataIndex: 'uniqueRetailers' },
    ];

    const inventoryColumns = [
        { title: 'Product', dataIndex: 'productName', render: v => <Text strong>{v}</Text> },
        { title: 'Category', dataIndex: 'category' },
        { title: 'Stock', dataIndex: 'stock' },
        { title: 'Price', dataIndex: 'price', render: v => `₹${v}` },
        { title: 'Expiry', dataIndex: 'expiryDate', render: v => v ? new Date(v).toLocaleDateString() : '-' },
        { title: 'Status', dataIndex: 'stockStatus', render: v => <Tag color={v === 'In Stock' ? 'green' : v === 'Low Stock' ? 'orange' : 'red'}>{v}</Tag> },
    ];

    const retailerColumns = [
        { title: 'Retailer', dataIndex: 'fullName', render: (v, r) => <div><Text strong>{v}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text></div> },
        { title: 'Total Orders', dataIndex: 'totalOrders' },
        { title: 'Total Purchases', dataIndex: 'totalPurchases', render: v => <Text strong style={{ color: '#1890ff' }}>₹{parseFloat(v).toFixed(2)}</Text> },
        { title: 'Credit Used', dataIndex: 'usedCredit', render: v => `₹${v}` },
        { title: 'Credit Usage', render: (_, r) => <Progress percent={Math.round((r.usedCredit / r.creditLimit) * 100)} size="small" strokeColor={r.usedCredit / r.creditLimit > 0.8 ? '#ff4d4f' : '#1890ff'} /> },
    ];

    const outstandingColumns = [
        { title: 'Retailer', dataIndex: 'retailerName', render: (v, r) => <div><Text strong>{v}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text></div> },
        { title: 'Invoice', dataIndex: 'invoiceNumber', render: v => <Text style={{ color: '#1890ff' }}>{v}</Text> },
        { title: 'Total', dataIndex: 'totalAmount', render: v => `₹${v}` },
        { title: 'Paid', dataIndex: 'paidAmount', render: v => <Text style={{ color: '#52c41a' }}>₹{v}</Text> },
        { title: 'Outstanding', dataIndex: 'outstanding', render: v => <Text strong style={{ color: '#ff4d4f' }}>₹{parseFloat(v).toFixed(2)}</Text> },
        { title: 'Status', dataIndex: 'status', render: v => <Tag color={v === 'Partial' ? 'orange' : 'red'}>{v}</Tag> },
    ];

    const tabItems = [
        {
            key: '1', label: 'Sales Report',
            children: (
                <Card bordered={false} style={styles.tabCard}>
                    <div style={styles.tableHeader}>
                        <Text strong>Daily Sales Report</Text>
                        <Button icon={<DownloadOutlined />} onClick={() => downloadPDF('Sales Report',
                            ['Date', 'Orders', 'Revenue', 'Retailers'],
                            salesData.map(r => [new Date(r.date).toLocaleDateString(), r.totalOrders, `Rs ${r.totalRevenue}`, r.uniqueRetailers])
                        )}>Export PDF</Button>
                    </div>
                    <Table dataSource={salesData} columns={salesColumns} rowKey="date" pagination={{ pageSize: 10 }} />
                </Card>
            )
        },
        {
            key: '2', label: 'Inventory Report',
            children: (
                <Card bordered={false} style={styles.tabCard}>
                    <div style={styles.tableHeader}>
                        <Text strong>Inventory Status</Text>
                        <Button icon={<DownloadOutlined />} onClick={() => downloadPDF('Inventory Report',
                            ['Product', 'Category', 'Stock', 'Price', 'Status'],
                            inventoryData.map(r => [r.productName, r.category, r.stock, `Rs ${r.price}`, r.stockStatus])
                        )}>Export PDF</Button>
                    </div>
                    <Table dataSource={inventoryData} columns={inventoryColumns} rowKey="id" pagination={{ pageSize: 10 }} />
                </Card>
            )
        },
        {
            key: '3', label: 'Retailer Analytics',
            children: (
                <Card bordered={false} style={styles.tabCard}>
                    <div style={styles.tableHeader}>
                        <Text strong>Retailer Performance</Text>
                        <Button icon={<DownloadOutlined />} onClick={() => downloadPDF('Retailer Analytics',
                            ['Retailer', 'Orders', 'Purchases', 'Credit Used'],
                            retailerData.map(r => [r.fullName, r.totalOrders, `Rs ${r.totalPurchases}`, `Rs ${r.usedCredit}`])
                        )}>Export PDF</Button>
                    </div>
                    <Table dataSource={retailerData} columns={retailerColumns} rowKey="id" pagination={{ pageSize: 10 }} />
                </Card>
            )
        },
        {
            key: '4', label: 'Outstanding Payments',
            children: (
                <Card bordered={false} style={styles.tabCard}>
                    <div style={styles.tableHeader}>
                        <Text strong>Pending Payments</Text>
                        <Button icon={<DownloadOutlined />} onClick={() => downloadPDF('Outstanding Payments',
                            ['Retailer', 'Invoice', 'Total', 'Paid', 'Outstanding'],
                            outstandingData.map(r => [r.retailerName, r.invoiceNumber, `Rs ${r.totalAmount}`, `Rs ${r.paidAmount}`, `Rs ${r.outstanding}`])
                        )}>Export PDF</Button>
                    </div>
                    <Table dataSource={outstandingData} columns={outstandingColumns} rowKey="invoiceNumber" pagination={{ pageSize: 10 }} />
                </Card>
            )
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={240} style={styles.sider}>
                <div style={styles.logo}>
                    <MedicineBoxOutlined style={styles.logoIcon} />
                    <span style={styles.logoText}>B2B Pharmacy</span>
                </div>
                <div style={styles.userInfo}>
                    <Avatar size={48} icon={<UserOutlined />} style={styles.avatar} />
                    <div>
                        <Text style={styles.userName}>{name}</Text>
                        <br />
                        <Tag color={role === 'distributor' ? 'blue' : 'green'} style={{ marginTop: 4 }}>
                            {role === 'distributor' ? 'Distributor' : 'Retailer'}
                        </Tag>
                    </div>
                </div>
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['reports']}
                    style={{ background: 'transparent', border: 'none' }}
                    items={menuItems}
                    onClick={({ key }) => navigate(`/${key}`)}
                />
                <div style={styles.logoutSection}>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout} style={styles.logoutBtn} block>Logout</Button>
                </div>
            </Sider>
            <Layout>
                <Header style={styles.header}>
                    <Title level={4} style={styles.headerTitle}>Reports & Analytics</Title>
                </Header>
                <Content style={styles.content}>
                    <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                        <Col span={8}>
                            <Card bordered={false} style={styles.statCard}>
                                <Statistic title="Total Revenue" value={totalRevenue.toFixed(2)} prefix="₹" valueStyle={{ color: '#52c41a' }} />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card bordered={false} style={styles.statCard}>
                                <Statistic title="Total Orders" value={totalOrders} valueStyle={{ color: '#1890ff' }} />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card bordered={false} style={styles.statCard}>
                                <Statistic title="Outstanding Amount" value={outstandingTotal.toFixed(2)} prefix="₹" valueStyle={{ color: '#ff4d4f' }} />
                            </Card>
                        </Col>
                    </Row>
                    <Tabs defaultActiveKey="1" items={tabItems} />
                </Content>
            </Layout>
        </Layout>
    );
}

const styles = {
    sider: { background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 },
    logo: { padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    logoIcon: { fontSize: '28px', color: '#1890ff' },
    logoText: { color: '#fff', fontSize: '18px', fontWeight: 'bold' },
    userInfo: { padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' },
    avatar: { background: '#1890ff', flexShrink: 0 },
    userName: { color: '#fff', fontWeight: '600', fontSize: '14px' },
    logoutSection: { position: 'absolute', bottom: '24px', left: '16px', right: '16px' },
    logoutBtn: { background: 'rgba(255,77,79,0.2)', border: '1px solid rgba(255,77,79,0.5)', color: '#ff4d4f' },
    header: { background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginLeft: 240 },
    headerTitle: { margin: 0, color: '#1a1a2e' },
    content: { marginLeft: 240, padding: '32px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' },
    statCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    tabCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
};

export default Reports;
