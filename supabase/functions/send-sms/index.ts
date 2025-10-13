import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
const BREVO_SENDER = Deno.env.get('BREVO_SENDER');
const BREVO_API_URL = 'https://api.brevo.com/v3';
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000;
const MAX_BACKOFF = 30000;
const CREDIT_TO_SMS_RATIO = 100 / 638;
const MIN_CREDITS_THRESHOLD = 10;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  recipients: string | string[];
  message: string;
  soulName?: string;
  soulNickname?: string;
  scheduleTime?: string;
}

// Validate phone number and format to E.164
function validateAndFormatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length !== 10 && !/^225\d{10}$/.test(cleanPhone)) {
    throw new Error('Numéro de téléphone invalide. Il doit contenir 10 chiffres ou être précédé de l\'indicatif 225.');
  }
  
  return cleanPhone.startsWith('225') ? cleanPhone : `225${cleanPhone}`;
}

// Personalize message with soul name/nickname
function personalizeMessage(message: string, name: string, nickname?: string): string {
  let personalizedMessage = message;
  personalizedMessage = personalizedMessage.replace(/\[nom\]/g, name);
  personalizedMessage = personalizedMessage.replace(/\[surnom\]/g, nickname || name.split(' ')[0]);
  return personalizedMessage;
}

// Check if SMS credits are sufficient
async function checkSufficientCredits(): Promise<boolean> {
  try {
    const response = await fetch(`${BREVO_API_URL}/account`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY!,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Error checking credits:', await response.text());
      return true; // Assume sufficient to avoid blocking
    }

    const data = await response.json();
    if (data && data.plan && Array.isArray(data.plan)) {
      const smsCredit = data.plan.find((item: any) => item.type === 'sms');
      if (smsCredit && typeof smsCredit.credits === 'number') {
        return smsCredit.credits > MIN_CREDITS_THRESHOLD;
      }
    }
    
    return true; // Assume sufficient if we can't determine
  } catch (error) {
    console.error('Error checking SMS credits:', error);
    return true; // Assume sufficient to avoid blocking
  }
}

// Calculate exponential backoff time
function getBackoffTime(attempt: number): number {
  const backoff = Math.min(
    RETRY_DELAY * Math.pow(2, attempt - 1),
    MAX_BACKOFF
  );
  return backoff + Math.random() * 1000;
}

// Fetch with retry logic
async function fetchWithRetry(url: string, options: RequestInit, attempt = 1): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000 * Math.pow(1.5, attempt - 1));

    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('La requête a expiré');
    }

    const isNetworkError = 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('network timeout');

    if (isNetworkError && attempt < RETRY_ATTEMPTS) {
      const backoffTime = getBackoffTime(attempt);
      console.log(`Retrying request (${attempt}/${RETRY_ATTEMPTS}) after ${backoffTime}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      return fetchWithRetry(url, options, attempt + 1);
    }

    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!BREVO_API_KEY || !BREVO_SENDER) {
      throw new Error('Configuration Brevo manquante');
    }

    const { recipients, message, soulName, soulNickname, scheduleTime }: SendSMSRequest = await req.json();

    // Validate input
    if (!message || !message.trim()) {
      throw new Error('Le message ne peut pas être vide');
    }

    // Check credits before sending
    const hasSufficientCredits = await checkSufficientCredits();
    if (!hasSufficientCredits) {
      throw new Error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
    }

    // Format phone numbers
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    const formattedPhones = recipientList.map(phone => validateAndFormatPhone(phone));

    // Personalize message if soul info provided
    const personalizedMessage = soulName 
      ? personalizeMessage(message, soulName, soulNickname) 
      : message;

    // Validate message length
    if (personalizedMessage.length > 160) {
      throw new Error('Le message ne doit pas dépasser 160 caractères');
    }

    // Send SMS via Brevo API
    const response = await fetchWithRetry(
      `${BREVO_API_URL}/transactionalSMS/sms`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: BREVO_SENDER,
          recipient: formattedPhones.join(','),
          content: personalizedMessage,
          ...(scheduleTime && { scheduleAt: new Date(scheduleTime).toISOString() })
        })
      }
    );

    const result = await response.json();

    console.log('SMS sent successfully:', {
      recipients: formattedPhones,
      messageLength: personalizedMessage.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error('Error in send-sms function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erreur lors de l\'envoi du SMS'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
