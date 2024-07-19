const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const downloadVideo = (url, quality) => {
    return new Promise((resolve, reject) => {
        const outputDir = path.join(__dirname, 'downloads');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }

        const ytDlpPath = './yt-dlp'; // For macOS
        const command = `${ytDlpPath} -f ${quality} -o "${outputDir}/%(title)s.%(ext)s" ${url}`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
            }
            const matches = stdout.match(/Merging formats into "(.*)"/);
            if (matches && matches[1]) {
                resolve(matches[1]);
            } else {
                const matchesSingle = stdout.match(/Destination: (.*)/);
                if (matchesSingle && matchesSingle[1]) {
                    resolve(matchesSingle[1]);
                } else {
                    reject('Failed to retrieve video path');
                }
            }
        });
    });
};

module.exports = { downloadVideo };
