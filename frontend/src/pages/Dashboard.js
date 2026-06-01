import React from 'react';
import { Layout, Menu, Card, Row, Col, Typography, Button, Avatar, Tag } from 'antd';
import { ShoppingOutlined, ShoppingCartOutlined, LogoutOutlined, MedicineBoxOutlined, UserOutlined, AppstoreOutlined, CreditCardOutlined, FileTextOutlined, RollbackOutlined, GiftOutlined, BarChartOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

function Dashboard() {
    const navigate = useNavigate();
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('role');

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    const menuItems = [
        { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
        { key: 'products', icon: <MedicineBoxOutlined />, label: 'Products' },
        { key: 'orders', icon: <ShoppingOutlined />, label: 'Orders' },
        { key: 'credit', icon: <CreditCardOutlined />, label: 'Credit' },
        { key: 'billing', icon: <FileTextOutlined />, label: 'Billing' },
        { key: 'returns', icon: <RollbackOutlined />, label: 'Returns' },
        { key: 'promotions', icon: <GiftOutlined />, label: 'Promotions' },
        { key: 'reports', icon: <BarChartOutlined />, label: 'Reports' },
        ...(role === 'distributor' ? [{ key: 'retailers', icon: <TeamOutlined />, label: 'Retailers' }] : []),
    ];

    const cards = [
        { label: 'Products', title: 'Browse', path: '/products', gradient: 'linear-gradient(135deg, #1890ff, #096dd9)', icon: <MedicineBoxOutlined style={{ fontSize: 28, color: '#fff' }} /> },
        { label: 'Orders', title: 'View All', path: '/orders', gradient: 'linear-gradient(135deg, #52c41a, #389e0d)', icon: <ShoppingOutlined style={{ fontSize: 28, color: '#fff' }} /> },
        { label: 'Credit', title: 'Account', path: '/credit', gradient: 'linear-gradient(135deg, #722ed1, #531dab)', icon: <CreditCardOutlined style={{ fontSize: 28, color: '#fff' }} /> },
        { label: 'Billing', title: 'Invoices', path: '/billing', gradient: 'linear-gradient(135deg, #13c2c2, #08979c)', icon: <FileTextOutlined style={{ fontSize: 28, color: '#fff' }} /> },
        { label: 'Returns', title: 'Manage', path: '/returns', gradient: 'linear-gradient(135deg, #ff4d4f, #cf1322)', icon: <RollbackOutlined style={{ fontSize: 28, color: '#fff' }} /> },
        { label: 'Promotions', title: 'Discounts', path: '/promotions', gradient: 'linear-gradient(135deg, #fa8c16, #d46b08)', icon: <GiftOutlined style={{ fontSize: 28, color: '#fff' }} /> },
        { label: 'Reports', title: 'Analytics', path: '/reports', gradient: 'linear-gradient(135deg, #13c2c2, #006d75)', icon: <BarChartOutlined style={{ fontSize: 28, color: '#fff' }} /> },
        ...(role === 'distributor' ? [{ label: 'Retailers', title: 'Approvals', path: '/retailers', gradient: 'linear-gradient(135deg, #2f54eb, #1d39c4)', icon: <TeamOutlined style={{ fontSize: 28, color: '#fff' }} /> }] : []),
        ...(role === 'retailer' ? [{ label: 'Cart', title: 'My Cart', path: '/cart', gradient: 'linear-gradient(135deg, #eb2f96, #9e1068)', icon: <ShoppingCartOutlined style={{ fontSize: 28, color: '#fff' }} /> }] : []),
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
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['dashboard']}
                    style={{ background: 'transparent', border: 'none', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}
                    items={menuItems}
                    onClick={({ key }) => { if (key !== 'dashboard') navigate(`/${key}`); }}
                />
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                    <Button icon={<LogoutOutlined />} onClick={handleLogout} style={styles.logoutBtn} block>
                        Logout
                    </Button>
                </div>
            </Sider>
            <Layout>
                <Header style={styles.header}>
                    <Title level={4} style={styles.headerTitle}>Dashboard</Title>
                </Header>
                <Content style={styles.content}>
                    <Title level={3} style={{ marginBottom: 24 }}>Welcome back, {name}! 👋</Title>
                    <Row gutter={[24, 24]}>
                        {cards.map((card, i) => (
                            <Col span={8} key={i}>
                                <Card style={styles.statCard} bordered={false} onClick={() => navigate(card.path)} hoverable>
                                    <div style={styles.statContent}>
                                        <div style={{ ...styles.statIcon, background: card.gradient }}>
                                            {card.icon}
                                        </div>
                                        <div>
                                            <Text type="secondary">{card.label}</Text>
                                            <Title level={3} style={{ margin: 0 }}>{card.title}</Title>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Content>
            </Layout>
        </Layout>
    );
}

const styles = {
    sider: { background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, display: 'flex', flexDirection: 'column' },
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
    statCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', cursor: 'pointer' },
    statContent: { display: 'flex', alignItems: 'center', gap: '16px' },
    statIcon: { width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};

export default Dashboard;
