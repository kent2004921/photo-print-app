const { createClient } = require('@supabase/supabase-js');

// 日志函数，便于调试
const log = (message, data) => {
  console.log(JSON.stringify({ message, data }));
};

// 从环境变量读取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseKey) {
  log('Missing environment variables', { supabaseUrl, supabaseKey });
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Server configuration error',
      details: 'Missing SUPABASE_URL or SUPABASE_KEY in environment variables',
    }),
  };
}

// 初始化Supabase客户端
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  log('Supabase client initialized', { supabaseUrl });
} catch (error) {
  log('Failed to initialize Supabase client', { error: error.message });
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Failed to initialize Supabase client',
      details: error.message,
    }),
  };
}

exports.handler = async (event) => {
  try {
    log('Function invoked', { event });

    // 检查HTTP方法
    if (event.httpMethod !== 'POST') {
      log('Invalid HTTP method', { method: event.httpMethod });
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: 'Method not allowed',
          details: 'Only POST requests are allowed',
        }),
      };
    }

    // 检查请求体
    if (!event.body) {
      log('No request body', {});
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad request',
          details: 'No file data provided in the request',
        }),
      };
    }

    // 解析请求体
    let file, filename;
    try {
      const body = JSON.parse(event.body);
      file = body.file;
      filename = body.filename;
      log('Request body parsed', { filename });
    } catch (parseError) {
      log('Failed to parse request body', { error: parseError.message });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid request body',
          details: parseError.message,
        }),
      };
    }

    // 验证文件和文件名
    if (!file || !filename) {
      log('Missing file or filename', { file: !!file, filename: !!filename });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing data',
          details: 'File or filename is missing',
        }),
      };
    }

    // 上传文件到print-photos存储桶
    log('Uploading file to Supabase', { filename });
    const { data, error } = await supabase.storage
      .from('print-photos')
      .upload(filename, Buffer.from(file, 'base64'), {
        contentType: 'image/png',
      });

    if (error) {
      log('Supabase upload error', { error: error.message });
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to upload file to Supabase',
          details: error.message,
        }),
      };
    }

    log('File uploaded successfully', { data });
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'File uploaded successfully',
        data,
      }),
    };
  } catch (error) {
    log('Function error', { error: error.message, stack: error.stack });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process request',
        details: error.message,
      }),
    };
  }
};
