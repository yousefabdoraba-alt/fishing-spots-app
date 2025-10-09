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

// دالة الإشعارات المخصصة - الإصدار المصحح
const sendCustomNotification = async (notificationData) => {
  try {
    const { title_ar, description_ar, image_url, target_url } = notificationData;

    if (!title_ar) throw new Error('Title required');

    // ⭐⭐ الإصدار المصحح: استخدام notification مع data بشكل صحيح
    const message = {
      topic: 'new_fishing_spots',
      
      // ⭐ الإشعار الرئيسي الذي يظهر للمستخدم
      notification: {
        title: title_ar,
        body: description_ar || 'اضغط لفتح الرابط',
        // ⭐ إضافة صورة إذا كانت متوفرة
        ...(image_url && { image: image_url })
      },
      
      // ⭐ البيانات التي يقرأها التطبيق
      data: {
        // ⭐ الرابط المستهدف - هذا هو الأهم
        target_url: target_url || 'https://www.facebook.com',
        direct_link: 'true',
        action: 'open_browser',
        
        // ⭐ معلومات إضافية
        type: 'external_link',
        timestamp: new Date().toISOString(),
        title: title_ar,
        message: description_ar || 'إشعار جديد'
      },
      
      // ⭐ إعدادات Android المصححة
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'fishing_app_channel',
          // ⭐ هذا يخبر النظام بفتح الرابط مباشرة
          click_action: 'OPEN_URL'
        }
      },
      
      // ⭐ إعدادات iOS المصححة
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            alert: {
              title: title_ar,
              body: description_ar || 'اضغط لفتح الرابط'
            }
          }
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

    console.log(`📤 Sending notification: "${title_ar}"`);
    console.log(`🔗 Target URL: ${target_url}`);
    
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully');

    return response;
  } catch (error) {
    console.error('❌ Notification error:', error);
    throw error;
  }
};

// دالة بناء الإشعارات للجداول الأخرى (نفس الكود السابق)
const buildNotification = async (table, action, record) => {
  if (table === 'custom_notifications' && action === 'create') {
    return {
      title: record.title_ar,
      body: record.description_ar || 'إشعار جديد من تطبيق الصيد',
      image: record.image_url,
      topic: 'new_fishing_spots',
      isCustom: true,
      target_url: record.target_url || 'https://www.facebook.com'
    };
  }

  // ... باقي الجداول (نفس الكود السابق)
  if (table === 'fishing_spots') {
    let userName = 'مستخدم مجهول';
    try {
      if (record.user_id) {
        const { data: user } = await supabase
          .from('users')
          .select('name, avatar_url')
          .eq('id', record.user_id)
          .single();
        if (user) userName = user.name || 'مستخدم مجهول';
      }
    } catch (e) {
      console.warn('User fetch failed:', e.message);
    }

    const notificationTitle = action === 'create' ? '📍 موقع صيد جديد!' : '✏️ تم تحديث موقع الصيد';
    const notificationBody = action === 'create' 
      ? `تمت إضافة موقع جديد\nمن قبل: ${userName}\nفي مدينة: ${record.city || 'غير محددة'}\nاسم الموقع: ${record.name}`
      : `تم تحديث موقع الصيد\nمن قبل: ${userName}\nالمكان: ${record.name}`;

    return {
      title: notificationTitle,
      body: notificationBody,
      image: record.image_url || 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=🎣+موقع+صيد',
      topic: 'new_fishing_spots'
    };
  }

  // الجداول الأخرى
  const configs = {
    'fish_articles': {
      create: { title: '🐟 مقال جديد عن الأسماك', body: `تعرف على سمكة: ${record.name}` },
      update: { title: '✏️ تم تحديث مقال الأسماك', body: `تم تحديث مقال: ${record.name}` }
    },
    'bait_articles': {
      create: { title: '🪱 مقال جديد عن الطعوم', body: `تعرف على طعم: ${record.title_ar}` },
      update: { title: '✏️ تم تحديث مقال الطعوم', body: `تم تحديث مقال: ${record.title_ar}` }
    },
    'bait_categories': {
      create: { title: '🪱 تمت إضافة نوع طعم جديد', body: `نوع الطعم: ${record.name_ar}` },
      update: { title: '✏️ تم تحديث نوع الطعم', body: `تم تحديث: ${record.name_ar}` }
    },
    'gear_articles': {
      create: { title: '⚙️ مقال جديد عن معدات الصيد', body: `تعرف على معدة: ${record.title_ar}` },
      update: { title: '✏️ تم تحديث مقال المعدات', body: `تم تحديث مقال: ${record.title_ar}` }
    },
    'gear_categories': {
      create: { title: '⚙️ تمت إضافة معدة صيد جديدة', body: `المعدة: ${record.name_ar}` },
      update: { title: '✏️ تم تحديث معدة الصيد', body: `تم تحديث: ${record.name_ar}` }
    }
  };

  const config = configs[table]?.[action];
  if (!config) throw new Error(`No config for table: ${table}, action: ${action}`);

  const defaults = {
    'fish_articles': 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=🐟+سمكة',
    'bait_articles': 'https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=🪱+طعم',
    'bait_categories': 'https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=🪱+طعم',
    'gear_articles': 'https://via.placeholder.com/400x200/EF4444/FFFFFF?text=⚙️+معدة',
    'gear_categories': 'https://via.placeholder.com/400x200/EF4444/FFFFFF?text=⚙️+معدة'
  };

  return { 
    ...config, 
    image: record.image_url || defaults[table],
    topic: 'new_fishing_spots'
  };
};

// دالة Netlify الرئيسية المصححة
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
        message: "نظام الإشعارات المصحح",
        status: "active",
        firebase: firebaseApp ? "initialized" : "failed"
      })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { record, action = 'create', table = 'custom_notifications' } = body;

      console.log('📨 Received:', { table, action, record_id: record?.id });

      if (!firebaseApp) throw new Error('Firebase not initialized');
      if (!record) throw new Error('Missing record data');

      // معالجة الإشعارات المخصصة
      if (table === 'custom_notifications' && action === 'create') {
        console.log('🎯 Processing custom notification...');
        
        const response = await sendCustomNotification(record);
        
        // تحديث قاعدة البيانات
        if (record.id) {
          try {
            await supabase
              .from('custom_notifications')
              .update({ 
                is_sent: true, 
                sent_at: new Date().toISOString() 
              })
              .eq('id', record.id);
            console.log('✅ Database updated');
          } catch (dbError) {
            console.warn('⚠️ Database update warning:', dbError.message);
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: '✅ تم إرسال الإشعار بنجاح',
            notification_id: response,
            target_url: record.target_url
          })
        };
      }

      // الإشعارات العادية
      const config = await buildNotification(table, action, record);

      const message = {
        topic: config.topic,
        notification: {
          title: config.title,
          body: config.body,
          ...(config.image && { image: config.image })
        },
        data: {
          table: table,
          action: action,
          item_id: record.id?.toString() || '1',
          item_name: record.name || record.title_ar || record.name_ar || 'غير محدد',
          ...(config.image && { image_url: config.image }),
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'fishing_app_channel'
          }
        }
      };

      console.log(`📤 Sending ${table} notification`);
      const response = await admin.messaging().send(message);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `✅ تم إرسال إشعار ${table}`,
          notification_id: response
        })
      };

    } catch (error) {
      console.error('❌ Error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: error.message 
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
