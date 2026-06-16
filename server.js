const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable security configurations
app.use(cors());
app.use(express.json());

// Initialize Supabase with private server privilege keys
const SUPABASE_URL = 'https://bjonxpuepljsyrdmqrqn.supabase.co';
// WARNING: Replace this with your SERVICE_ROLE_KEY from Supabase Settings -> API (Never share this key!)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Serve your frontend static files automatically
app.use(express.static(path.join(__dirname, '/')));

// API Endpoint: Save Resume Data
app.post('/api/save-resume', async (req, res) => {
    const { email, name, title, phone, summary, experiences } = req.body;

    try {
        // 1. Upsert profile into the database using email as the identifier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({ full_name: name, job_title: title, email: email, phone: phone, summary: summary }, { onConflict: 'email' })
            .select()
            .single();

        if (profileError) throw profileError;

        // 2. Clear out older experience rows for this user
        await supabase.from('experiences').delete().eq('user_email', email);

        // 3. Insert new experience stack
        if (experiences && experiences.length > 0) {
            const rowsToInsert = experiences.map(exp => ({
                user_email: email,
                company_name: exp.company,
                duration: exp.date,
                location: exp.location,
                description: exp.desc
            }));
            const { error: expError } = await supabase.from('experiences').insert(rowsToInsert);
            if (expError) throw expError;
        }

        res.status(200).json({ success: true, message: 'Data synced to cloud successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fallback to route users to the homepage
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});
