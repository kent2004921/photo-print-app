const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
  console.log('Received print event:', {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body ? 'Body present' : 'Body missing'
  });

  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
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
    console.log('Parsed print request body:', requestBody);
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

  console.log('Extracted print values:', {
    username: username || 'undefined',
    dataUrl: dataUrl ? 'Data URL present' : 'Data URL missing'
  });

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

    // 暂时注释掉printer_id检查，模拟打印成功
    /*
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
    */

    // 模拟打印机API调用（假设成功）
    console.log('Simulating printer API call...');
    // const printerResponse = await fetch('https://printer-api.example.com/print', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     printerId: user.printer_id,
    //     image: dataUrl
    //   })
    // });

    // if (!printerResponse.ok) {
    //   throw new Error('打印机API调用失败');
    // }

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

    console.log(`Print successful for user ${username}, remaining_uses updated to ${user.remaining_uses - 1}`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ success: true, message: '打印成功（模拟）' })
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