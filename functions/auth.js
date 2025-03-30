const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nqapfcosintqipzttflo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xYXBmY29zaW50cWlwenR0ZmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMzMjIyMzgsImV4cCI6MjA1ODg5ODIzOH0.EekW0qIKeikF6jEAMXDa_RsKWHeMLsj8LKQBqoPLov8';
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
  const { username, password, printerId } = JSON.parse(event.body || '{}');
  const path = event.path;

  try {
    if (path.includes('/register')) {
      const { data: existingUser } = await supabase
        .from('franchisees')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: '用户名已存在' })
        };
      }

      const { error } = await supabase
        .from('franchisees')
        .insert({
          username,
          password,
          remaining_uses: 0,
          approved: false,
          printer_id: null,
          photos: []
        });

      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else if (path.includes('/bind-printer')) {
      const { error } = await supabase
        .from('franchisees')
        .update({ printer_id: printerId })
        .eq('username', username);

      if (error) throw error;
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else {
      const { data: user, error } = await supabase
        .from('franchisees')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ success: false, message: '用户名或密码错误' })
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          approved: user.approved,
          remainingUses: user.remaining_uses,
          printerId: user.printer_id,
          photos: user.photos || []
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: '服务器错误' })
    };
  }
};