const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
  const { action, username, password, printerId } = JSON.parse(event.body || '{}');

  try {
    if (action === 'signup') {
      const { data: existingUser, error: checkError } = await supabase
        .from('franchisees')
        .select('username')
        .eq('username', username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116表示未找到记录
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: '检查用户名时出错' })
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

      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else if (action === 'bind-printer') {
      const { error } = await supabase
        .from('franchisees')
        .update({ printer_id: printerId })
        .eq('username', username);

      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
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
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: '服务器错误' })
    };
  }
};
