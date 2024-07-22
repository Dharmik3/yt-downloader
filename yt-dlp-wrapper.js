const AWS = require('aws-sdk');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables from .env file

AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

const checkIfExistsInS3 = async (key) => {
    try {
        await s3.headObject({ Bucket: process.env.S3_BUCKET_NAME, Key: key }).promise();
        return true;
    } catch (error) {
        if (error.code === 'NotFound') {
            return false;
        }
        throw error;
    }
};

const getS3Url = (key) => {
    const encodedKey = encodeURIComponent(key);
    const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`
    return s3Url
};


const uploadToS3 = (filePath, bucketName, key) => {
    return new Promise((resolve, reject) => {
        const fileContent = fs.readFileSync(filePath);
        const params = {
            Bucket: bucketName,
            Key: key,
            Body: fileContent
        };
        s3.upload(params, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.Location);
            }
        });
    });
};

const downloadVideo = (url, quality, key) => {
    return new Promise(async (resolve, reject) => {
        const outputDir = path.join('/tmp', 'downloads'); // Use /tmp for ephemeral storage
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const ytDlpPath = './yt-dlp';
        const command = `${ytDlpPath} -f ${quality} --no-check-certificate -o "${outputDir}/%(title)s.%(ext)s" ${url}`;

        exec(command, async (error, stdout, stderr) => {
            console.log(`Command: ${command}`);
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);

            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
            }

            // Adjust the regex based on actual stdout output
            const matches = stdout.match(/Destination: (.*)/);
            let filePath = '';
            if (matches && matches[1]) {
                filePath = matches[1].trim();
            } else {
                reject('Failed to retrieve video path');
                return;
            }

            // Check if the file exists
            if (!fs.existsSync(filePath)) {
                reject(`File does not exist: ${filePath}`);
                return;
            }

            try {
                const fileUrl = await uploadToS3(filePath, process.env.S3_BUCKET_NAME, key);
                resolve(fileUrl);
            } catch (uploadError) {
                reject(`Error uploading to S3: ${uploadError.message}`);
            }
        });
    });
};

module.exports = { downloadVideo, uploadToS3, checkIfExistsInS3, getS3Url };
