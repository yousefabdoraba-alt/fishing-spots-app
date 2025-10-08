const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "libyan-fishing-guide",
  "private_key_id": "5c788f8da1051dad6b08ef20b568dde402d87b4c",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCp9h3k3R+ZUoSg\nkTzIVRUyYAW/C0e3RlYnTcysQKKJyZKh9DtEvGTFOnnUaggzj0izwgQCF2yynGBE\nHZoP7cWONcVVhaxjZV+4JngQwUEncx3uyyWDbI5A8HsNr4sHTwcSP7Vi+uS3E7U1\nDBh5Fq594/yr7oW13ybzfcMHb+GWcLVU4ChMICoiFirarKVhvFE00NF7+mdREPt/\nzCyKyboC/vYK9M7dBuWdLgmiFvwbO3dROwZzmDub074W62Y15TSQI3CDMR5okmIr\nGQciII7bzKgJC6ZM2/pdLP2LMkmrtl5T+j8XOJ/boh9cgCNre+CHs6shoL9RtJEY\n7knqip2VAgMBAAECggEADnnmBe5HmLmMjliQgsesbIP9OU5up0+YWvSncCx5K589\nnAm/WpVpR9s5MTxuwmV73cOyr7LrETN8h5C15JFt+DTgP+6IxlaGFptAMr0jHYcS\nj5pB8bW3UBSrhnjjMJYslgNTIcEY5fcJwiDrnLSv3A0lIkfIn7sICEk36VRANJ31\nX9M8Nj7CrORz8R1Vnl3wDPcOD+SG+TKCltSGRVCDCOzJienbSnqxA+WnQGSDNvuN\nShYaB8WGPAp5pupPk9mT72P50P4DATXHi6C64FRsmf0+6q/0pSzQ5Md51ag712iA\nyHKok6uea8fUDplxHbsJyaLBAD834i231Wu4Oxn3wQKBgQDbYobQo53vFjek3y15\ngM9aa1NW1W5wIPE4u0bjxGKAJjkEauFs6DVHp61W9O0aCMST8UIOI9PbQASFY4V5\nlXk5kC92YFTyg8/mTcqLWLLv+sWjSZ2zx6kDmX4axIIn2cAcfZEvYLQsjDSMPgIl\nYI+CmjhD7r+6W6u4c0vc0vKnOQKBgQDGU+osBZA43GWAf7QP6qst3xYPSm3uq5uB\nZi2L1QsHKkmjK25oowCaQ1hg8uJbWoYaDwI6iqyHLXTjVZEaeyENZE1xm3v0KVU0\n5dMAL9LXLZ+az3DpwTX81jG/OiolsGAY4qKd3n/zqKnYKs5a55pL60F/F7gDVnRA\n+dtnADHtPQKBgQCYLjdggS7sC5hbyOiNkTnE+hAcev8ZzvAlr1tUYgUF6f3BP7bR\nyh4zb3ABkvLqDUz3ZvKwRlAOldDNCqUrGvG1aXxS/C3Q8HiFxE6M7OFrMKRqSYWY\nkRZ/xbjBLrEunZDy8nOEzusMv9Evu0/Xx6ylJv+CuBnNVwu+blQggUALmQKBgF82\nlBq0RQv3S0eIh4KIr8ui6S1IF0TY4BwcWMtj6Rp0g8uxIx1a/AQTRs+sa11eNTk3\ncWN3heKTwSUOxE3JRRHv0Ho1IioS2dQ+bbEORJOHVLN22YdveaK7lkBvBSL47Pml\nfFp8IkNw+rFLw6vCusGt3NDOK0p26/LxwRJO9qklAoGAKBc3FU/pT+L+I+KUWhFe\ngSaDQ3C0PK/L5kT1lbzjr/pmwvPk3TxBBHMNpKy17WVDBig+HR4FCqkZqKg6ACok\noKFQfde9l6sifl8OA+DmvyQoBQYyR5Ke1qzzGgUahwq0/NTJiEf2NFL99lC2/vTS\nFMwCPrGzSLEwDjSpD4DfndE=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@libyan-fishing-guide.iam.gserviceaccount.com",
  "client_id": "118099379101046874094",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40libyan-fishing-guide.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// تهيئة Firebase
let firebaseApp = null;

try {
  if (admin.apps.length === 0) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase initialized successfully');
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: "🔍 Debug Mode - Check FCM Status",
        status: "active",
        firebase: firebaseApp ? "initialized" : "failed",
        timestamp: new Date().toISOString()
      })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body);
      const { record } = body;

      console.log('📨 Received:', record);

      if (!firebaseApp) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Firebase not initialized',
            debug: 'Check Firebase credentials'
          })
        };
      }

      // إرسال إشعارين: واحد لـ topic وواحد مباشر للتجربة
      const topicMessage = {
        topic: 'new_fishing_spots',
        notification: {
          title: '🎣 موقع صيد جديد!',
          body: `تم إضافة: ${record.name} في ${record.city || 'موقع جديد'}`,
        },
        data: {
          spot_id: record.id?.toString() || '1',
          spot_name: record.name,
          city: record.city || 'غير محدد',
          type: 'new_fishing_spot',
          debug: 'topic_message'
        },
        android: {
          priority: 'high'
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      console.log('📤 Sending to topic: new_fishing_spots');
      const topicResponse = await admin.messaging().send(topicMessage);
      console.log('✅ Topic message sent:', topicResponse);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '✅ Notifications sent',
          topic_message_id: topicResponse,
          spot: record.name,
          debug: {
            topic: 'new_fishing_spots',
            timestamp: new Date().toISOString()
          }
        })
      };

    } catch (error) {
      console.error('❌ FCM Error:', error);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: error.message,
          code: error.code,
          details: 'Check FCM configuration and topic subscriptions'
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
