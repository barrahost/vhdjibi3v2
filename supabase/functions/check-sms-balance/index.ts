import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_API_URL = 'https://api.brevo.com/v3';
const CREDIT_TO_SMS_RATIO = 100 / 638; // 638 credits = 100 SMS

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY) {
      throw new Error('Configuration Brevo manquante');
    }

    const response = await fetch(`${BREVO_API_URL}/account`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.plan && Array.isArray(data.plan)) {
      const smsCredit = data.plan.find((item: any) => item.type === 'sms');
      if (smsCredit && typeof smsCredit.credits === 'number') {
        const credits = smsCredit.credits;
        const smsCount = Math.floor(credits * CREDIT_TO_SMS_RATIO);
        
        console.log('SMS balance retrieved:', { credits, smsCount });
        
        return new Response(
          JSON.stringify({
            credits,
            smsCount
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      }
    }
    
    throw new Error('Réponse du service SMS dans un format inattendu');
  } catch (error: any) {
    console.error('Error in check-sms-balance function:', error);
    
    return new Response(
      JSON.stringify({
        credits: null,
        smsCount: null,
        error: error.message || 'Erreur lors de la récupération du solde SMS'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
