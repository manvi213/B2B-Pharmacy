import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Tag, Button, Typography, Avatar, message, Tabs } from 'antd';
import { TeamOutlined, MedicineBoxOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, CreditCardOutlined, FileTextOutlined, RollbackOutlined, GiftOutlined, BarChartOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;

function RetailerApprovals() {
    const [retailers, setRetailers] = useState([]);
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const token = localStorage.getItem('token');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchRetailers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/retailers', { headers });
            setRetailers(res.data);
        } catch (err) { console.log(err); }
    };

    useEffect(() => { fetchRetailers(); }, []);

    const handleApproval = async (id, isApproved) => {
        try {
            await axios.put(`http://localhost:5000/retailers/${id}/approve`, { isApproved }, { headers });
            message.success(isApproved ? 'Retailer approved!' : 'Retailer rejected!');
            fetchRetailers();
        } catch (err) {
            message.error('Action failed');
        }
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
        { key: 'retailers', icon: <TeamOutlined />, label: 'Retailers' },
    ];

    const pendingRetailers = retailers.filter(r => !r.isApproved);
    const approvedRetailers = retailers.filter(r => r.isApproved);

    const columns = (isPending) => [
        { title: 'Name', dataIndex: 'fullName', render: (v, r) => <div><Text strong>{v}</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>{r.email}</Text></div> },
        { title: 'Registered', dataIndex: 'createdAt', render: v => new Date(v).toLocaleDateString() },
        { title: 'Status', dataIndex: 'isApproved', render: v => <Tag color={v ? 'green' : 'orange'}>{v ? 'Approved' : 'Pending'}</Tag> },
        isPending ? {
            title: 'Actions', render: (_, record) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => handleApproval(record.id, 1)}>Approve</Button>
                    <Button danger icon={<CloseOutlined />} size="small" onClick={() => handleApproval(record.id, 0)}>Reject</Button>
                </div>
            )
        } : {
            title: 'Actions', render: (_, record) => (
                <Button danger icon={<CloseOutlined />} size="small" onClick={() => handleApproval(record.id, 0)}>Revoke</Button>
            )
        }
    ];

    const tabItems = [
        {
            key: '1',
            label: <span>Pending Approvals <Tag color="orange">{pendingRetailers.length}</Tag></span>,
            children: <Table dataSource={pendingRetailers} columns={columns(true)} rowKey="id" pagination={{ pageSize: 10 }} locale={{ emptyText: 'No pending approvals' }} />
        },
        {
            key: '2',
            label: <span>Approved Retailers <Tag color="green">{approvedRetailers.length}</Tag></span>,
            children: <Table dataSource={approvedRetailers} columns={columns(false)} rowKey="id" pagination={{ pageSize: 10 }} locale={{ emptyText: 'No approved retailers' }} />
        }
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
                        <Tag color="blue" style={{ marginTop: 4 }}>Distributor</Tag>
                    </div>
                </div>
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['retailers']}
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
                    <Title level={4} style={styles.headerTitle}>Retailer Approvals</Title>
                </Header>
                <Content style={styles.content}>
                    <Card style={styles.tableCard} bordered={false}>
                        <Tabs defaultActiveKey="1" items={tabItems} />
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
    content: { marginLeft: 240, padding: '32px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' },
    tableCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
};

export default RetailerApprovals;
