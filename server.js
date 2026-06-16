const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase
const SUPABASE_URL = 'https://bjonxpuepljsyrdmqrqn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize Razorpay (Make sure to add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Render Environment Variables)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'YOUR_SECRET_HERE'
});

app.use(express.static(path.join(__dirname, '/')));

// API Endpoint 1: Create a live Razorpay Order
app.post('/api/create-order', async (req, res) => {
    try {
        const options = {
            amount: 100, // Amount in paisa (100 paisa = ₹1.00)
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        res.status(200).json({ success: true, orderId: order.id, keyId: razorpay.key_id });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API Endpoint 2: Save Resume Data upon confirmed checkout
app.post('/api/save-resume', async (req, res) => {
    const { email, name, title, phone, summary, experiences } = req.body;
    try {
        await supabase.from('profiles').upsert({ full_name: name, job_title: title, email: email, phone: phone, summary: summary }, { onConflict: 'email' });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Backend Active on Port ${PORT}`);
});
