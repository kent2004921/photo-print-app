exports.handler = async (event) => {
  try {
    // 模拟打印机状态检测
    // 实际需替换为真实 API 调用，例如 Epson ePOS SDK
    const isConnected = true; // 模拟打印机连接状态
    if (isConnected) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          connected: true,
          brand: "Epson",
          model: "L3250"
        })
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          connected: false
        })
      };
    }
  } catch (error) {
    console.error('Check printer status error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to check printer status' })
    };
  }
};
