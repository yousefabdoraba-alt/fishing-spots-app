const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// بناء كائن serviceAccount من متغيرات البيئة
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

// تهيئة Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hzznfexratskutwppdol.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6em5mZXhyYXRza3V0d3BwZG9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MzY4NzAsImV4cCI6MjA3MzAxMjg3MH0.Ui3semM9P8-p8GMEgiVXPcdtFEJ6GncIcUY0coyZClE';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// تهيئة Firebase Admin (مرة واحدة فقط)
let firebaseApp = null;

try {
  if (admin.apps.length === 0) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase initialized successfully');
    console.log('✅ Supabase initialized successfully');
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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
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
        message: "🔍 Debug Mode - Check FCM & Supabase Status",
        status: "active",
        firebase: firebaseApp ? "initialized" : "failed",
        supabase: "connected",
        timestamp: new Date().toISOString(),
        endpoints: {
          send_notification: "POST /send-notification",
          health_check: "GET /"
        }
      })
    };
  }

  // إرسال إشعار عند استقبال POST
  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { record, action = 'create' } = body;

      console.log('📨 Received:', { record, action });

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

      if (!record) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing record data',
            details: 'Please provide record object in request body'
          })
        };
      }

      // 🔄 جلب بيانات المستخدم من Supabase
      let userName = 'مستخدم مجهول';
      let userAvatarUrl = null;
      let notificationTitle = '🎣 موقع صيد جديد!';
      let notificationBody = '';

      try {
        if (record.user_id) {
          const { data: user, error: userError } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', record.user_id)
            .single();

          if (!userError && user) {
            userName = user.name || 'مستخدم مجهول';
            userAvatarUrl = user.avatar_url;
          }
        }

        // بناء نص الإشعار بناءً على نوع الإجراء
        switch (action) {
          case 'create':
            notificationTitle = '📍 موقع صيد جديد!';
            notificationBody = `تمت إضافة موقع جديد\nمن قبل: ${userName}\nفي مدينة: ${record.city || 'غير محددة'}\nاسم الموقع: ${record.name}\nوصف الموقع: ${record.description || 'لا يوجد وصف'}`;
            break;
          
          case 'update':
            notificationTitle = '✏️ تم تحديث موقع الصيد';
            notificationBody = `تم تحديث موقع الصيد\nمن قبل: ${userName}\nالمكان: ${record.name}\nالمدينة: ${record.city || 'غير محددة'}`;
            break;
          
          case 'delete':
            notificationTitle = '🗑️ تم حذف موقع الصيد';
            notificationBody = `تم حذف موقع الصيد\nمن قبل: ${userName}\nالمكان: ${record.name}`;
            break;
          
          default:
            notificationTitle = '📍 موقع صيد جديد!';
            notificationBody = `تمت إضافة موقع جديد\nمن قبل: ${userName}\nفي مدينة: ${record.city || 'غير محددة'}\nاسم الموقع: ${record.name}`;
        }

      } catch (supabaseError) {
        console.warn('⚠️ Supabase user fetch failed, using default data:', supabaseError.message);
        notificationBody = `تمت إضافة موقع جديد\nاسم الموقع: ${record.name}\nالمدينة: ${record.city || 'غير محددة'}`;
      }

      // تحديد الصورة
      const imageUrl = record.image_url || userAvatarUrl || 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=🎣+موقع+صيد';

      // رسالة الإشعار المحسنة
      const topicMessage = {
        topic: 'new_fishing_spots',
        notification: {
          title: notificationTitle,
          body: notificationBody,
          image: imageUrl
        },
        data: {
          spot_id: record.id?.toString() || '1',
          spot_name: record.name,
          city: record.city || 'غير محدد',
          user_name: userName,
          action: action,
          type: 'fishing_spot_' + action,
          image_url: imageUrl,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'fishing_spots_channel'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'mutable-content': 1
            }
          },
          fcm_options: {
            image: imageUrl
          }
        },
        webpush: {
          headers: {
            image: imageUrl
          }
        }
      };

      console.log('📤 Sending notification to topic: new_fishing_spots');
      const topicResponse = await admin.messaging().send(topicMessage);
      console.log('✅ Notification sent successfully:', topicResponse);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: '✅ Notification sent successfully',
          notification_id: topicResponse,
          spot: {
            id: record.id,
            name: record.name,
            city: record.city
          },
          user: {
            name: userName,
            avatar: userAvatarUrl ? true : false
          },
          action: action,
          debug: {
            topic: 'new_fishing_spots',
            timestamp: new Date().toISOString(),
            image_used: imageUrl
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
          details: 'Check FCM configuration and topic subscriptions',
          timestamp: new Date().toISOString()
        })
      };
    }
  }

  // رفض أي طريقة غير مدعومة
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ 
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    })
  };
};
