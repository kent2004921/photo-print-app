const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqapfcosintqipzttflo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const { franchiseeId, photo } = JSON.parse(event.body || '{}');

  try {
    const { data: franchisee, error: fetchError } = await supabase
      .from('franchisees')
      .select('*')
      .eq('username', franchiseeId)
      .single();

    if (fetchError || !franchisee) {
      return {
        statusCode: 404,
        body: JSON.stringify({ success: false, message: '加盟商不存在' })
      };
    }

    if (franchisee.remaining_uses <= 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: '使用次数不足' })
      };
    }

    console.log('模拟打印照片:', photo.substring(0, 50));

    const updatedPhotos = [...(franchisee.photos || []), { url: photo, timestamp: Date.now() }];

    const { error: updateError } = await supabase
      .from('franchisees')
      .update({
        remaining_uses: franchisee.remaining_uses - 1,
        photos: [] // 打印后自动删除
      })
      .eq('username', franchiseeId);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: '服务器错误' })
    };
  }
};