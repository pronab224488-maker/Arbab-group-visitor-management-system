const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const stream = require('stream');

const app = express();
app.use(bodyParser.json({ limit: '15mb' }));

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json', 
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ]
});

app.post('/api/visitor/checkin', async (req, res) => {
  try {
    const { token, date, name, phone, department, hostName, purpose, photo } = req.body;
    
    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // ১. Google Drive-এ ছবি আপলোড
    const base64Data = photo.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const folderId = 'YOUR_GOOGLE_DRIVE_FOLDER_ID'; // ড্রাইভ ফোল্ডার আইডি

    const driveResponse = await drive.files.create({
      requestBody: {
        name: `Token_${token}_${phone}.png`,
        parents: [folderId]
      },
      media: { mimeType: 'image/png', body: bufferStream }
    });

    const fileId = driveResponse.data.id;
    await drive.permissions.create({
      fileId: fileId,
      requestBody: { role: 'reader', type: 'anyone' }
    });

    const photoUrl = `https://drive.google.com/uc?id=${fileId}`;

    // ২. Google Sheets-এ টোকেন ও অন্যান্য ডাটা এন্ট্রি
    const spreadsheetId = 'YOUR_GOOGLE_SHEET_ID'; // গুগল শিট আইডি
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:I',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          token,
          date,
          name, 
          phone, 
          department, 
          hostName, 
          purpose, 
          photoUrl,
          'Checked In'
        ]]
      }
    });

    res.json({ success: true, message: "Token and visitor data saved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => {
  console.log('Visitor Server running on port 3000');
});