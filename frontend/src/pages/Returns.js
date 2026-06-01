import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Typography, Avatar, message } from 'antd';
import { RollbackOutlined, MedicineBoxOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, CreditCardOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const statusColors = { Pending: 'orange', Approved: 'green', Rejected: 'red' };

function Returns() {
    const [returns, setReturns] = useState([]);
    const [orders, setOrders] = useState([]);
    const [returnModal, setReturnModal] = useState(false);
    const [approveModal, setApproveModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [form] = Form.useForm();
    const [approveForm] = Form.useForm();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    const fetchReturns = async () => {
        try {
            const url = role === 'distributor' ? 'http://localhost:5000/returns' : `http://localhost:5000/returns/${userId}`;
            const res = await axios.get(url);
            setReturns(res.data);
        } catch (err) { console.log(err); }
    };

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/orders/${userId}`);
            setOrders(res.data);
        } catch (err) { console.log(err); }
    };

    useEffect(() => {
        fetchReturns();
        if (role === 'retailer') fetchOrders();
    }, []);

    const submitReturn = async (values) => {
        try {
            await axios.post('http://localhost:5000/returns', { ...values, userId });
            message.success('Return request submitted!');
            setReturnModal(false);
            form.resetFields();
            fetchReturns();
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to submit return');
        }
    };

    const handleApprove = async (values) => {
        try {
            await axios.put(`http://localhost:5000/returns/${selectedReturn.id}`, values);
            message.success(`Return ${values.status}!`);
            setApproveModal(false);
            approveForm.resetFields();
            fetchReturns();
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
    ];

    const columns = [
        { title: 'Product', dataIndex: 'productName', render: v => <Text strong>{v}</Text> },
        ...(role === 'distributor' ? [{ title: 'Retailer', dataIndex: 'retailerName' }] : []),
        { title: 'Order Amount', dataIndex: 'totalPrice', render: v => `₹${v}` },
        { title: 'Reason', dataIndex: 'reason', render: v => <Text type="secondary">{v}</Text> },
        { title: 'Refund', dataIndex: 'refundAmount', render: v => v ? <Text style={{ color: '#52c41a' }}>₹{v}</Text> : '-' },
        { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColors[v]}>{v}</Tag> },
        { title: 'Date', dataIndex: 'createdAt', render: v => new Date(v).toLocaleDateString() },
        ...(role === 'distributor' ? [{
            title: 'Action', render: (_, record) => record.status === 'Pending' && (
                <Button size="small" type="primary" onClick={() => { setSelectedReturn(record); setApproveModal(true); }}>
                    Review
                </Button>
            )
        }] : [])
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
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['returns']}
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
                    <Title level={4} style={styles.headerTitle}>Return & Refund Management</Title>
                    {role === 'retailer' && (
                        <Button type="primary" icon={<RollbackOutlined />} onClick={() => setReturnModal(true)}>
                            New Return Request
                        </Button>
                    )}
                </Header>
                <Content style={styles.content}>
                    <Card style={styles.tableCard} bordered={false}>
                        <Table dataSource={returns} columns={columns} rowKey="id"
                            pagination={{ pageSize: 10 }}
                            locale={{ emptyText: 'No return requests' }}
                        />
                    </Card>
                </Content>
            </Layout>

            {/* Retailer - New Return Modal */}
            <Modal title="Submit Return Request" open={returnModal} onCancel={() => setReturnModal(false)} footer={null}>
                <Form form={form} layout="vertical" onFinish={submitReturn}>
                    <Form.Item name="orderId" label="Select Order" rules={[{ required: true }]}>
                        <Select placeholder="Select order">
                            {orders.map(o => (
                                <Option key={o.id} value={o.id}>{o.productName} — ₹{o.totalPrice}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="reason" label="Reason for Return" rules={[{ required: true }]}>
                        <TextArea rows={3} placeholder="Reason batao..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">Submit Request</Button>
                </Form>
            </Modal>

            {/* Distributor - Approve/Reject Modal */}
            <Modal title="Review Return Request" open={approveModal} onCancel={() => setApproveModal(false)} footer={null}>
                {selectedReturn && (
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>Product: </Text><Text>{selectedReturn.productName}</Text><br />
                        <Text strong>Reason: </Text><Text>{selectedReturn.reason}</Text><br />
                        <Text strong>Order Amount: </Text><Text>₹{selectedReturn.totalPrice}</Text>
                    </div>
                )}
                <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
                    <Form.Item name="status" label="Decision" rules={[{ required: true }]}>
                        <Select placeholder="Approve ya Reject?">
                            <Option value="Approved">Approve</Option>
                            <Option value="Rejected">Reject</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="refundAmount" label="Refund Amount">
                        <InputNumber min={0} max={selectedReturn?.totalPrice} style={{ width: '100%' }} prefix="₹" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">Submit Decision</Button>
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
    tableCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
};

export default Returns;
