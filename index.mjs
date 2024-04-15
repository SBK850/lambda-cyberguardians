import express from 'express';
import mysql from 'mysql';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Setup database connection
const db = mysql.createConnection({
  host: 'mudfoot.doc.stu.mmu.ac.uk',
  user: 'bahkaras',
  password: 'hirsponD3',
  database: 'bahkaras',
  port: 6306
});

db.connect(err => {
  if (err) {
    return console.error('error connecting: ' + err.stack);
  }
  console.log('connected as id ' + db.threadId);
});

app.use(cors());
app.use(express.json());

app.post('/scrape', async (req, res) => {
  const { url } = req.body;

  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Extract CarouselItemID from URL
  const carouselItemId = url.split('content=')[1].split('&')[0];

  // Query the database
  db.query('SELECT * FROM CarouselItems WHERE CarouselItemID = ?', [carouselItemId], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to retrieve data' });
    }
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).json({ error: 'No content found' });
    }
  });
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
