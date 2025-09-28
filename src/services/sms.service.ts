import { SMSMessage } from '../types/sms.types';
import { collection, query, where, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

import { Timestamp } from 'firebase/firestore';

export class SMSService {
  private static readonly API_KEY = import.meta.env.VITE_BREVO_API_KEY;
  private static readonly SENDER = import.meta.env.VITE_BREVO_SENDER || 'VHDJIBI3';
  private static readonly API_URL = 'https://api.brevo.com/v3';
  private static readonly RETRY_ATTEMPTS = 3; // Increased from 2 to 3
  private static readonly RETRY_DELAY = 2000;
  private static readonly BASE_TIMEOUT = 15000;
  private static readonly MAX_BACKOFF = 30000; // Maximum backoff time in milliseconds
  private static readonly CREDIT_TO_SMS_RATIO = 100 / 638; // 638 credits = 100 SMS
  private static readonly MIN_CREDITS_THRESHOLD = 10; // Minimum credits threshold for warning

  // Validate configuration
  private static validateConfiguration() {
    if (!this.API_KEY) {
      throw new Error('La clé API n\'est pas configurée. Veuillez vérifier vos variables d\'environnement.');
    }
    if (!this.SENDER) {
      throw new Error('L\'identifiant d\'expéditeur n\'est pas configuré.');
    }
  }

  // Check if error is a network error
  private static isNetworkError(error: any): boolean {
    return (
      error.message.includes('Failed to fetch') ||
      error.message.includes('Network request failed') ||
      error.message.includes('network timeout') ||
      error.message.includes('Network Error') ||
      error.message.toLowerCase().includes('offline')
    );
  }

  // Calculate exponential backoff time
  private static getBackoffTime(attempt: number): number {
    const backoff = Math.min(
      this.RETRY_DELAY * Math.pow(2, attempt - 1),
      this.MAX_BACKOFF
    );
    // Add some randomness to prevent multiple retries happening at exactly the same time
    return backoff + Math.random() * 1000;
  }

  // Check if SMS credits are sufficient
  static async checkSufficientCredits(): Promise<{
    sufficient: boolean;
    credits: number | null;
    smsCount: number | null;
  }> {
    try {
      const balance = await this.getSMSBalance();
      
      // If we couldn't get the balance, assume it's sufficient to avoid blocking functionality
      if (balance.credits === null) {
        return { sufficient: true, credits: null, smsCount: null };
      }
      
      return {
        sufficient: balance.credits > this.MIN_CREDITS_THRESHOLD,
        credits: balance.credits,
        smsCount: balance.smsCount
      };
    } catch (error) {
      console.error('Error checking SMS credits:', error);
      // In case of error, assume it's sufficient to avoid blocking functionality
      return { sufficient: true, credits: null, smsCount: null };
    }
  }

  // Get SMS credits balance
  static async getSMSBalance(): Promise<{ credits: number | null; smsCount: number | null }> {
    try {
      this.validateConfiguration();

      const response = await this.fetchWithRetry(`${this.API_URL}/account`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api-key': this.API_KEY,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data && data.plan && Array.isArray(data.plan)) {
        const smsCredit = data.plan.find((item: any) => item.type === 'sms');
        if (smsCredit && typeof smsCredit.credits === 'number') {
          // Return both the raw credit amount and the converted SMS count
          return {
            credits: smsCredit.credits,
            smsCount: Math.floor(smsCredit.credits * this.CREDIT_TO_SMS_RATIO)
          };
        }
      }
      
      throw new Error('Réponse du service SMS dans un format inattendu');
    } catch (error) {
      console.error('Error getting SMS balance:', error);
      return { credits: null, smsCount: null };
    }
  }

  // Fetch with retry logic
  private static async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<Response> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.BASE_TIMEOUT * Math.pow(1.5, attempt - 1)
      );

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

      if (this.isNetworkError(error) && attempt < this.RETRY_ATTEMPTS) {
        const backoffTime = this.getBackoffTime(attempt);
        console.log(`Retrying request (${attempt}/${this.RETRY_ATTEMPTS}) after ${backoffTime}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw error;
    }
  }

  // Create an interaction record for SMS
  static async createSMSInteraction(
    shepherdId: string,
    soulId: string,
    message: string,
    date: Date
  ) {
    try {
      await addDoc(collection(db, 'interactions'), {
        type: 'message',
        soulId,
        shepherdId,
        date,
        notes: `Envoi du message suivant : ${message}`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error creating SMS interaction:', error);
      throw new Error('Erreur lors de la création de l\'interaction');
    }
  }

  static async getTemplates(): Promise<any[]> {
    try {
      const templatesQuery = query(
        collection(db, 'smsTemplates'),
        where('status', '==', 'active'),
        where('category', '==', 'Suivi'),
        orderBy('title', 'asc')
      );
      
      const snapshot = await getDocs(templatesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        content: doc.data().content,
        status: doc.data().status as 'active' | 'inactive',
        category: doc.data().category,
        createdAt: doc.data().createdAt instanceof Timestamp ? doc.data().createdAt.toDate() : new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt instanceof Timestamp ? doc.data().updatedAt.toDate() : new Date(doc.data().updatedAt)
      }));
    } catch (error) {
      console.error('Error loading SMS templates:', error);
      throw new Error('Erreur lors du chargement des modèles SMS');
    }
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (this.isNetworkError(error)) {
        return 'Impossible de se connecter au service SMS. Veuillez vérifier votre connexion internet et réessayer.';
      }
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, any>;
      return errorObj.message || errorObj.error || 'Erreur inconnue';
    }
    return 'Une erreur inconnue est survenue';
  }

  private static validateAndFormatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10 && !/^225\d{10}$/.test(cleanPhone)) {
      throw new Error('Numéro de téléphone invalide. Il doit contenir 10 chiffres ou être précédé de l\'indicatif 225.');
    }
    
    return cleanPhone.startsWith('225') ? cleanPhone : `225${cleanPhone}`;
  }

  private static personalizeMessage(message: string, name: string, nickname?: string): string {
    let personalizedMessage = message;
    personalizedMessage = personalizedMessage.replace(/\[nom\]/g, name);
    personalizedMessage = personalizedMessage.replace(/\[surnom\]/g, nickname || name.split(' ')[0]);
    return personalizedMessage;
  }

  static async sendSMS(
    recipients: string | string[],
    message: string,
    soulName?: string,
    soulNickname?: string,
    scheduleTime?: string,
    attempt = 1
  ): Promise<any> {
    try {
      // Check if we have sufficient credits
      const creditCheck = await this.checkSufficientCredits();
      if (!creditCheck.sufficient) {
        throw new Error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
      }

      this.validateConfiguration();

      if (!message.trim()) {
        throw new Error('Le message ne peut pas être vide');
      }

      const recipientList = Array.isArray(recipients) ? recipients : [recipients];
      const formattedPhones = recipientList.map(phone => this.validateAndFormatPhone(phone));
      const personalizedMessage = soulName 
        ? this.personalizeMessage(message, soulName, soulNickname) 
        : message;

      if (personalizedMessage.length > 160) {
        throw new Error('Le message ne doit pas dépasser 160 caractères');
      }

      const response = await this.fetchWithRetry(
        `${this.API_URL}/transactionalSMS/sms`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'api-key': this.API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sender: this.SENDER,
            recipient: formattedPhones.join(','),
            content: personalizedMessage,
            ...(scheduleTime && { scheduleAt: new Date(scheduleTime).toISOString() })
          })
        }
      );

      return await response.json();
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error(`Erreur d'envoi SMS (Tentative ${attempt}):`, {
        error: errorMessage,
        details: error
      });

      throw new Error(errorMessage);
    }
  }

  static async sendBatchSMS(messages: SMSMessage, scheduleTime?: string): Promise<any[]> {
    this.validateConfiguration();

    // Check if we have sufficient credits
    const creditCheck = await this.checkSufficientCredits();
    if (!creditCheck.sufficient) {
      toast.error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
      throw new Error('Crédit SMS insuffisant. Veuillez contacter l\'administrateur pour recharger le crédit.');
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;
    const totalRecipients = messages.recipients.length;
    let shepherdId: string | null = null;
    let loadingToastId: string | null = null;

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const user = JSON.parse(userStr);
      shepherdId = user.id;

      const batchSize = 2;
      loadingToastId = toast.loading('Envoi des messages en cours...', { duration: Infinity });

      for (let i = 0; i < messages.recipients.length; i += batchSize) {
        const batch = messages.recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(async (recipient, index) => {
          const currentNumber = i + index + 1;

          try {
            const formattedPhone = this.validateAndFormatPhone(recipient.phone);
            const result = await this.sendSMS(
              formattedPhone,
              messages.message,
              recipient.fullName,
              recipient.nickname,
              scheduleTime
            );

            await this.createSMSInteraction(
              shepherdId!,
              recipient.id,
              messages.message,
              new Date()
            );

            successCount++;
            return { success: true, recipient, result };
          } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            failureCount++;
            console.error(`Erreur d'envoi SMS à ${recipient.fullName}:`, error);
            return { success: false, recipient, error: errorMessage };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        if (i + batchSize < messages.recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      console.error('Error in sendBatchSMS:', error);
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      throw new Error(errorMessage);
    } finally {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} message${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''} avec succès`,
          { duration: 5000 }
        );
      }
      if (failureCount > 0) {
        toast.error(
          `${failureCount} message${failureCount > 1 ? 's' : ''} non envoyé${failureCount > 1 ? 's' : ''}`,
          { duration: 5000 }
        );
      }
    }

    return results;
  }

  private static async getCurrentShepherdId(): Promise<string | null> {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      const user = JSON.parse(userStr);
      return user.id;
    } catch (error: any) {
      console.error('Error getting shepherd ID:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la récupération de votre identifiant');
    }
  }
}