import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Typography, Avatar, Tag, Button, Progress, InputNumber, message } from 'antd';
import { CreditCardOutlined, MedicineBoxOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;

function Credit() {
    const [creditData, setCreditData] = useState(null);
    const [retailers, setRetailers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [newLimit, setNewLimit] = useState(0);
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    useEffect(() => {
        if (role === 'retailer') {
            axios.get(`http://localhost:5000/credit/${userId}`)
                .then(res => setCreditData(res.data))
                .catch(err => console.log(err));
        } else {
            axios.get('http://localhost:5000/credits')
                .then(res => setRetailers(res.data))
                .catch(err => console.log(err));
        }
    }, [userId, role]);

    const updateLimit = async (retailerId) => {
        try {
            await axios.put(`http://localhost:5000/credit/${retailerId}`, { creditLimit: newLimit });
            message.success('Credit limit updated!');
            setEditingId(null);
            const res = await axios.get('http://localhost:5000/credits');
            setRetailers(res.data);
        } catch (err) {
            message.error('Update failed');
        }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const menuItems = [
        { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
        { key: 'products', icon: <MedicineBoxOutlined />, label: 'Products' },
        { key: 'orders', icon: <ShoppingOutlined />, label: 'Orders' },
        { key: 'credit', icon: <CreditCardOutlined />, label: 'Credit' },
    ];

    const columns = [
        { title: 'Retailer', dataIndex: 'fullName', render: (n, r) => <div><Text strong>{n}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text></div> },
        { title: 'Credit Limit', dataIndex: 'creditLimit', render: (val, record) => editingId === record.id ? (
            <div style={{ display: 'flex', gap: 8 }}>
                <InputNumber min={0} defaultValue={val} onChange={v => setNewLimit(v)} style={{ width: 120 }} />
                <Button type="primary" size="small" onClick={() => updateLimit(record.id)}>Save</Button>
                <Button size="small" onClick={() => setEditingId(null)}>Cancel</Button>
            </div>
        ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text strong>₹{val}</Text>
                <Button icon={<EditOutlined />} size="small" type="text" onClick={() => { setEditingId(record.id); setNewLimit(val); }} />
            </div>
        )},
        { title: 'Used', dataIndex: 'usedCredit', render: val => <Text style={{ color: '#ff4d4f' }}>₹{val}</Text> },
        { title: 'Remaining', dataIndex: 'remainingCredit', render: val => <Text style={{ color: '#52c41a' }}>₹{val}</Text> },
        { title: 'Usage', render: (_, r) => (
            <Progress percent={Math.round((r.usedCredit / r.creditLimit) * 100)} size="small"
                strokeColor={r.usedCredit / r.creditLimit > 0.8 ? '#ff4d4f' : '#1890ff'} />
        )}
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
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['credit']}
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
                    <Title level={4} style={styles.headerTitle}>Credit Management</Title>
                </Header>
                <Content style={styles.content}>
                    {role === 'retailer' && creditData ? (
                        <div>
                            <Title level={4} style={{ marginBottom: 24 }}>My Credit Account</Title>
                            <div style={styles.creditGrid}>
                                <Card style={styles.creditCard} bordered={false}>
                                    <Text type="secondary">Credit Limit</Text>
                                    <Title level={2} style={{ margin: '8px 0', color: '#1890ff' }}>₹{creditData.creditLimit}</Title>
                                </Card>
                                <Card style={styles.creditCard} bordered={false}>
                                    <Text type="secondary">Used Credit</Text>
                                    <Title level={2} style={{ margin: '8px 0', color: '#ff4d4f' }}>₹{creditData.usedCredit}</Title>
                                </Card>
                                <Card style={styles.creditCard} bordered={false}>
                                    <Text type="secondary">Remaining Credit</Text>
                                    <Title level={2} style={{ margin: '8px 0', color: '#52c41a' }}>₹{creditData.remainingCredit}</Title>
                                </Card>
                            </div>
                            <Card style={styles.progressCard} bordered={false}>
                                <Text strong>Credit Usage</Text>
                                <Progress
                                    percent={Math.round((creditData.usedCredit / creditData.creditLimit) * 100)}
                                    strokeColor={creditData.usedCredit / creditData.creditLimit > 0.8 ? '#ff4d4f' : '#1890ff'}
                                    style={{ marginTop: 16 }}
                                />
                            </Card>
                        </div>
                    ) : role === 'distributor' ? (
                        <Card style={styles.tableCard} bordered={false}>
                            <Title level={4} style={{ marginBottom: 16 }}>Retailer Credit Accounts</Title>
                            <Table dataSource={retailers} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
                        </Card>
                    ) : null}
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
    creditGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' },
    creditCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '8px' },
    progressCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '8px' },
    tableCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
};

export default Credit;
