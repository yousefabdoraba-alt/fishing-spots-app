const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// الإعدادات
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
    console.log('✅ Firebase initialized');
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('❌ Initialization error:', error);
}

// دالة الإشعارات المخصصة - الإصدار الجذري
const sendCustomNotification = async (notificationData) => {
  try {
    const { title_ar, description_ar, image_url, target_url } = notificationData;

    if (!title_ar) throw new Error('Title required');

    // ⭐⭐ الطريقة الجذرية: إرسال إشعار "صامت" بدون فتح التطبيق
    const message = {
      topic: 'new_fishing_spots',
      
      // ⭐ لا نستخدم notification عادي لأنه يفتح التطبيق
      // بدلاً من ذلك نستخدم data فقط مع إعدادات خاصة
      data: {
        // ⭐ هذه العلامة تخبر التطبيق بفتح الرابط مباشرة
        action: 'open_browser',
        url: target_url || 'https://www.facebook.com',
        
        // ⭐ معلومات الإشعار للعرض
        title: title_ar,
        message: description_ar || 'إشعار جديد',
        image: image_url || '',
        
        // ⭐ إعدادات خاصة لمنع فتح التطبيق
        click_action: 'OPEN_URL',
        direct_link: 'true',
        open_external: 'true',
        no_app_open: 'true',
        
        // ⭐ معلومات إضافية
        type: 'external_link',
        timestamp: new Date().toISOString()
      },
      
      // ⭐ إعدادات Android الحاسمة
      android: {
        priority: 'high',
        // ⭐ هذا هو السر: notification صغير مع click_action
        notification: {
          title: title_ar,
          body: description_ar || 'اضغط لفتح الرابط',
          icon: 'ic_notification',
          color: '#4F46E5',
          sound: 'default',
          channel_id: 'fishing_app_channel',
          // ⭐⭐ هذا الأهم: يفتح الرابط مباشرة
          click_action: 'OPEN_URL'
        }
      },
      
      // ⭐ إعدادات iOS
      apns: {
        payload: {
          aps: {
            alert: {
              title: title_ar,
              body: description_ar || 'اضغط لفتح الرابط'
            },
            sound: 'default',
            badge: 1
          },
          // ⭐ بيانات إضافية لـ iOS
          target_url: target_url || 'https://www.facebook.com',
          open_external: true
        }
      },
      
      // ⭐ إعدادات Web
      webpush: {
        notification: {
          title: title_ar,
          body: description_ar || 'اضغط لفتح الرابط',
          requireInteraction: true
        },
        fcm_options: {
          link: target_url || 'https://www.facebook.com'
        }
      }
    };

    console.log(`📤 Sending direct-link notification: "${title_ar}"`);
    console.log(`🔗 Direct URL: ${target_url}`);
    
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent with direct link');

    return response;
  } catch (error) {
    console.error('❌ Notification error:', error);
    throw error;
  }
};

// دالة Netlify الرئيسية
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
        message: "نظام الإشعارات المباشرة",
        status: "active"
      })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { record, table } = body;

      if (!firebaseApp || !record || table !== 'custom_notifications') {
        throw new Error('Invalid request');
      }

      const response = await sendCustomNotification(record);
      
      // تحديث قاعدة البيانات
      if (record.id) {
        await supabase
          .from('custom_notifications')
          .update({ is_sent: true, sent_at: new Date().toISOString() })
          .eq('id', record.id);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'تم إرسال الإشعار المباشر',
          notification_id: response
        })
      };

    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: error.message })
      };
    }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
};

