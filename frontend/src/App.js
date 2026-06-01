import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Orders from './pages/Orders';

import Credit from './pages/Credit';
import Billing from './pages/Billing';
import Returns from './pages/Returns';
import Promotions from './pages/Promotions';
import Reports from './pages/Reports';
import RetailerApprovals from './pages/RetailerApprovals';

function App() {
    const [cart, setCart] = useState([]);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products cart={cart} setCart={setCart} />} />
                <Route path="/cart" element={<Cart cart={cart} setCart={setCart} />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/credit" element={<Credit />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/returns" element={<Returns />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/retailers" element={<RetailerApprovals />} />
            </Routes>
        </Router>
    );
}

export default App;
