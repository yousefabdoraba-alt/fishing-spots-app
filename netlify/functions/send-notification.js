

const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "libyan-fishing-guide",
  "private_key_id": "66fc196be950d8534a134e0a1bc2c95b81cf62b3",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4ucDURttbPgry\nVCjkxLR8qTSVPKoq7eTqmmSWhvvsvqiQ0SWMZidtfEBvx+xzRrEeVV3r1IkF4B8g\n8GF2fDZiAvJI8MCWLnKTaejRhW9OTsNv2mSEA7r1qyjRljUsrvEXysVaM0lAyHGz\nYG/cobRseZ0OpStk9V3X2mTmfiwiI+ZDCIJDf8xdQjX9klFQPpw+N+Nc7ETvfH0K\nHPXnyUoprwiubqOVepouAR9iofjXSBNRfNEecAjFcD/ID6Y+ZojCS7ncfPg/e7xZ\nOkGd4kgbJyKW1l7r2JdQFZzw1fBWdjwDuMaY68nBg6OQCJ9lJAKEnGa0HAPpxPG3\nfkf2CAIzAgMBAAECggEAAX8JAk8pSLBpy0kGOcV5cXG3aia0eXuKzqGog0BIUG8X\nk3C2PVBjLQkEG+5XynPoobEZp9GFY0Wg9ZXXhuuo+cXsq3g+acOqNup1Mc6YYQnU\nncEm7kYky1zzDDDgxmILtDXMFRfJlfDpsYUW8t0LxpMnmVjveeEI57jY92BPQDQx\ntdu5dlxeOrv0LiJEVAhQPXb6OQyE9CQXBkaqe+OUrUDV0VveSEnrkRMjcRUhJPQh\nQZFwCwnolsRRu2xEl0YrjAL/2JAnqaOmAWnngVYBVSWlXrB8Wj40H0I/umFeMVHv\npgR789bPte5k82Lq7+zyR7514ZIS/a9f85R2AF6PvQKBgQDiaJu89xpHoY2PfZnf\nMAqNrFZRU5eszrqBPYB2RPsU2P7WGG1sv8Le42JM1RwDEwTB99mFf0EkvIrbZgcj\nvhRy7mP1QAXbCjP8qsuyYE2WOfb7UJd5ajmjU5K/AvrB/CNVmq2eQNQiNVZH0Wc5\nDymnSH8/aPfv16I7nYw0fQvMPwKBgQDQ3nmjGOBe/LjznooGwkFEnBCAGYe2btzp\nDkSFehqI04kuO3265gRR64QhIpZ9FL+jzTTia4Yy4VCI6v7HCtg9cjmpAwaO4TeF\n8N3XD9doGcietpoGB2vRcUfL3MUfZHg1w7mW8oeYZm4JySSUTnqJ14bedQntH7Qg\nn1U4xNSdDQKBgQCRkqUgGNli2TMF4cI/yMngUcCmRdMuHzW3x22DndK6ktM3oTkq\nRRns6dLYh+Wc7GuQs+W+ehXOoxO9AZrxllPbmf/XPrUFI0hN2xths53vS5HMAQOD\n45LvutqNykKk25N0hSHAsPo0jIrPXoq6G0+y6WA3yywvoDwFjMULMqOVTQKBgHzx\nCCwS/mxzmqNIa+J9IxPKk2g9XVw41vambUC2+NZuS3oXZi991om2a3RyvziVR8nR\nP9hNX5piA43TnJIuH4oqIOnEAJFJkbASlHFIbZ89BTBDpMEEgW9o5vzA1D3iGLJ4\noTT1YT090IcUBkic5Vo9TdUWh9iLhXGaPh1WSKSlAoGACaElD/rdG+7NrPt/ItgJ\nIDGREEqkJGrtqpfiIC09bHROXU5Xzv8+olS51Q226CzqCIG9702iPNnBx/Tzp+Ti\nqQX/yZc3esLtNUzIx3By8nP2kGmOA3YoIa17gW6xAYjxME3O386cxGL/mzGcmnv6\nOQv75OktNwz/h2LK4fUMfYU=\n-----END PRIVATE KEY-----\n",
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

