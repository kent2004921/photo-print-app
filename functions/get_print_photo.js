const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqapfcosintqipzttflo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  try {
    // 解析请求体中的 userId
    const { userId } = JSON.parse(event.body);
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing userId' })
      };
    }

    // 查询 Supabase 数据库中的打印任务（假设有一个 print_jobs 表）
    const { data: tasks, error } = await supabase
      .from('print_jobs')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching print job:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Failed to fetch print job' })
      };
    }

    if (tasks && tasks.length > 0) {
      const task = tasks[0];
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
      body: JSON.stringify({ success: false, message: 'Failed to get print job' })
    };
  }
};
