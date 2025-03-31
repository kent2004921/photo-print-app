const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: false, message: '请求体为空' })
    };
  }

  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: false, message: '请求体解析失败', error: error.message })
    };
  }

  const { action, username, password, printerId } = requestBody;

  console.log('Received request:', { action, username, password, printerId });

  try {
    if (action === 'signup') {
      const { data: existingUser, error: checkError } = await supabase
        .from('franchisees')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      console.log('Check existing user:', { existingUser, checkError });

      if (checkError) {
        console.error('Check error details:', checkError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({ success: false, message: '检查用户名时出错', error: checkError.message })
        };
      }

      if (existingUser) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
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
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ success: true, message: '绑定打印机成功' })
      };
    } else if (action === 'login') {
      const { data: user, error } = await supabase
        .from('franchisees')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

      console.log('Login query result:', { user, error });

      if (error) {
        console.error('Login error:', error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({ success: false, message: '登录查询出错', error: error.message })
        };
      }

      if (!user) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({ success: false, message: '用户名或密码错误' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: true,
          approved: user.approved,
          remainingUses: user.remaining_uses,
          printerId: user.printer_id,
          photos: user.photos || []
        })
      };
    } else if (action === 'print') {
      const { data: user, error: fetchError } = await supabase
        .from('franchisees')
        .select('remaining_uses')
        .eq('username', username)
        .single();

      if (fetchError) {
        console.error('Fetch user error:', fetchError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({ success: false, message: '查询用户失败', error: fetchError.message })
        };
      }

      if (!user) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({ success: false, message: '用户不存在' })
        };
      }

      if (user.remaining_uses <= 0) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({ success: false, message: '剩余打印次数不足' })
        };
      }

      const { error: updateError } = await supabase
        .from('franchisees')
        .update({ remaining_uses: user.remaining_uses - 1 })
        .eq('username', username);

      if (updateError) {
        console.error('Update remaining uses error:', updateError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
          },
          body: JSON.stringify({ success: false, message: '更新打印次数失败', error: updateError.message })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ success: true, message: '打印成功' })
      };
    }

    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: false, message: '无效请求' })
    };
  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: false, message: '服务器错误', error: error.message })
    };
  }
};
