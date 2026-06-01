import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Typography, Avatar, message, Switch } from 'antd';
import { GiftOutlined, MedicineBoxOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, CreditCardOutlined, FileTextOutlined, RollbackOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function Promotions() {
    const [promotions, setPromotions] = useState([]);
    const [products, setProducts] = useState([]);
    const [modal, setModal] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    const fetchPromotions = async () => {
        try {
            const res = await axios.get('http://localhost:5000/promotions');
            setPromotions(res.data);
        } catch (err) { console.log(err); }
    };

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/products');
            setProducts(res.data);
        } catch (err) { console.log(err); }
    };

    useEffect(() => {
        fetchPromotions();
        fetchProducts();
    }, []);

    const createPromotion = async (values) => {
        try {
            await axios.post('http://localhost:5000/promotions', values);
            message.success('Promotion created!');
            setModal(false);
            form.resetFields();
            fetchPromotions();
        } catch (err) {
            message.error('Failed to create promotion');
        }
    };

    const togglePromotion = async (id, isActive) => {
        try {
            await axios.put(`http://localhost:5000/promotions/${id}`, { isActive: isActive ? 1 : 0 });
            fetchPromotions();
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
        { key: 'billing', icon: <FileTextOutlined />, label: 'Billing' },
        { key: 'returns', icon: <RollbackOutlined />, label: 'Returns' },
        { key: 'promotions', icon: <GiftOutlined />, label: 'Promotions' },
    ];

    const discountTypeColors = { Percentage: 'blue', Flat: 'green', 'Bulk Discount': 'purple' };

    const columns = [
        { title: 'Title', dataIndex: 'title', render: v => <Text strong>{v}</Text> },
        { title: 'Product', dataIndex: 'productName', render: v => v || <Tag>All Products</Tag> },
        {
            title: 'Discount Type', dataIndex: 'discountType',
            render: v => <Tag color={discountTypeColors[v]}>{v}</Tag>
        },
        {
            title: 'Discount Value', render: (_, r) =>
                r.discountType === 'Percentage'
                    ? <Text strong style={{ color: '#52c41a' }}>{r.discountValue}%</Text>
                    : <Text strong style={{ color: '#52c41a' }}>₹{r.discountValue}</Text>
        },
        { title: 'Min Qty', dataIndex: 'minQuantity', render: v => <Tag>{v}+ units</Tag> },
        {
            title: 'Status', dataIndex: 'isActive',
            render: (v, record) => role === 'distributor'
                ? <Switch checked={v} onChange={val => togglePromotion(record.id, val)} />
                : <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Inactive'}</Tag>
        },
        { title: 'Date', dataIndex: 'createdAt', render: v => new Date(v).toLocaleDateString() }
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
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['promotions']}
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
                    <Title level={4} style={styles.headerTitle}>Promotions & Discounts</Title>
                    {role === 'distributor' && (
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModal(true)}>
                            New Promotion
                        </Button>
                    )}
                </Header>
                <Content style={styles.content}>
                    {promotions.filter(p => p.isActive).length > 0 && (
                        <div style={styles.activePromos}>
                            {promotions.filter(p => p.isActive).map(p => (
                                <Card key={p.id} style={styles.promoCard} bordered={false}>
                                    <GiftOutlined style={styles.promoIcon} />
                                    <Text strong style={styles.promoTitle}>{p.title}</Text>
                                    <br />
                                    <Text style={styles.promoValue}>
                                        {p.discountType === 'Percentage' ? `${p.discountValue}% OFF` : `₹${p.discountValue} OFF`}
                                    </Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>Min {p.minQuantity} units</Text>
                                </Card>
                            ))}
                        </div>
                    )}
                    <Card style={styles.tableCard} bordered={false}>
                        <Table dataSource={promotions} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
                    </Card>
                </Content>
            </Layout>

            <Modal title="Create New Promotion" open={modal} onCancel={() => setModal(false)} footer={null}>
                <Form form={form} layout="vertical" onFinish={createPromotion}>
                    <Form.Item name="title" label="Promotion Title" rules={[{ required: true }]}>
                        <Input placeholder="e.g. Summer Sale, Bulk Offer" />
                    </Form.Item>
                    <Form.Item name="discountType" label="Discount Type" rules={[{ required: true }]}>
                        <Select placeholder="Select type">
                            <Option value="Percentage">Percentage (%)</Option>
                            <Option value="Flat">Flat Amount (₹)</Option>
                            <Option value="Bulk Discount">Bulk Discount</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="discountValue" label="Discount Value" rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width: '100%' }} placeholder="e.g. 10 for 10% or ₹10" />
                    </Form.Item>
                    <Form.Item name="minQuantity" label="Minimum Quantity" initialValue={1}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="productId" label="Apply to Product (Optional)">
                        <Select placeholder="Leave empty for all products" allowClear>
                            {products.map(p => <Option key={p.id} value={p.id}>{p.productName}</Option>)}
                        </Select>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">Create Promotion</Button>
                </Form>
            </Modal>
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
    header: { background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginLeft: 240 },
    headerTitle: { margin: 0, color: '#1a1a2e' },
    content: { marginLeft: 240, padding: '32px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' },
    activePromos: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
    promoCard: { borderRadius: '12px', background: 'linear-gradient(135deg, #fff7e6, #ffe7ba)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '8px', minWidth: '160px', textAlign: 'center' },
    promoIcon: { fontSize: '24px', color: '#fa8c16', marginBottom: '8px' },
    promoTitle: { fontSize: '14px', color: '#333' },
    promoValue: { fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' },
    tableCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
};

export default Promotions;
