
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Delete old signaling records (older than 5 minutes)
    const { error: signalingError, count: signalingCount } = await supabase
      .from("signaling")
      .delete({ count: "exact" })
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Delete stale presence records (older than 5 minutes)
    const { error: presenceError, count: presenceCount } = await supabase
      .from("user_presence")
      .delete({ count: "exact" })
      .lt("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Return the results
    return new Response(
      JSON.stringify({
        signaling: {
          deletedCount: signalingCount || 0,
          error: signalingError ? signalingError.message : null,
        },
        presence: {
          deletedCount: presenceCount || 0,
          error: presenceError ? presenceError.message : null,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error cleaning up database:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
