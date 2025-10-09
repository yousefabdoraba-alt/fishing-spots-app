const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// === الإعدادات ===
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

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hzznfexratskutwppdol.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let firebaseApp = null;
try {
  if (admin.apps.length === 0) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase & Supabase initialized successfully');
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('❌ Initialization error:', error);
}

// === دالة محسنة للإشعارات المخصصة ===
const sendCustomNotification = async (notificationData) => {
  try {
    console.log('🎯 Starting custom notification process...');
    
    const { title_ar, description_ar, image_url, target_url } = notificationData;

    // التأكد من وجود البيانات المطلوبة
    if (!title_ar) {
      throw new Error('Title is required for custom notification');
    }

    // ⭐ إعداد رسالة FCM مع التركيز على data بدلاً من notification
    const message = {
      topic: 'new_fishing_spots',
      
      // ⭐ إرسال إشعار بسيط فقط للعرض
      notification: {
        title: title_ar,
        body: description_ar || 'إشعار جديد من تطبيق الصيد',
      },
      
      // ⭐ البيانات المهمة التي سيقرأها التطبيق
      data: {
        // ⭐ المعلومات الأساسية
        type: 'custom_notification',
        title: title_ar,
        description: description_ar || '',
        
        // ⭐ الرابط المستهدف - هذا هو الأهم!
        target_url: target_url || 'https://www.facebook.com',
        url: target_url || 'https://www.facebook.com',
        
        // ⭐ إشارة لفتح الرابط
        action: 'open_url',
        click_action: 'OPEN_URL',
        
        // ⭐ معلومات إضافية
        image_url: image_url || '',
        timestamp: new Date().toISOString(),
        
        // ⭐ إضافة حقل واضح للإشارة أن هذا إشعار برابط
        has_external_link: 'true',
        link_url: target_url || 'https://www.facebook.com'
      },
      
      // ⭐ إعدادات Android
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'fishing_app_channel',
          // ⭐ هذا مهم لفتح الرابط
          click_action: 'OPEN_URL'
        }
      },
      
      // ⭐ إعدادات iOS
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'mutable-content': 1
          }
        },
        fcm_options: {
          image: image_url
        }
      },
      
      // ⭐ إعدادات Web
      webpush: {
        headers: {
          image: image_url
        },
        fcm_options: {
          link: target_url || 'https://www.facebook.com'
        }
      }
    };

    // ⭐ إذا كان هناك صورة، أضفها للإشعار
    if (image_url) {
      message.notification.image = image_url;
    }

    console.log(`📤 Sending custom notification: "${title_ar}"`);
    console.log(`🔗 Target URL in data: ${target_url || 'Default Facebook URL'}`);
    console.log('📦 Data being sent:', message.data);
    
    const response = await admin.messaging().send(message);
    console.log('✅ Custom notification sent successfully!');
    console.log('📨 Message ID:', response);

    return response;
  } catch (error) {
    console.error('❌ Custom notification error:', error);
    console.error('🔍 Error details:', {
      code: error.code,
      message: error.message
    });
    throw error;
  }
};

// === باقي الدوال تبقى كما هي ===
const buildNotification = async (table, action, record) => {
  // 🔔 معالجة الإشعارات المخصصة
  if (table === 'custom_notifications' && action === 'create') {
    return {
      title: record.title_ar,
      body: record.description_ar || 'إشعار جديد من تطبيق الصيد',
      image: record.image_url || 'https://via.placeholder.com/400x200/8B5CF6/FFFFFF?text=🔔+إشعار',
      topic: 'new_fishing_spots',
      isCustom: true,
      target_url: record.target_url || 'https://www.facebook.com'
    };
  }

  // ... باقي الدوال نفسها
  // [نفس الكود السابق لبقية الجداول]
};

// === دالة Netlify Function الرئيسية ===
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
        message: "🔍 نظام إشعارات الصيد - الإصدار المحسن",
        status: "active", 
        firebase: firebaseApp ? "initialized" : "failed",
        supabase: "connected",
        timestamp: new Date().toISOString()
      })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { record, action = 'create', table } = body;

      console.log('📨 Received request:', { 
        table: table || 'unknown', 
        action: action,
        record_id: record?.id 
      });

      if (!firebaseApp) {
        throw new Error('Firebase not initialized');
      }

      if (!record) {
        throw new Error('Missing record data');
      }

      if (!table) {
        throw new Error('Missing table name');
      }

      // 🔔 معالجة الإشعارات المخصصة
      if (table === 'custom_notifications' && action === 'create') {
        console.log('🎯 Processing custom notification...');
        
        const response = await sendCustomNotification(record);
        
        // تحديث حالة الإرسال في قاعدة البيانات
        if (record.id) {
          try {
            const { error: updateError } = await supabase
              .from('custom_notifications')
              .update({ 
                is_sent: true, 
                sent_at: new Date().toISOString() 
              })
              .eq('id', record.id);

            if (updateError) {
              console.warn('⚠️ Could not update notification status:', updateError.message);
            } else {
              console.log('✅ Notification status updated in database');
            }
          } catch (dbError) {
            console.warn('⚠️ Database update error:', dbError.message);
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: '✅ تم إرسال الإشعار المخصص بنجاح',
            notification_id: response,
            type: 'custom',
            table: table,
            action: action,
            target_url: record.target_url,
            timestamp: new Date().toISOString()
          })
        };
      }

      // ... باقي الكود للإشعارات العادية
      // [نفس الكود السابق]

    } catch (error) {
      console.error('❌ Notification processing error:', error);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message,
          details: 'Check function logs for more information'
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ 
      error: 'Method not allowed',
      allowed_methods: ['GET', 'POST', 'OPTIONS']
    })
  };
};
