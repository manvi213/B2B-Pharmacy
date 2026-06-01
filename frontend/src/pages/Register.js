import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

function Register() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (values) => {
        setLoading(true);
        setError('');
        try {
            await axios.post('http://localhost:5000/register', values);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.leftPanel}>
                <MedicineBoxOutlined style={styles.icon} />
                <Title level={1} style={styles.brandTitle}>B2B Pharmacy</Title>
                <Text style={styles.brandSubtitle}>Join our pharmaceutical distribution network</Text>
            </div>
            <div style={styles.rightPanel}>
                <Card style={styles.card} bordered={false}>
                    <Title level={2} style={styles.title}>Create Account</Title>
                    <Text type="secondary">Fill in your details to get started</Text>
                    {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16, marginTop: 16 }} />}
                    <Form layout="vertical" onFinish={handleRegister} style={{ marginTop: 24 }}>
                        <Form.Item name="name" rules={[{ required: true, message: 'Name required' }]}>
                            <Input prefix={<UserOutlined />} placeholder="Full Name" size="large" />
                        </Form.Item>
                        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Valid email required' }]}>
                            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Min 6 characters' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                        </Form.Item>
                        <Form.Item name="role" initialValue="retailer" rules={[{ required: true }]}>
                            <Select size="large" placeholder="Select Role">
                                <Option value="retailer">Retailer (Pharmacy)</Option>
                                <Option value="distributor">Distributor</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large" block loading={loading} style={styles.registerBtn}>
                                Create Account
                            </Button>
                        </Form.Item>
                    </Form>
                    <div style={styles.loginLink}>
                        <Text type="secondary">Already have an account? </Text>
                        <a href="/">Sign in</a>
                    </div>
                </Card>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', height: '100vh' },
    leftPanel: { flex: 1, background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' },
    icon: { fontSize: '80px', color: '#fff', marginBottom: '20px' },
    brandTitle: { color: '#fff', fontSize: '42px', margin: '0 0 10px' },
    brandSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: '16px', textAlign: 'center' },
    rightPanel: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
    card: { width: '420px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '20px' },
    title: { margin: 0, color: '#1a1a2e' },
    registerBtn: { background: 'linear-gradient(135deg, #52c41a, #389e0d)', border: 'none', height: '48px', borderRadius: '8px', fontSize: '16px' },
    loginLink: { textAlign: 'center', marginTop: '16px' }
};

export default Register;
