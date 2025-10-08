const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// === Supabase Configuration ===
const SUPABASE_URL = 'https://hzznfexratskutwppdol.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6em5mZXhyYXRza3V0d3BwZG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MzY4NzAsImV4cCI6MjA3MzAxMjg3MH0.Ui3semM9P8-p8GMEgiVXPcdtFEJ6GncIcUY0coyZClE';

// ملاحظة: هذا المفتاح هو "anon key"، لكن لقراءة جدول users (الذي قد لا يكون public)،
// يُفضّل استخدام SERVICE_ROLE_KEY في Netlify كمتغير بيئة.
// لكن سنستخدمه الآن كما هو، مع افتراض أن جدول users قابل للقراءة علنًا (أو عبر RLS مناسب).

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === Firebase Configuration ===
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

// === Main Netlify Function ===
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

      console.log('📨 Received fishing spot:', record);

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

      // === جلب بيانات المستخدم إذا وُجد user_id ===
      let userName = 'مستخدم مجهول';
      let userAvatarUrl = null;

      if (record.user_id) {
        const { data: user, error } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', record.user_id)
          .single();

        if (!error && user) {
          userName = user.name || 'مستخدم مجهول';
          userAvatarUrl = user.avatar_url;
        } else {
          console.warn('⚠️ User not found or error:', error?.message || 'Unknown');
        }
      }

      // === بناء نص الإشعار التفصيلي ===
      const detailedBody = 
`تمت إضافة موقع جديد
من قبل: ${userName}
في مدينة: ${record.city || 'غير محددة'}
اسم الموقع: ${record.name}
وصف الموقع: ${record.description || 'لا يوجد وصف'}`;

      // === تحديد الصورة التي ستُعرض في الإشعار ===
      const imageUrl = record.image_url || userAvatarUrl || 'https://hzznfexratskutwppdol.supabase.co/assets/default-fishing-icon.png';

      // === رسالة الإشعار الكاملة ===
      const topicMessage = {
        topic: 'new_fishing_spots',
        notification: {
          title: '🎣 موقع صيد جديد!',
          body: detailedBody,
          icon: 'https://hzznfexratskutwppdol.supabase.co/assets/fish-icon.png', // أيقونة صغيرة لشريط الحالة
          image: imageUrl // صورة داخل الإشعار
        },
        data: {
          spot_id: record.id?.toString() || '1',
          spot_name: record.name,
          city: record.city || 'غير محدد',
          user_name: userName,
          type: 'new_fishing_spot'
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_stat_fish', // اسم أيقونة في تطبيق أندرويد (اختياري)
            color: '#4CAF50'
          }
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

      console.log('📤 Sending rich notification to topic: new_fishing_spots');
      const topicResponse = await admin.messaging().send(topicMessage);
      console.log('✅ Notification sent successfully:', topicResponse);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '✅ Rich notification sent',
          topic_message_id: topicResponse,
          spot: record.name,
          user: userName
        })
      };

    } catch (error) {
      console.error('❌ FCM or Supabase Error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
