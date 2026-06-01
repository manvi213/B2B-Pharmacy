import React, { useState, useEffect } from 'react';
import { Layout, Menu, Card, Table, Tag, Button, Modal, Form, InputNumber, Select, Typography, Avatar, message, Descriptions } from 'antd';
import { FileTextOutlined, MedicineBoxOutlined, AppstoreOutlined, ShoppingOutlined, UserOutlined, LogoutOutlined, CreditCardOutlined, DownloadOutlined, DollarOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const { Sider, Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const statusColors = { Unpaid: 'red', Partial: 'orange', Paid: 'green' };

function Billing() {
    const [invoices, setInvoices] = useState([]);
    const [paymentModal, setPaymentModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');

    const fetchInvoices = async () => {
        try {
            const url = role === 'distributor' ? 'http://localhost:5000/invoices' : `http://localhost:5000/invoices/${userId}`;
            const res = await axios.get(url);
            setInvoices(res.data);
        } catch (err) { console.log(err); }
    };

    useEffect(() => { fetchInvoices(); }, []);

    const handlePayment = async (values) => {
        try {
            await axios.post('http://localhost:5000/payments', {
                invoiceId: selectedInvoice.id,
                userId,
                amount: values.amount,
                paymentMode: values.paymentMode
            });
            message.success('Payment recorded!');
            setPaymentModal(false);
            form.resetFields();
            fetchInvoices();
        } catch (err) {
            message.error('Payment failed');
        }
    };

    const downloadPDF = (invoice) => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('B2B Pharmacy', 14, 20);
        doc.setFontSize(12);
        doc.text(`Invoice: ${invoice.invoiceNumber}`, 14, 32);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, 40);
        doc.text(`Retailer: ${invoice.retailerName || name}`, 14, 48);

        autoTable(doc, {
            startY: 58,
            head: [['Product', 'HSN Code', 'Qty', 'Subtotal', 'CGST (9%)', 'SGST (9%)', 'Total']],
            body: [[
                invoice.productName,
                invoice.hsnCode || '-',
                invoice.quantity,
                `Rs ${invoice.subtotal}`,
                `Rs ${invoice.cgst}`,
                `Rs ${invoice.sgst}`,
                `Rs ${invoice.totalAmount}`
            ]],
        });

        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Paid: Rs ${invoice.paidAmount}`, 14, finalY);
        doc.text(`Outstanding: Rs ${invoice.totalAmount - invoice.paidAmount}`, 14, finalY + 8);
        doc.text(`Status: ${invoice.status}`, 14, finalY + 16);
        doc.save(`${invoice.invoiceNumber}.pdf`);
    };

    const handleLogout = () => { localStorage.clear(); navigate('/'); };

    const menuItems = [
        { key: 'dashboard', icon: <AppstoreOutlined />, label: 'Dashboard' },
        { key: 'products', icon: <MedicineBoxOutlined />, label: 'Products' },
        { key: 'orders', icon: <ShoppingOutlined />, label: 'Orders' },
        { key: 'credit', icon: <CreditCardOutlined />, label: 'Credit' },
        { key: 'billing', icon: <FileTextOutlined />, label: 'Billing' },
    ];

    const columns = [
        { title: 'Invoice No', dataIndex: 'invoiceNumber', render: v => <Text strong style={{ color: '#1890ff' }}>{v}</Text> },
        ...(role === 'distributor' ? [{ title: 'Retailer', dataIndex: 'retailerName' }] : []),
        { title: 'Product', dataIndex: 'productName' },
        { title: 'HSN', dataIndex: 'hsnCode', render: v => v || '-' },
        { title: 'Subtotal', dataIndex: 'subtotal', render: v => `₹${v}` },
        { title: 'CGST', dataIndex: 'cgst', render: v => `₹${v}` },
        { title: 'SGST', dataIndex: 'sgst', render: v => `₹${v}` },
        { title: 'Total', dataIndex: 'totalAmount', render: v => <Text strong>₹{v}</Text> },
        { title: 'Paid', dataIndex: 'paidAmount', render: v => <Text style={{ color: '#52c41a' }}>₹{v}</Text> },
        { title: 'Status', dataIndex: 'status', render: v => <Tag color={statusColors[v]}>{v}</Tag> },
        {
            title: 'Actions', render: (_, record) => (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Button icon={<DownloadOutlined />} size="small" onClick={() => downloadPDF(record)}>PDF</Button>
                    {role === 'retailer' && record.status !== 'Paid' && (
                        <Button icon={<DollarOutlined />} size="small" type="primary"
                            onClick={() => { setSelectedInvoice(record); setPaymentModal(true); }}>
                            Pay
                        </Button>
                    )}
                </div>
            )
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
                        <Tag color={role === 'distributor' ? 'blue' : 'green'} style={{ marginTop: 4 }}>
                            {role === 'distributor' ? 'Distributor' : 'Retailer'}
                        </Tag>
                    </div>
                </div>
                <Menu theme="dark" mode="inline" defaultSelectedKeys={['billing']}
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
                    <Title level={4} style={styles.headerTitle}>Payment & GST Billing</Title>
                </Header>
                <Content style={styles.content}>
                    <Card style={styles.tableCard} bordered={false}>
                        <Table dataSource={invoices} columns={columns} rowKey="id"
                            pagination={{ pageSize: 10 }}
                            locale={{ emptyText: 'No invoices found' }}
                            scroll={{ x: true }}
                        />
                    </Card>
                </Content>
            </Layout>

            <Modal title="Make Payment" open={paymentModal} onCancel={() => setPaymentModal(false)} footer={null}>
                {selectedInvoice && (
                    <Descriptions bordered size="small" style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Invoice" span={3}>{selectedInvoice.invoiceNumber}</Descriptions.Item>
                        <Descriptions.Item label="Total" span={3}>₹{selectedInvoice.totalAmount}</Descriptions.Item>
                        <Descriptions.Item label="Paid" span={3}>₹{selectedInvoice.paidAmount}</Descriptions.Item>
                        <Descriptions.Item label="Outstanding" span={3}>₹{selectedInvoice.totalAmount - selectedInvoice.paidAmount}</Descriptions.Item>
                    </Descriptions>
                )}
                <Form form={form} layout="vertical" onFinish={handlePayment}>
                    <Form.Item name="amount" label="Payment Amount" rules={[{ required: true }]}>
                        <InputNumber min={1} max={selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.paidAmount : 0}
                            style={{ width: '100%' }} prefix="₹" />
                    </Form.Item>
                    <Form.Item name="paymentMode" label="Payment Mode" initialValue="Cash" rules={[{ required: true }]}>
                        <Select>
                            <Option value="Cash">Cash</Option>
                            <Option value="UPI">UPI</Option>
                            <Option value="Bank Transfer">Bank Transfer</Option>
                            <Option value="Cheque">Cheque</Option>
                        </Select>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">Submit Payment</Button>
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
    header: { background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginLeft: 240 },
    headerTitle: { margin: 0, color: '#1a1a2e' },
    content: { marginLeft: 240, padding: '32px', backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' },
    tableCard: { borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
};

export default Billing;
