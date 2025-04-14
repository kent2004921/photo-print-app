const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Server configuration error',
      details: 'Missing SUPABASE_URL or SUPABASE_KEY in environment variables',
    }),
  };
}

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  try {
    // 检查HTTP方法
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Method not allowed', details: 'Only POST requests are allowed' }),
      };
    }

    // 检查请求体
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bad request', details: 'No file data provided in the request' }),
      };
    }

    // 解析请求体（假设前端发送的是JSON格式，包含base64编码的文件）
    let file, filename;
    try {
      const body = JSON.parse(event.body);
      file = body.file; // base64编码的图片数据
      filename = body.filename;
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request body', details: parseError.message }),
      };
    }

    // 验证文件和文件名
    if (!file || !filename) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing data', details: 'File or filename is missing' }),
      };
    }

    // 上传文件到print-photos存储桶
    const { data, error } = await supabase.storage
      .from('print-photos')
      .upload(filename, Buffer.from(file, 'base64'), {
        contentType: 'image/png',
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to upload file to Supabase', details: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'File uploaded successfully', data }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request', details: error.message }),
    };
  }
};
