import express from 'express';
import mysql from 'mysql';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

// Database configuration
const dbConfig = {
    host: 'mudfoot.doc.stu.mmu.ac.uk',
    user: 'bahkaras',
    password: 'hirsponD3',
    database: 'bahkaras',
    port: 6306
};

let db;

function handleDisconnect() {
    db = mysql.createConnection(dbConfig);

    db.connect(err => {
        if (err) {
            console.error('Error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Connected to the database successfully');
        }
    });

    db.on('error', err => {
        console.error('Database error:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
            console.log('Attempting to reconnect to the database...');
            handleDisconnect();
        }
    });
}

handleDisconnect(); // Initial connection setup with reconnection handling

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Middleware to check if the database connection is alive
function ensureDbConnection(req, res, next) {
    if (!db || db.state === 'disconnected') {
        res.status(503).send('Service unavailable. Please try again later.');
    } else {
        next();
    }
}

// Validates the URL format
function validateUrl(req, res, next) {
    try {
        new URL(req.body.url);
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid URL' });
    }
}

// API endpoint to scrape data based on the URL
app.post('/scrape', ensureDbConnection, validateUrl, async (req, res) => {
    const { url } = req.body;
    const urlObj = new URL(url);
    const contentParam = urlObj.searchParams.get('content');

    // Prepare the SQL query to search for the post with user details
    const query = `
        SELECT ci.*, u.FirstName, u.LastName, u.Age, u.Education, u.ProfilePictureURL 
        FROM CarouselItems ci
        JOIN Users u ON ci.UserID = u.UserID
        WHERE ci.PostURL LIKE ?
    `;
    db.query(query, [`%${contentParam}%`], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'An unexpected error occurred while querying the database' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'No matching content found' });
        }
        // Convert BLOB to Base64
        const postWithUserDetails = results[0];
        if (postWithUserDetails.UploadedImageData) {
            postWithUserDetails.UploadedImageData = Buffer.from(postWithUserDetails.UploadedImageData).toString('base64');
        }
        res.json(postWithUserDetails); // Return the first matching result with user details
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
