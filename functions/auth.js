const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // 初始化 Supabase 客户端
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://nqapfcosintqipzttflo.supabase.co',
    process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8'
  );

  // 解析请求体
  const { action, name, email, phone, password } = JSON.parse(event.body);

  try {
    if (action === 'register') {
      // 插入新用户，设置默认 status 为 'pending'
      const { data, error } = await supabase
        .from('franchisees')
        .insert([{ name, email, phone, password, status: 'pending' }]);

      if (error) {
        if (error.code === '23505') {
          return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Email already taken' })
          };
        }
        // 提供更详细的错误信息
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: `Supabase error: ${error.message}` })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    if (action === 'login') {
      const { data, error } = await supabase
        .from('franchisees')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        return {
          statusCode: 401,
          body: JSON.stringify({ success: false, message: 'Invalid email or password' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, status: data.status, id: data.id })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Invalid action' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: `Server error: ${error.message}` })
    };
  }
};
