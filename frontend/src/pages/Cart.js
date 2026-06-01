import React from 'react';
import { Layout, Table, Button, Typography, Card, InputNumber, Empty, Tag } from 'antd';
import { DeleteOutlined, ShoppingOutlined, ArrowLeftOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Content, Header } = Layout;
const { Title, Text } = Typography;

function Cart({ cart, setCart }) {
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');

    const updateQty = (productId, qty) => {
        if (qty < 1) return;
        setCart(cart.map(item => item.id === productId ? { ...item, qty } : item));
    };

    const removeItem = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const placeOrder = async () => {
        try {
            for (const item of cart) {
                const orderRes = await axios.post('http://localhost:5000/orders', {
                    userId, productId: item.id, quantity: item.qty, totalPrice: item.price * item.qty
                });
                await axios.post('http://localhost:5000/invoices', {
                    userId,
                    orderId: orderRes.data.orderId,
                    subtotal: item.price * item.qty
                });
            }
            setCart([]);
            navigate('/billing');
        } catch (err) {
            alert('Order place karne mein error: ' + err.message);
        }
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const columns = [
        {
            title: 'Product',
            dataIndex: 'productName',
            render: (name, record) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.productIcon}><MedicineBoxOutlined style={{ color: '#1890ff', fontSize: '20px' }} /></div>
                    <div>
                        <Text strong>{name}</Text>
                        <br />
                        <Tag color="blue">{record.category}</Tag>
                    </div>
                </div>
            )
        },
        {
            title: 'Price',
            dataIndex: 'price',
            render: price => <Text strong style={{ color: '#52c41a' }}>₹{price}</Text>
        },
        {
            title: 'Quantity',
            dataIndex: 'qty',
            render: (qty, record) => (
                <InputNumber min={1} value={qty} onChange={val => updateQty(record.id, val)} style={{ width: '80px' }} />
            )
        },
        {
            title: 'Total',
            render: (_, record) => <Text strong>₹{record.price * record.qty}</Text>
        },
        {
            title: 'Action',
            render: (_, record) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(record.id)} type="text" />
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Header style={styles.header}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')} type="text" style={styles.backBtn}>
                    Back to Products
                </Button>
                <Title level={4} style={styles.headerTitle}>My Cart</Title>
                <div />
            </Header>
            <Content style={styles.content}>
                {cart.length === 0 ? (
                    <Card style={styles.emptyCard} bordered={false}>
                        <Empty description="Cart is empty" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                            <Button type="primary" onClick={() => navigate('/products')}>Browse Products</Button>
                        </Empty>
                    </Card>
                ) : (
                    <>
                        <Card style={styles.tableCard} bordered={false}>
                            <Table dataSource={cart} columns={columns} rowKey="id" pagination={false} />
                        </Card>
                        <Card style={styles.summaryCard} bordered={false}>
                            <div style={styles.summary}>
                                <div>
                                    <Text type="secondary">Total Items: {cart.length}</Text>
                                    <br />
                                    <Title level={3} style={styles.totalPrice}>Total: ₹{total}</Title>
                                </div>
                                <Button type="primary" size="large" icon={<ShoppingOutlined />}
                                    onClick={placeOrder} style={styles.orderBtn}>
                                    Place Order
                                </Button>
                            </div>
                        </Card>
                    </>
                )}
            </Content>
        </Layout>
    );
}

const styles = {
    header: { background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    backBtn: { color: '#1890ff' },
    headerTitle: { margin: 0, color: '#1a1a2e' },
    content: { padding: '32px', maxWidth: '900px', margin: '0 auto', width: '100%' },
    emptyCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', padding: '40px', textAlign: 'center' },
    tableCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginBottom: '16px' },
    summaryCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
    summary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    totalPrice: { margin: '4px 0 0', color: '#1a1a2e' },
    orderBtn: { background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none', height: '48px', padding: '0 32px', borderRadius: '8px' },
    productIcon: { width: '44px', height: '44px', background: '#e6f7ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};

export default Cart;
