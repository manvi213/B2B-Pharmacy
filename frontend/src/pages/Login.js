import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

function Login() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (values) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/login', values);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role);
            localStorage.setItem('name', res.data.name);
            localStorage.setItem('userId', res.data.id);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            <div style={styles.leftPanel}>
                <MedicineBoxOutlined style={styles.icon} />
                <Title level={1} style={styles.brandTitle}>B2B Pharmacy</Title>
                <Text style={styles.brandSubtitle}>Your trusted pharmaceutical distribution platform</Text>
            </div>
            <div style={styles.rightPanel}>
                <Card style={styles.card} bordered={false}>
                    <Title level={2} style={styles.title}>Welcome Back</Title>
                    <Text type="secondary" style={styles.subtitle}>Sign in to your account</Text>
                    {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16, marginTop: 16 }} />}
                    <Form layout="vertical" onFinish={handleLogin} style={{ marginTop: 24 }}>
                        <Form.Item name="email" rules={[{ required: true, message: 'Email required' }]}>
                            <Input prefix={<UserOutlined />} placeholder="Email" size="large" type="email" />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, message: 'Password required' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large" block loading={loading}
                                style={styles.loginBtn}>
                                Sign In
                            </Button>
                        </Form.Item>
                    </Form>
                    <div style={styles.registerLink}>
                        <Text type="secondary">Don't have an account? </Text>
                        <a href="/register">Register here</a>
                    </div>
                </Card>
            </div>
        </div>
    );
}

const styles = {
    container: { display: 'flex', height: '100vh' },
    leftPanel: { flex: 1, background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' },
    icon: { fontSize: '80px', color: '#fff', marginBottom: '20px' },
    brandTitle: { color: '#fff', fontSize: '42px', margin: '0 0 10px' },
    brandSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: '16px', textAlign: 'center' },
    rightPanel: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
    card: { width: '420px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '20px' },
    title: { margin: 0, color: '#1a1a2e' },
    subtitle: { fontSize: '14px' },
    loginBtn: { background: 'linear-gradient(135deg, #1890ff, #096dd9)', border: 'none', height: '48px', borderRadius: '8px', fontSize: '16px' },
    registerLink: { textAlign: 'center', marginTop: '16px' }
};

export default Login;
