export const containsDox = (text: string): boolean => {
   if (!text) return false;
   // Matches standard formats for SSN: 000-00-0000 or without dashes
   const ssnRegex = /\b(?!000|666)[0-8][0-9]{2}[- ]?(?!00)[0-9]{2}[- ]?(?!0000)[0-9]{4}\b/;
   
   // Matches credit cards
   const ccRegex = /\b(?:\d[\W_]*?){13,16}\b/;
   
   return ssnRegex.test(text) || ccRegex.test(text); // Basic phone regex may be too broad, so stick to SSN and CC for actual DOX / PII blocking in text
}

export const redactDox = (text: string): string => {
   if (!text) return "";
   let redacted = text;
   // Basic SSN redaction
   const ssnRegex = /\b(?!000|666)([0-8][0-9]{2})[- ]?(?!00)([0-9]{2})[- ]?(?!0000)([0-9]{4})\b/g;
   redacted = redacted.replace(ssnRegex, '[REDACTED_SSN]');
   
   // Basic CC redaction (13-16 digits with possible spaces/dashes)
   const ccRegex = /\b(?:\d{4}[- ]?){3}\d{4}\b/g;
   redacted = redacted.replace(ccRegex, '[REDACTED_CC]');
   
   return redacted;
}

export const logMaliciousActivity = async (reason: string, userId?: string) => {
   try {
     const { db } = await import('./firebase');
     const { collection, addDoc } = await import('firebase/firestore');
     
     // Fetch IP address (IPv4 or IPv6)
     const response = await fetch('https://api64.ipify.org?format=json');
     const data = await response.json();
     const ipAddress = data.ip;

     // Log to Firestore
     await addDoc(collection(db, 'security_logs'), {
       ipAddress,
       reason,
       userId: userId || 'anonymous',
       timestamp: Date.now(),
       userAgent: navigator.userAgent
     });
     
     console.warn(`[SECURITY] Malicious activity logged. IP: ${ipAddress}, Reason: ${reason}`);
   } catch (e) {
     console.error("[SECURITY] Failed to log malicious activity:", e);
   }
}
