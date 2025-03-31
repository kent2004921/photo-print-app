const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

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

  console.log('Received event:', event);

  if (!event.body) {
    console.error('Request body is empty');
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
    console.log('Parsed request body:', requestBody);
  } catch (error) {
    console.error('Failed to parse request body:', error);
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

  const { username, dataUrl } = requestBody;

  console.log('Extracted values:', { username, dataUrl: dataUrl ? 'Data URL present' : 'Data URL missing' });

  if (!username || !dataUrl) {
    console.error('Missing username or dataUrl:', { username, dataUrl });
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: false, message: '缺少用户名或照片数据' })
    };
  }

  try {
    // 查询C顾客信息（确保大小写匹配）
    const { data: user, error: fetchError } = await supabase
      .from('franchisees')
      .select('remaining_uses, printer_id')
      .eq('username', username)
      .single();

    console.log('Supabase query result:', { user, fetchError });

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
        body: JSON.stringify({ success: false, message: '加盟商不存在' })
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

    if (!user.printer_id) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ success: false, message: '用户未绑定打印机' })
      };
    }

    // 模拟发送照片到打印机（实际需替换为真实的打印机API）
    const printerResponse = await fetch('https://printer-api.example.com/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerId: user.printer_id,
        image: dataUrl
      })
    });

    if (!printerResponse.ok) {
      throw new Error('打印机API调用失败');
    }

    // 扣减打印次数
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
