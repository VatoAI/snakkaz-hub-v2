
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
    // Create a Supabase client with error handling
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required Supabase environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Record the cleanup start time
    const startTime = Date.now();
    console.log("Starting cleanup process at:", new Date(startTime).toISOString());

    // Delete old signaling records (older than 5 minutes)
    const { error: signalingError, count: signalingCount } = await supabase
      .from("signaling")
      .delete({ count: "exact" })
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (signalingError) {
      console.error("Error cleaning up signaling records:", signalingError);
    } else {
      console.log(`Successfully deleted ${signalingCount || 0} signaling records`);
    }

    // Delete stale presence records (older than 5 minutes)
    const { error: presenceError, count: presenceCount } = await supabase
      .from("user_presence")
      .delete({ count: "exact" })
      .lt("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (presenceError) {
      console.error("Error cleaning up presence records:", presenceError);
    } else {
      console.log(`Successfully deleted ${presenceCount || 0} presence records`);
    }

    // Calculate the total execution time
    const executionTime = Date.now() - startTime;
    console.log(`Cleanup process completed in ${executionTime}ms`);

    // Add record to health table for monitoring
    const { error: healthError } = await supabase
      .from("health")
      .upsert({
        id: "38d75fee-16f2-4b42-a084-93567e21e3a7",
        status: `cleanup_completed_successfully_${new Date().toISOString()}`,
        last_checked: new Date().toISOString()
      });

    if (healthError) {
      console.error("Error updating health record:", healthError);
    }

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
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
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
