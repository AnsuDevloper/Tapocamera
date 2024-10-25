require('dotenv').config(); // Load environment variables from .env file
const fs = require('fs');
const { google } = require('googleapis');
const readline = require('readline');

// Scopes for Google Drive API
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Path to token.json
const TOKEN_PATH = 'token.json';

// Authorize and create a Google Drive client
function authorize(callback) {
    const { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } = process.env;
    const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // Check for previously saved token
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

// Get and store new token after prompting for user authorization
function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later use
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

// Upload file to Google Drive
function uploadFile(auth) {
    const drive = google.drive({ version: 'v3', auth });
    const fileMetadata = {
        'name': 'recorded_video.mp4', // Name of the file to upload
    };
    const media = {
        mimeType: 'video/mp4',
        body: fs.createReadStream('recorded_video.mp4'), // Path to your recorded video
    };
    
    drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
    }, (err, file) => {
        if (err) {
            console.error('Error uploading file:', err);
        } else {
            console.log('File uploaded successfully, File ID:', file.data.id);
        }
    });
}

// Main function to execute the script
function main() {
    authorize(uploadFile);
}

// Call the main function
main();
