
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// This edge function will clean up stale entries in the signaling table
Deno.serve(async (req) => {
  try {
    // Create a Supabase client with the service role key for admin access
    const supabaseClient = createClient(
      // Supabase API URL
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase service role key - required for admin operations
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Delete signaling entries older than 5 minutes
    const { data, error } = await supabaseClient
      .from('signaling')
      .delete()
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .select('count')
    
    if (error) throw error
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stale signaling entries cleaned up',
        deletedCount: data?.length || 0
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400
      },
    )
  }
})
