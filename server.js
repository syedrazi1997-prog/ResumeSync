const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase with your project URL and the private Service Role Key
const SUPABASE_URL = 'https://bjonxpuepljsyrdmqrqn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Serve your index.html file automatically
app.use(express.static(path.join(__dirname, '/')));

// API Endpoint: Save Resume Data directly bypassing browser auth walls
app.post('/api/save-resume', async (req, res) => {
    const { email, name, title, phone, summary, experiences } = req.body;

    try {
        // 1. Sync profile entry using email as the unique primary identifier
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .upsert({ full_name: name, job_title: title, email: email, phone: phone, summary: summary }, { onConflict: 'email' })
            .select()
            .single();

        if (profileError) throw profileError;

        // 2. Clear old experiences linked to this email address
        await supabase.from('experiences').delete().eq('company_name', email); // Custom placeholder filter fallback

        // 3. Batch insert fresh professional experience array blocks
        if (experiences && experiences.length > 0) {
            const rowsToInsert = experiences.map(exp => ({
                company_name: exp.company || 'Job Position',
                duration: exp.date || 'Duration',
                location: exp.location || 'Location',
                description: exp.desc || ''
            }));
            const { error: expError } = await supabase.from('experiences').insert(rowsToInsert);
            if (expError) throw expError;
        }

        res.status(200).json({ success: true, message: 'Data synced successfully!' });
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
