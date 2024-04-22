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
    port: 6306,
    connectionLimit: 10 // Adjust according to your application's needs
};

// Create a MySQL pool
const pool = mysql.createPool(dbConfig);

pool.on('acquire', function (connection) {
    console.log('Connection %d acquired', connection.threadId);
});

pool.on('enqueue', function () {
    console.log('Waiting for available connection slot');
});

pool.on('release', function (connection) {
    console.log('Connection %d released', connection.threadId);
});

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Middleware to check if the database connection is alive
function ensureDbConnection(req, res, next) {
    pool.getConnection((err, connection) => {
        if (err) {
            console.error('Failed to get a database connection:', err);
            res.status(503).send('Database service unavailable. Please try again later.');
        } else {
            console.log('Database connection successfully retrieved from pool');
            // Attach connection to the request and handle its release
            req.db = connection;
            res.on('finish', () => {
                req.db.release();
            });
            next();
        }
    });
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
app.post('/scrape', ensureDbConnection, validateUrl, (req, res) => {
    const { url } = req.body;
    const urlObj = new URL(url);
    const contentParam = urlObj.searchParams.get('content');

    const query = `
        SELECT ci.*, u.FirstName, u.LastName, u.Age, u.Education, u.ProfilePictureURL 
        FROM CarouselItems ci
        JOIN Users u ON ci.UserID = u.UserID
        WHERE ci.PostURL LIKE ?
    `;
    req.db.query(query, [`%${contentParam}%`], (err, results) => {
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
