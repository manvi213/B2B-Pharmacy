import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Tag, Select, Typography, Avatar, Button } from 'antd';
import { ShoppingOutlined, MedicineBoxOutlined, AppstoreOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const statusColors = {
    Pending: 'orange',
    Approved: 'blue',
    Packed: 'purple',
    Dispatched: 'cyan',
    Delivered: 'green'
};

function Orders() {
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const url = role === 'distributor' ? 'http://localhost:5000/orders' : `http://localhost:5000/orders/${userId}`;
                const res = await axios.get(url, { headers });
                setOrders(res.data);
            } catch (err) { console.log(err); }
        };
        fetchOrders();
    }, [userId, role]);

    const updateStatus = async (orderId, status) => {
        try {
            await axios.put(`http://localhost:5000/orders/${orderId}/status`, { status });
            setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
        } catch (err) { alert('Status update failed'); }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const columns = [
        {
            title: 'Product',
            dataIndex: 'productName',
            render: name => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={styles.productIcon}><MedicineBoxOutlined style={{ color: '#1890ff' }} /></div>
                    <Text strong>{name}</Text>
                </div>
            )
        },
        ...(role === 'distributor' ? [{
            title: 'Retailer',
            dataIndex: 'retailerName',
            render: name => <Text>{name}</Text>
        }] : []),
        { title: 'Qty', dataIndex: 'quantity', render: qty => <Text>{qty}</Text> },
        { title: 'Total', dataIndex: 'totalPrice', render: price => <Text strong style={{ color: '#52c41a' }}>₹{price}</Text> },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status, record) => role === 'distributor' ? (
                <Select value={status} onChange={val => updateStatus(record.id, val)} style={{ width: 130 }} size="small">
                    {['Pending', 'Approved', 'Packed', 'Dispatched', 'Delivered'].map(s => (
                        <Option key={s} value={s}>{s}</Option>
                    ))}
                </Select>
            ) : (
                <Tag color={statusColors[status]}>{status}</Tag>
            )
        },
        { title: 'Date', dataIndex: 'createdAt', render: date => <Text type="secondary">{new Date(date).toLocaleDateString()}</Text> }
    ];

    const menuItems = [
        { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
        { key: 'products', icon: <MedicineBoxOutlined />, label: 'Products' },
        { key: 'orders', icon: <ShoppingOutlined />, label: 'Orders' },
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
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['orders']}
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
                    <Title level={4} style={styles.headerTitle}>{role === 'distributor' ? 'All Orders' : 'My Orders'}</Title>
                </Header>
                <Content style={styles.content}>
                    <Card style={styles.tableCard} bordered={false}>
                        <Table dataSource={orders} columns={columns} rowKey="id"
                            pagination={{ pageSize: 10 }}
                            locale={{ emptyText: 'No orders found' }}
                        />
                    </Card>
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
    content: { marginLeft: 240, padding: '32px', backgroundColor: '#f0f2f5' },
    tableCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    productIcon: { width: '36px', height: '36px', background: '#e6f7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

export default Orders;
