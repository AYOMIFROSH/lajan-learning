const { google } = require('googleapis');
require('dotenv').config();

// Function to list labels
async function listOfLabels(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    try {
        const res = await gmail.users.labels.list({
            userId: "me",
        });

        const labels = res.data.labels;
        if (!labels || labels.length === 0) {
            console.log("No labels are found!");
            return;
        }

        console.log('Labels:');
        labels.forEach((label) => {
            console.log(`- ${label.name}`);
        });

        return labels;
    } catch (error) {
        console.error("Error listing labels:", error.message);
        throw error;
    }
}

// Function to refresh access token
async function refreshAccessToken(refreshToken) {
    try {
        // Create OAuth2 client with your app credentials
        const oauth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET
        );
        
        // Set credentials using the refresh token
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        // Refresh the access token
        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('Refreshed Access Token:', credentials.access_token); // Log for debugging

        return credentials.access_token; // Return the new access token
    } catch (error) {
        console.error("Error refreshing access token:", error.message);
        throw error;
    }
}




// Function to send email using Gmail API
async function sendEmail(refreshToken, content, subject, toEmail) {
    function formatPlainText(content) {
        // Split the text by newline, trim each line, and then join with double line breaks.
        return content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\r\n\r\n');
      }
    
    const formattedContent = formatPlainText(content);
    try {
        const accessToken = await refreshAccessToken(refreshToken);

        const oauth2Client = new google.auth.OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET
        );
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Prepare MIME message with plain text content
        const emailContent = [
            `To: ${toEmail}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset="UTF-8"',
            '',
            formattedContent, // Use the formatted plain text content
          ].join('\r\n');

        const encodedMessage = Buffer.from(emailContent)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });

        console.log('Email sent:', res.data);
        return res.data;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
}


// Function to get the latest message
async function getLatestMessage(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    try {
        const res = await gmail.users.messages.list({
            userId: "me",
            maxResults: 1, // Get the most recent message
        });

        let latestMessageId = res.data.messages[0].id;
        console.log(`Latest message id is: ${latestMessageId}`);

        const messageContent = await gmail.users.messages.get({
            userId: "me",
            id: latestMessageId,
        });

        const body = JSON.stringify(messageContent.data.payload.body.data);
        console.log('Message body:', body);

        // Decode the message body from Base64
        let mailBody = new Buffer.from(body, "base64").toString();
        console.log('Decoded message body:', mailBody);
        return mailBody;
    } catch (error) {
        console.error("Error getting latest message:", error.message);
        throw error;
    }
}

// Export all functions
module.exports = {
    listOfLabels,
    sendEmail,
    getLatestMessage
};
