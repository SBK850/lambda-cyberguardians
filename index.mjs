import express from 'express';
import mysql from 'mysql';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Database configuration
const db = mysql.createConnection({
    host: 'mudfoot.doc.stu.mmu.ac.uk',
    user: 'bahkaras',
    password: 'hirsponD3',
    database: 'bahkaras',
    port: 6306
});

// Connect to the database
db.connect(err => {
    if (err) {
        console.error('Database connection error:', err);
        return;
    }
    console.log('Connected to the database successfully');
});

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Validates the URL format
function isValidUrl(string) {
    let url;
  
    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
}

// API endpoint to scrape data based on the URL
app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    try {
        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        const urlObj = new URL(url);
        const contentParam = urlObj.searchParams.get('content');
        
        // Prepare the SQL query to search for the post
        const query = "SELECT * FROM CarouselItems WHERE PostURL LIKE ?";
        db.query(query, [`%${contentParam}%`], (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ error: 'An unexpected error occurred while querying the database' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'No matching content found' });
            }
            // Convert BLOB to Base64
            const post = results[0];
            if (post.UploadedImageData) {
                post.UploadedImageData = Buffer.from(post.UploadedImageData).toString('base64');
            }
            res.json(post); // Return the first matching result
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
