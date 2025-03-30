const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: '无效的请求体' })
    };
  }

  const { action, username, password, printerId } = body;

  // 调试日志：确认action值
  console.log('Received action:', action);

  try {
    if (action === 'signup') {
      const { data: existingUser, error: checkError } = await supabase
        .from('franchisees')
        .select('username')
        .eq('username', username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking username:', checkError);
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: '检查用户名时出错', error: checkError.message })
        };
      }

      if (existingUser) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: '用户名已存在' })
        };
      }

      const { error } = await supabase
        .from('franchisees')
        .insert({
          username,
          password,
          remaining_uses: 0,
          approved: false,
          printer_id: null,
          photos: []
        });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: '注册成功' })
      };
    } else if (action === 'bind-printer') {
      const { error } = await supabase
        .from('franchisees')
        .update({ printer_id: printerId })
        .eq('username', username);

      if (error) {
        console.error('Update error:', error);
        throw error;
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: '打印机绑定成功' })
      };
    } else if (action === 'login') {
      const { data: user, error } = await supabase
        .from('franchisees')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ success: false, message: '用户名或密码错误' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          approved: user.approved,
          remainingUses: user.remaining_uses,
          printerId: user.printer_id,
          photos: user.photos || []
        })
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, message: '无效请求' })
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: '服务器错误', error: error.message })
    };
  }
};
