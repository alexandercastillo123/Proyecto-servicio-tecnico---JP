const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

let firebaseApp = null;

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error.message);
    }
} else {
    console.warn('serviceAccountKey.json not found. Push notifications will be disabled.');
}

const sendPushNotification = async (token, title, body, data = {}) => {
    if (!firebaseApp) {
        console.warn('⚠️ Cannot send push notification: Firebase not initialized');
        return false;
    }

    try {
        const message = {
            notification: {
                title,
                body
            },
            data: {
                ...data,
                click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            token
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};

module.exports = {
    admin,
    sendPushNotification
};
