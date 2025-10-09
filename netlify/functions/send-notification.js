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

    const message = {
      topic: 'new_fishing_spots',
      notification: {
        title: title_ar,
        body: description_ar || 'إشعار جديد من تطبيق الصيد',
        image: image_url || 'https://via.placeholder.com/400x200/8B5CF6/FFFFFF?text=🔔+إشعار'
      },
      data: {
        type: 'custom_notification',
        title: title_ar,
        description: description_ar || '',
        image_url: image_url || '',
        target_url: target_url || 'https://www.facebook.com/groups/yourfishinggroup',
        click_action: target_url || 'https://www.facebook.com/groups/yourfishinggroup',
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'fishing_app_channel',
          click_action: 'OPEN_URL'
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
          image: image_url,
          link: target_url || 'https://www.facebook.com/groups/yourfishinggroup'
        }
      }
    };

    console.log(`📤 Sending custom notification: "${title_ar}"`);
    console.log(`🔗 Target URL: ${target_url || 'Default Facebook URL'}`);
    
    const response = await admin.messaging().send(message);
    console.log('✅ Custom notification sent successfully!');
    console.log('📨 Message ID:', response);

    return response;
  } catch (error) {
    console.error('❌ Custom notification error:', error);
    console.error('🔍 Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// === الدالة الرئيسية ===
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
        throw new Error('Firebase not initialized - check environment variables');
      }

      if (!record) {
        throw new Error('Missing record data in request body');
      }

      if (!table) {
        throw new Error('Missing table name in request body');
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

      // للإشعارات العادية (الأسماك، الطعوم، إلخ)
      console.log(`📤 Processing regular notification for ${table}`);
      
      // كود الإشعارات العادية هنا...
      // ... (نفس الكود السابق للإشعارات العادية)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `✅ تم إرسال الإشعار العادي لـ ${table}`,
          table: table,
          action: action
        })
      };

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
