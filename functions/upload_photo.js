const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://nqapfcosintqipzttflo.supabase.co',
    process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8'
  );

  try {
    const body = JSON.parse(event.body);
    const { userId, photoData } = body;

    if (!userId || !photoData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing userId or photoData' })
      };
    }

    // 将 Base64 数据转换为 Buffer
    const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 上传到 Supabase Storage
    const { data, error } = await supabase.storage
      .from('print-photos')
      .upload(`user_${userId}_photo.jpg`, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      console.error('Upload to Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Failed to upload photo to storage' })
      };
    }

    // 获取公开 URL
    const { publicUrl } = supabase.storage
      .from('print-photos')
      .getPublicUrl(`user_${userId}_photo.jpg`).data;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, photoUrl: publicUrl })
    };
  } catch (error) {
    console.error('Upload photo error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};