import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

app.post('/scrape', async (req, res) => {
    let { url } = req.body;

    try {
        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        // Replace 'view-post.html' with 'view-post-x.php' in the URL
        url = url.replace('view-post.html', 'view-post-x.php');

        // Fetch the data from the modified URL
        const response = await axios.get(url);
        const data = response.data; // This should be the JSON data you're interested in

        res.status(200).json(data); // Return the fetched data
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

function isValidUrl(string) {
    let url;
  
    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }
  
    return url.protocol === "http:" || url.protocol === "https:";
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
