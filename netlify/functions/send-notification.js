const admin = require('firebase-admin');

// بناء كائن serviceAccount من متغيرات البيئة
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com"
};

// تهيئة Firebase Admin (مرة واحدة فقط)
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

// دالة Netlify Function الرئيسية
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // التعامل مع طلبات CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // وضع التحقق (Debug Mode)
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

  // إرسال إشعار عند استقبال POST
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
            debug: 'Check Firebase credentials in Netlify Environment Variables'
          })
        };
      }

      // رسالة الإشعار للموضوع
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

  // رفض أي طريقة غير مدعومة
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
