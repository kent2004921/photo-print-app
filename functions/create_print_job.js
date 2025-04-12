const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://nqapfcosintqipzttflo.supabase.co',
    process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8'
  );

  try {
    const body = JSON.parse(event.body);
    const { userId, photoUrl, type, mask, status } = body;

    if (!userId || !photoUrl || !type || !mask || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Missing required fields' })
      };
    }

    const { data, error } = await supabase
      .from('print_jobs')
      .insert([
        {
          user_id: userId,
          photo_url: photoUrl,
          type: type,
          mask: mask,
          status: status,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Create print job error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Failed to create print job' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    console.error('Create print job error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: 'Server error' })
    };
  }
};