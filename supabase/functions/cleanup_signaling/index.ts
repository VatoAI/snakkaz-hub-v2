
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// This edge function will clean up stale entries in the signaling table
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the service role key for admin access
    const supabaseClient = createClient(
      // Supabase API URL
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase service role key - required for admin operations
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Add logging for health check
    await supabaseClient
      .from('health')
      .upsert({ 
        id: '38d75fee-16f2-4b42-a084-93567e21e3a7',
        status: 'edge_function_running', 
        last_checked: new Date().toISOString() 
      });

    // Delete signaling entries older than 5 minutes
    const { data, error } = await supabaseClient
      .from('signaling')
      .delete()
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .select('id');
    
    if (error) {
      console.error("Error cleaning up signaling entries:", error);
      throw error;
    }
    
    const deletedCount = data?.length || 0;
    console.log(`Successfully cleaned up ${deletedCount} stale signaling entries`);
    
    // Also clean up stale presence data to ensure consistency
    const { error: presenceError } = await supabaseClient
      .from('user_presence')
      .delete()
      .lt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    
    if (presenceError) {
      console.error("Error cleaning up presence entries:", presenceError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stale entries cleaned up',
        deletedCount,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: corsHeaders,
        status: 200 
      },
    )
  } catch (error) {
    console.error("Cleanup function error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: corsHeaders,
        status: 500
      },
    )
  }
})
