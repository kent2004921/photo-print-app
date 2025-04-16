const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqapfcosintqipzttflo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  try {
    // 安全解析 event.body
    let userId;
    try {
      const body = event.body ? JSON.parse(event.body) : {};
      userId = body.userId;
    } catch (parseError) {
      console.error('Error parsing event body:', parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Invalid request body' })
      };
    }

    if (!userId) {
      console.error('Missing userId in request body');
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing userId' })
      };
    }

    console.log('Fetching print job for userId:', userId);

    // 尝试查询 Supabase 数据库中的打印任务
    let task = null;
    try {
      const { data: tasks, error } = await supabase
        .from('print_jobs')
        .select('*')
        .eq('userId', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error(`Failed to fetch print job from database: ${error.message}`);
      }

      if (tasks && tasks.length > 0) {
        task = tasks[0];
        console.log('Found print job in database:', task);
      } else {
        console.log('No pending print job found in database for userId:', userId);
      }
    } catch (dbError) {
      console.warn('Database query failed, falling back to storage bucket:', dbError.message);
      // 如果数据库查询失败，尝试直接从存储桶获取最新照片
      const { data: files, error: storageError } = await supabase.storage
        .from('print-photos')
        .list('', { limit: 1, sortBy: { column: 'created_at', order: 'desc' } });

      if (storageError) {
        console.error('Supabase storage error:', storageError);
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: `Failed to fetch from storage: ${storageError.message}` })
        };
      }

      if (files && files.length > 0) {
        const latestFile = files.find(file => file.name.startsWith(`user_${userId}_`));
        if (latestFile) {
          const { data: urlData } = supabase.storage
            .from('print-photos')
            .getPublicUrl(latestFile.name);
          task = {
            photoUrl: urlData.publicUrl,
            type: 'Unknown',
            mask: 'Unknown',
            status: 'pending'
          };
          console.log('Found photo in storage:', task);
        } else {
          console.log('No matching photo found in storage for userId:', userId);
        }
      }
    }

    if (task) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          task: {
            photoUrl: task.photoUrl,
            type: task.type,
            mask: task.mask,
            status: task.status
          }
        })
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: 'No pending print job available'
        })
      };
    }
  } catch (error) {
    console.error('Get print job error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: `Failed to get print job: ${error.message}` })
    };
  }
};
