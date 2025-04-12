exports.handler = async (event) => {
    try {
      // 模拟照片 URL 获取
      // 实际需替换为真实 API 调用，例如从 Supabase Storage 获取
      const hasPhoto = false; // 模拟当前没有照片
      if (hasPhoto) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            photoUrl: "https://example.com/sample-photo.jpg" // 替换为真实照片 URL
          })
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: false,
            message: "No photo available"
          })
        };
      }
    } catch (error) {
      console.error('Get print photo error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Failed to get print photo' })
      };
    }
  };