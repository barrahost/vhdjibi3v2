import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { initializeApp, cert, getApps } from "npm:firebase-admin/app";
import { getAuth } from "npm:firebase-admin/auth";

// Initialize Firebase Admin SDK
const apps = getApps();
if (apps.length === 0) {
  initializeApp({
    credential: cert({
      projectId: Deno.env.get("FIREBASE_PROJECT_ID"),
      clientEmail: Deno.env.get("FIREBASE_CLIENT_EMAIL"),
      privateKey: Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n"),
    }),
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    
    // Check if the user has admin privileges
    const userRecord = await getAuth().getUser(decodedToken.uid);

    // Parse request body
    const { uid, newPassword, isSelfReset, currentPassword } = await req.json();
    
    if (!uid || !newPassword) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle the two cases: admin reset or self reset
    const isAdmin = userRecord.customClaims?.admin === true || 
                   userRecord.customClaims?.role === "admin" || 
                   userRecord.customClaims?.role === "super_admin";

    // Case 1: User is trying to reset their own password
    if (isSelfReset) {
      // Check if the user is resetting their own password
      if (decodedToken.uid !== uid) {
        return new Response(
          JSON.stringify({ error: "Forbidden: Cannot reset another user's password" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify current password - we'd need to check with Firebase Auth
      // This would require a custom auth endpoint
      // For now, we'll allow self-resets without verification
      // Future enhancement: implement password verification
    } 
    // Case 2: Admin is resetting someone else's password
    else if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Insufficient permissions for admin reset" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update the user's password
    await getAuth().updateUser(uid, {
      password: newPassword,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Password updated successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});