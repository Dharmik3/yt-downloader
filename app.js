const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { downloadVideo } = require('./yt-dlp-wrapper');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('downloads'));

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/download', async (req, res) => {
    const { url, quality } = req.body;

    try {
        const filePath = await downloadVideo(url, quality);
        res.download(filePath, (err) => {
            if (err) {
                console.error(err);
            } else {
                fs.unlinkSync(filePath); // Clean up the file after download
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to download video');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
