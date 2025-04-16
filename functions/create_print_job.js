const { createClient } = require('@supabase/supabase-js');

// 初始化 Supabase 客户端
const supabaseUrl = 'https://nqapfcosintqipzttflo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: 'Method not allowed',
          details: 'Only POST requests are allowed',
        }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad request',
          details: 'No data provided',
        }),
      };
    }

    const { userId, photoUrl, type, mask, status } = JSON.parse(event.body);

    if (!userId || !photoUrl || !type || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing data',
          details: 'userId, photoUrl, type, and status are required',
        }),
      };
    }

    // 将打印任务保存到 Supabase 的 print_jobs 表
    const { data, error } = await supabase
      .from('print_jobs')
      .insert([
        {
          user_id: userId,
          photo_url: photoUrl,
          type: type,
          mask: mask,
          status: status,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to create print job',
          details: error.message,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Print job created successfully',
        data: data[0],
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create print job',
        details: error.message,
      }),
    };
  }
};
