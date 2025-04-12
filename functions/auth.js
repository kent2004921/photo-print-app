const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // 初始化 Supabase 客户端
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://nqapfcosintqipzttflo.supabase.co',
    process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8'
  );

  // 解析请求体
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.error('Invalid request body:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Invalid request body' })
    };
  }

  const { action, name, email, phone, password, id } = body;

  // 调试日志
  console.log('Request body:', body);

  // 验证必要字段
  if (!action) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Missing required field: action' })
    };
  }

  try {
    if (action === 'register') {
      if (!name || !email || !phone || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Missing required fields: name, email, phone, password' })
        };
      }

      const { data, error } = await supabase
        .from('franchisees')
        .insert([{ name, email, phone, password, status: 'pending', print_quota: 100 }]);

      if (error) {
        console.error('Register error:', error);
        if (error.code === '23505') {
          return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: 'Email already taken' })
          };
        }
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
      if (!email || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Missing required fields: email, password' })
        };
      }

      const { data, error } = await supabase
        .from('franchisees')
        .select('id, status')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) {
        console.error('Login error:', error);
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

    if (action === 'get_user') {
      if (!email || !id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: 'Missing required fields: email, id' })
        };
      }

      const { data, error } = await supabase
        .from('franchisees')
        .select('id, name, print_quota')
        .eq('email', email)
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Get user error:', error);
        return {
          statusCode: 404,
          body: JSON.stringify({ success: false, message: `User not found: ${error ? error.message : 'No data'}` })
        };
      }

      console.log('User found:', data);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, user: data })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: 'Invalid action' })
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: `Server error: ${error.message}` })
    };
  }
};
