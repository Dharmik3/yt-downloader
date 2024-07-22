const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { downloadVideo, checkIfExistsInS3, getS3Url } = require('./yt-dlp-wrapper');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/download', async (req, res) => {
    const { url, quality } = req.body;
    try {
        const videoKey = path.basename(url) + '_' + quality + '.mp4';

        // Check in S3 if exist then return the url
        const existsInS3 = await checkIfExistsInS3(videoKey);
        if (existsInS3) {
            console.log('......exist......')
            const s3Url = getS3Url(videoKey)
            return res.json({ url: s3Url });
        }

        // Download and upload video if not cached
        const fileUrl = await downloadVideo(url, quality, videoKey);
        console.log({ url: fileUrl })
        res.json({ url: fileUrl });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to download video');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
