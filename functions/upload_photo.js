const { createClient } = require('@supabase/supabase-js');

const log = (message, data) => {
  console.log(JSON.stringify({ message, data }));
};

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('Missing environment variables', { supabaseUrl, supabaseKey });
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Server configuration error',
      details: 'Missing SUPABASE_URL or SUPABASE_KEY',
    }),
  };
}

const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event) => {
  try {
    log('Function invoked', { event });

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

    if (!event.body) {
      log('No request body', {});
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad request',
          details: 'No file data provided',
        }),
      };
    }

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

    // 获取文件的公共URL
    const { data: urlData } = supabase.storage
      .from('print-photos')
      .getPublicUrl(filename);

    log('File uploaded successfully', { data, url: urlData.publicUrl });
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        photoUrl: urlData.publicUrl,
        message: 'File uploaded successfully',
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
