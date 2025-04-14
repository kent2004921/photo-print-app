const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 初始化Supabase客户端
let supabase;
try {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
  }
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error.message);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Server configuration error', details: error.message }),
  };
}

exports.handler = async (event) => {
  try {
    // 检查请求体是否存在
    if (!event.body) {
      throw new Error('No file data provided in the request');
    }

    // 解析请求体（假设前端发送的是JSON格式）
    const { file, filename } = JSON.parse(event.body);

    if (!file || !filename) {
      throw new Error('Missing file or filename in request body');
    }

    // 上传文件到print-photos存储桶
    const { data, error } = await supabase.storage
      .from('print-photos')
      .upload(filename, Buffer.from(file, 'base64'), {
        contentType: 'image/png', // 根据实际文件类型调整
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
