const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": "fishingspotsnotifications",
  "private_key_id": "8d95de11af7f99164dbfec250fc24bd1fcda0a42",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCh/mriwa/x/ckA\nTrVpUXrXEY3DU5j4QqsprKzQh88N/m6k2UhthfWGERemC/H+w66cYdDJi9Pu6hJW\nA671BoEfXOJhnrrZRMgFKLeOvta+5vbwLmxdirPX7tNJmjH9beY7/druA6nN7b2N\nnuEEKI79vIs24oF2y12+9Wzagq5FEZyfy5iTdIRCY1kvvVrXPGu/t/GnzJp8+8Bk\nOOkiBYtvPMNe5odoo6k3HIfQ0NY3fIk0DEmhruqQMXQFYM81IqxjdLECXBi9S/zU\nT3uE5iVZsfGWG8Tqfi5v/gEZm809nbxfazZJXfRnX9nSvNrQbROda+30J9UDI3hy\n0KIShMNFAgMBAAECggEAIdZsikAuGezKoytNvpmcALe0doQMVHNMoJBmqspriD9I\n6ltOwz3zqtUALRmaq35Bh33xKGByXRn8yYXMcncw2pXC3eRToFW7OESojwMzBT5m\nf4Ya8bEq3uSOsvWoEol1ybs9k3Elc5QA/8ebtgwozjynkcffhip1wxEt8zjP4TI2\ncg54MLrvDK4Oo/mHEG152SDsO0IC2+kjU8dqcfsO9ShAf8Mo9l3KPM5Mcuhq/SW9\nLCP2Mph32TukRf1LHJZnqHlmOXAmJLdFwGg+rpLjy/ORzTsXcYQJdydCCR4L+HRg\nDEMQHHLMoSp1U39hBl72T2HrKGrESY+w/EwPn8WgowKBgQDkjg8iMpTJ7Wqzhvc1\nPFlnU/WNWD3/erho9obiJ/kHRct4QqdPpvMGHeHWohqncsD8hR+tAx/BJOUqj/oT\nuweSqEpb0F0yuNRzdaQ9LajQ9KLQYqK9CBz1E/Eqi4MzbiaTJMQ8v5AQmz9tcyN0\nF7V9XoCpdevHe6H3SQC1SuYt4wKBgQC1cjkKUGWBeJWVsqUL3VtZfypU5fEPrrgC\nXvk+aCg7Q3EOhUQJzx8eFJJ6B+uHFu0eVYiWBsFO4bpsV4RG9OSOVxHvL/NLGJJO\nknqG8t9yR/RO+WQhOK7LP2f9b4dVf2I1Bss1k2/JotWaWW7/XmdLBqxPyo/a63Nu\ne1YEoEAStwKBgEu6slL/dYNu0kMH/lM6Wtk83Yjm6ywCqqXEwa6f1gjN3HxNgYiH\n5dBqCFGIxtIi2MUTCwrVlSj3I6O1rwPonbq/XlwLr0XGLkbPfQr0XRJXbLclZ4zA\n6m9eGzOgpGlfHxL0RL1oL8EA38RROTcXQAB5VqJPuz8OvPzlyIFJfvlHAoGBAJm7\ngHarrYUoDN078jj+QNKwOsaZ2EfoSgHARD9K8qNbveOGqCIDeiL7XSvFoBniI99q\nqwIqEQjrmg8Hi4yvGyM6xHg60VEULYoi82t5RjbGnkl3Zg37v6V3QH1rTGf1ONki\nu3PWSoW10HMpSTFW4/+eVMp6Hq5mhXPbTgM3X3I7AoGAe8jXl0Amr9uKxMzdJI9b\nkXwZPwUKVqinC9l4jOVK38YLsAeM8pndHdRkNif9eEypKNlCRoJVJ2tiJsMf+toZ\nfY7UZhjKFgDptZ/ReI0YnvXJnLUBSs9Xn6GYbFtjNuRjpIGWUZeSJpqSIy1Z9UZB\n6zutj8R6fAvMm94VLozqxg0=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@fishingspotsnotifications.iam.gserviceaccount.com",
  "client_id": "116236730199178004729",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40fishingspotsnotifications.iam.gserviceaccount.com",
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