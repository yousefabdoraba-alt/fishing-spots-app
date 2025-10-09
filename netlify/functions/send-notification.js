const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// === إعداد بيانات Firebase ===
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

// === إعداد Supabase ===
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hzznfexratskutwppdol.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// === تهيئة Firebase Admin ===
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

// === دالة خاصة للإشعارات المخصصة ===
const sendCustomNotification = async (notificationData) => {
  try {
    const { title_ar, description_ar, image_url, target_url } = notificationData;

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
        // ⭐ الرابط الخارجي
        target_url: target_url || 'https://www.facebook.com/YourFishingPage',
        click_action: target_url || 'https://www.facebook.com/YourFishingPage',
        timestamp: new Date().toISOString()
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'fishing_app_channel',
          // ⭐ فتح المتصفح للرابط الخارجي
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
          // ⭐ رابط خارجي لـ iOS
          link: target_url || 'https://www.facebook.com/YourFishingPage'
        }
      },
      webpush: {
        headers: {
          image: image_url
        },
        // ⭐ رابط خارجي للويب
        fcm_options: {
          link: target_url || 'https://www.facebook.com/YourFishingPage'
        }
      }
    };

    console.log(`📤 Sending custom notification: ${title_ar}`);
    console.log(`🔗 External URL: ${target_url || 'https://www.facebook.com/YourFishingPage'}`);
    
    const response = await admin.messaging().send(message);
    console.log('✅ Custom notification sent successfully:', response);

    return response;
  } catch (error) {
    console.error('❌ Custom notification error:', error);
    throw error;
  }
};

// === بناء الإشعارات حسب الجدول ===
const buildNotification = async (table, action, record) => {
  // 🔔 معالجة الإشعارات المخصصة
  if (table === 'custom_notifications' && action === 'create') {
    return {
      title: record.title_ar,
      body: record.description_ar || 'إشعار جديد من تطبيق الصيد',
      image: record.image_url || 'https://via.placeholder.com/400x200/8B5CF6/FFFFFF?text=🔔+إشعار',
      topic: 'new_fishing_spots',
      isCustom: true,
      // ⭐ رابط خارجي للإشعارات المخصصة
      target_url: record.target_url || 'https://www.facebook.com/YourFishingPage'
    };
  }

  if (table === 'fishing_spots') {
    // إشعارات مواقع الصيد — النسخة المفصلة
    let userName = 'مستخدم مجهول';
    let userAvatarUrl = null;
    let notificationTitle = '';
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
    } catch (e) {
      console.warn('⚠️ Supabase fetch failed:', e.message);
      notificationTitle = '📍 موقع صيد جديد!';
      notificationBody = `تمت إضافة موقع جديد: ${record.name}\nالمدينة: ${record.city || 'غير محددة'}`;
    }

    const imageUrl = record.image_url || userAvatarUrl || 'https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=🎣+موقع+صيد';

    return {
      title: notificationTitle,
      body: notificationBody,
      image: imageUrl,
      topic: 'new_fishing_spots'
    };
  }

  // === إشعارات الجداول الأخرى ===
  const configs = {
    'fish_articles': {
      create: {
        title: '🐟 مقال جديد عن الأسماك',
        body: `تعرف على سمكة: ${record.name}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      },
      update: {
        title: '✏️ تم تحديث مقال الأسماك',
        body: `تم تحديث مقال: ${record.name}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      }
    },
    'bait_articles': {
      create: {
        title: '🪱 مقال جديد عن الطعوم',
        body: `تعرف على طعم: ${record.title_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      },
      update: {
        title: '✏️ تم تحديث مقال الطعوم',
        body: `تم تحديث مقال: ${record.title_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      }
    },
    'bait_categories': {
      create: {
        title: '🪱 تمت إضافة نوع طعم جديد',
        body: `نوع الطعم: ${record.name_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      },
      update: {
        title: '✏️ تم تحديث نوع الطعم',
        body: `تم تحديث: ${record.name_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      }
    },
    'gear_articles': {
      create: {
        title: '⚙️ مقال جديد عن معدات الصيد',
        body: `تعرف على معدة: ${record.title_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      },
      update: {
        title: '✏️ تم تحديث مقال المعدات',
        body: `تم تحديث مقال: ${record.title_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      }
    },
    'gear_categories': {
      create: {
        title: '⚙️ تمت إضافة معدة صيد جديدة',
        body: `المعدة: ${record.name_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      },
      update: {
        title: '✏️ تم تحديث معدة الصيد',
        body: `تم تحديث: ${record.name_ar}`,
        image: record.image_url,
        topic: 'new_fishing_spots'
      }
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
    image: config.image || defaults[table]
  };
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
        message: "🔍 نظام إشعارات الصيد الموحد",
        status: "active",
        firebase: firebaseApp ? "initialized" : "failed",
        supabase: "connected",
        topic: "new_fishing_spots",
        supported_tables: [
          'fishing_spots', 'fish_articles', 'bait_articles',
          'bait_categories', 'gear_articles', 'gear_categories',
          'custom_notifications'
        ],
        timestamp: new Date().toISOString()
      })
    };
  }

  if (event.httpMethod === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}');
      const { record, action = 'create', table } = body;

      console.log('📨 Received:', { table, action, record });

      if (!firebaseApp) throw new Error('Firebase not initialized');
      if (!record) throw new Error('Missing record data');
      if (!table) throw new Error('Missing table name');

      // 🔔 معالجة الإشعارات المخصصة بشكل منفصل
      if (table === 'custom_notifications' && action === 'create') {
        const response = await sendCustomNotification(record);
        
        // تحديث حالة الإشعار في قاعدة البيانات إذا كان له ID
        if (record.id) {
          try {
            await supabase
              .from('custom_notifications')
              .update({ 
                is_sent: true, 
                sent_at: new Date().toISOString() 
              })
              .eq('id', record.id);
            console.log('✅ Custom notification status updated in database');
          } catch (dbError) {
            console.warn('⚠️ Could not update notification status:', dbError.message);
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: '✅ Custom notification sent successfully',
            notification_id: response,
            type: 'custom',
            table: table,
            action: action,
            topic: 'new_fishing_spots',
            target_url: record.target_url,
            timestamp: new Date().toISOString()
          })
        };
      }

      // الإشعارات العادية
      const config = await buildNotification(table, action, record);

      const message = {
        topic: 'new_fishing_spots',
        notification: {
          title: config.title,
          body: config.body,
          image: config.image
        },
        data: {
          table: table,
          action: action,
          item_id: record.id?.toString() || '1',
          item_name: record.name || record.title_ar || record.name_ar || 'غير محدد',
          image_url: config.image,
          timestamp: new Date().toISOString(),
          notification_type: config.isCustom ? 'custom' : 'auto'
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'fishing_app_channel'
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
          fcm_options: { image: config.image }
        }
      };

      console.log(`📤 Sending ${action} notification for ${table} to topic: new_fishing_spots`);
      const response = await admin.messaging().send(message);
      console.log('✅ Notification sent:', response);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `✅ Notification sent for ${table}`,
          notification_id: response,
          table: table,
          action: action,
          topic: 'new_fishing_spots',
          timestamp: new Date().toISOString()
        })
      };

    } catch (error) {
      console.error('❌ Notification Error:', error);
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
    body: JSON.stringify({ error: 'Method not allowed' })
  };
};
