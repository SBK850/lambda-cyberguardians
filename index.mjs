import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// Function to handle requests with retries
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Attempt ${4 - retries} failed: ${error.message}`);
    if (retries > 1) {
      await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
      return fetchWithRetry(url, retries - 1, delay * 2); // Exponential backoff
    } else {
      throw error; // Rethrow the error after last retry
    }
  }
}

app.post('/scrape', async (req, res) => {
    let { url } = req.body;

    try {
        if (!isValidUrl(url)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }

        // Replace 'view-post.html' with 'view-post-x.php' in the URL
        url = url.replace('view-post.html', 'view-post-x.php');

        // Fetch the data from the modified URL with retries
        const data = await fetchWithRetry(url);
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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
