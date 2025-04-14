exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: 'Method not allowed',
          details: 'Only POST requests are allowed',
        }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Bad request',
          details: 'No data provided',
        }),
      };
    }

    const { userId, photoUrl, type, mask, status } = JSON.parse(event.body);

    if (!userId || !photoUrl || !type || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing data',
          details: 'userId, photoUrl, type, and status are required',
        }),
      };
    }

    // 这里可以添加逻辑将打印任务保存到数据库（比如Supabase的数据库）
    // 为了示例，我们直接返回成功
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Print job created successfully',
        data: { userId, photoUrl, type, mask, status },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create print job',
        details: error.message,
      }),
    };
  }
};
