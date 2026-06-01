import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Input, Select, Row, Col, Typography, Button, Tag, Avatar, Badge, Empty } from 'antd';
import { SearchOutlined, ShoppingCartOutlined, MedicineBoxOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function Products({ cart, setCart }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const navigate = useNavigate();
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('role');

    const fetchProducts = async () => {
        try {
            const res = await axios.get('http://localhost:5000/products', { params: { search, category } });
            setProducts(res.data);
        } catch (err) { console.log(err); }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/categories');
            setCategories(res.data);
        } catch (err) { console.log(err); }
    };

    useEffect(() => { fetchCategories(); }, []);
    useEffect(() => { fetchProducts(); }, [search, category]);

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

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
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['products']}
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
                    <Title level={4} style={styles.headerTitle}>Products</Title>
                    {role === 'retailer' && (
                        <Badge count={cart.length} size="small">
                            <Button icon={<ShoppingCartOutlined />} onClick={() => navigate('/cart')} type="primary" style={styles.cartBtn}>
                                Cart
                            </Button>
                        </Badge>
                    )}
                </Header>
                <Content style={styles.content}>
                    <div style={styles.filters}>
                        <Input prefix={<SearchOutlined />} placeholder="Search products..." size="large"
                            style={styles.searchInput} value={search} onChange={e => setSearch(e.target.value)} />
                        <Select size="large" style={styles.select} value={category} onChange={setCategory} placeholder="All Categories">
                            <Option value="">All Categories</Option>
                            {categories.map((cat, i) => <Option key={i} value={cat}>{cat}</Option>)}
                        </Select>
                    </div>
                    {products.length === 0 ? (
                        <Empty description="No products found" style={{ marginTop: 80 }} />
                    ) : (
                        <Row gutter={[24, 24]}>
                            {products.map(p => (
                                <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                                    <Card hoverable style={styles.card} bordered={false}
                                        cover={p.imageUrl
                                            ? <img src={p.imageUrl} alt={p.productName} style={styles.cardImage} />
                                            : <div style={styles.noImage}><MedicineBoxOutlined style={{ fontSize: 40, color: '#1890ff' }} /></div>
                                        }
                                    >
                                        <div style={styles.cardBody}>
                                            <Tag color="blue" style={styles.categoryTag}>{p.category}</Tag>
                                            <Title level={5} style={styles.productName}>{p.productName}</Title>
                                            {p.hsnCode && <Text type="secondary" style={styles.hsn}>HSN: {p.hsnCode}</Text>}
                                            <Text type="secondary" style={styles.description}>{p.description}</Text>
                                            {p.expiryDate && (
                                                <Tag color="red" style={{ marginTop: 6 }}>
                                                    Exp: {new Date(p.expiryDate).toLocaleDateString()}
                                                </Tag>
                                            )}
                                            <div style={styles.footer}>
                                                <Title level={4} style={styles.price}>₹{p.price}</Title>
                                                <Text type="secondary">Stock: {p.stock}</Text>
                                            </div>
                                            {role === 'retailer' && (
                                                <Button type="primary" icon={<PlusOutlined />} block
                                                    style={styles.addBtn} onClick={() => addToCart(p)}>
                                                    Add to Cart
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    )}
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
    header: { background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginLeft: 240 },
    headerTitle: { margin: 0, color: '#1a1a2e' },
    cartBtn: { background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none' },
    content: { marginLeft: 240, padding: '32px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' },
    filters: { display: 'flex', gap: '16px', marginBottom: '24px' },
    searchInput: { flex: 1, borderRadius: '8px' },
    select: { width: '200px' },
    card: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden' },
    cardImage: { height: '160px', objectFit: 'cover', width: '100%' },
    noImage: { height: '160px', background: 'linear-gradient(135deg, #e6f7ff, #bae7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cardBody: { padding: '4px 0' },
    categoryTag: { marginBottom: '8px' },
    productName: { margin: '4px 0', color: '#1a1a2e' },
    hsn: { display: 'block', fontSize: '12px', marginBottom: '4px' },
    description: { display: 'block', fontSize: '13px', marginBottom: '8px' },
    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' },
    price: { margin: 0, color: '#52c41a' },
    addBtn: { background: 'linear-gradient(135deg, #52c41a, #389e0d)', border: 'none', borderRadius: '8px' },
};

export default Products;
