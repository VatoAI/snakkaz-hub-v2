
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
      })
      .match({ id: '38d75fee-16f2-4b42-a084-93567e21e3a7' });

    // Delete signaling entries older than 5 minutes
    const { data: signalingData, error: signalingError } = await supabaseClient
      .from('signaling')
      .delete()
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .select('id');
    
    if (signalingError) {
      console.error("Error cleaning up signaling entries:", signalingError);
      throw signalingError;
    }
    
    const deletedSignalingCount = signalingData?.length || 0;
    console.log(`Successfully cleaned up ${deletedSignalingCount} stale signaling entries`);
    
    // Clean up stale presence data to ensure consistency
    const { data: presenceData, error: presenceError } = await supabaseClient
      .from('user_presence')
      .delete()
      .lt('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .select('id');
    
    if (presenceError) {
      console.error("Error cleaning up presence entries:", presenceError);
    }
    
    const deletedPresenceCount = presenceData?.length || 0;
    console.log(`Successfully cleaned up ${deletedPresenceCount} stale presence entries`);
    
    // Update health table with success information
    await supabaseClient
      .from('health')
      .upsert({ 
        id: '38d75fee-16f2-4b42-a084-93567e21e3a7',
        status: 'cleanup_success', 
        last_checked: new Date().toISOString() 
      })
      .match({ id: '38d75fee-16f2-4b42-a084-93567e21e3a7' });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stale entries cleaned up',
        signaling: {
          deletedCount: deletedSignalingCount,
        },
        presence: {
          deletedCount: deletedPresenceCount,
        },
        timestamp: new Date().toISOString()
      }),
      { 
        headers: corsHeaders,
        status: 200 
      },
    )
  } catch (error) {
    console.error("Cleanup function error:", error);
    
    // Update health table with error information
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    
    try {
      await supabaseClient
        .from('health')
        .upsert({ 
          id: '38d75fee-16f2-4b42-a084-93567e21e3a7',
          status: 'cleanup_error', 
          last_checked: new Date().toISOString() 
        })
        .match({ id: '38d75fee-16f2-4b42-a084-93567e21e3a7' });
    } catch (healthError) {
      console.error("Failed to update health record:", healthError);
    }
    
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
