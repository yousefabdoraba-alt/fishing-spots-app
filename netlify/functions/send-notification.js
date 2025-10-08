const admin = require('firebase-admin');

// التهيئة (ستعمل كما هي)
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com"
};

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

// الدالة الرئيسية لـ Vercel Serverless
module.exports = async (req, res) => {
  // تعيين رؤوس CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json({
      message: "🔍 Debug Mode - Check FCM Status",
      status: "active",
      firebase: firebaseApp ? "initialized" : "failed",
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const { record } = req.body;
      console.log('📨 Received:', record);

      if (!firebaseApp) {
        return res.status(500).json({ 
          error: 'Firebase not initialized'
        });
      }

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
          type: 'new_fishing_spot'
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

      return res.json({
        success: true,
        message: '✅ Notifications sent',
        topic_message_id: topicResponse,
        spot: record.name,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ FCM Error:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
