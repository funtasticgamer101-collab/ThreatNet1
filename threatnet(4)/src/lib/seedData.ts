import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const HISTORICAL_THREATS = [
  {
    category: "Malware",
    title: "WannaCry Ransomware",
    content: "WannaCry is a ransomware cryptoworm that targeted computers running the Microsoft Windows operating system by encrypting data and demanding ransom payments in the Bitcoin cryptocurrency. It spread through the EternalBlue exploit.\n\nIndicators:\n- Uses port 445 (SMB) for propagation.\n- Encrypts files with .WNCRY extension.\n- Demands $300-$600 in BTC.",
  },
  {
    category: "Malware",
    title: "Stuxnet",
    content: "Stuxnet is a malicious computer worm first uncovered in 2010 thought to have been in development since at least 2005. It targeted supervisory control and data acquisition (SCADA) systems and is believed to be responsible for causing substantial damage to the nuclear program of Iran.\n\nIndicators:\n- Exploits multiple Windows zero-day vulnerabilities (e.g. MS10-046).\n- Targets Siemens Step7 software.\n- Modifies PLCs to alter centrifuge spin speeds.",
  },
  {
    category: "Phishing",
    title: "ILOVEYOU Virus",
    content: "Also known as Love Bug or Love Letter, it was a computer worm that attacked tens of millions of Windows personal computers on and after 5 May 2000 local time in the Philippines. It spread via an email payload.\n\nIndicators:\n- Subject: ILOVEYOU\n- Attachment: LOVE-LETTER-FOR-YOU.TXT.vbs\n- Overwrites files ending in .vbs, .vbe, .js, .jse, .css, .wsh, .sct, .hta.",
  },
  {
    category: "Vulnerabilities",
    title: "Log4Shell (CVE-2021-44228)",
    content: "Log4Shell is a zero-day vulnerability in Log4j, a popular Java logging framework, involving arbitrary code execution. The vulnerability takes advantage of Log4j's allowing requests to arbitrary LDAP and JNDI servers, allowing attackers to execute arbitrary Java code on a server or other computer.\n\nIndicators:\n- JNDI lookup patterns in logs: ${jndi:ldap://...}\n- Affected versions: Log4j 2.0-beta9 up to 2.14.1.",
  },
  {
    category: "Vulnerabilities",
    title: "EternalBlue (MS17-010)",
    content: "EternalBlue is an exploit developed by the NSA. It was leaked by the Shadow Brokers hacker group on April 14, 2017, and was used as part of the worldwide WannaCry ransomware attack on May 12, 2017.\n\nIndicators:\n- Exploits SMBv1 vulnerability.\n- Heavily used in Emotet and Trickbot campaigns.",
  },
  {
    category: "Scams",
    title: "Twitter Bitcoin Hack (2020)",
    content: "A massive spear-phishing attack against Twitter employees that resulted in the hijacking of 130 high-profile Twitter accounts. Attackers used the accounts to post a bitcoin scam, generating over $118,000 in stolen cryptocurrency.\n\nIndicators:\n- Tweets requesting BTC to a specific address with promises of doubling it.\n- Exploitation of internal administrative tools via compromised employee credentials.",
  }
];

export async function seedHistoricalThreats(uid: string) {
  for (const threat of HISTORICAL_THREATS) {
    const reportRef = doc(collection(db, 'reports'));
    
    // Step 1: Create as pending (to satisfy firestore.rules)
    await setDoc(reportRef, {
      ...threat,
      authorId: uid,
      status: 'pending',
      allowComments: true,
      isStarred: false,
      aiModerationStatus: 'clean',
      upvoteCount: 0,
      downvoteCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Step 2: Update to starred
    await updateDoc(reportRef, {
      status: 'starred',
      isStarred: true,
      upvoteCount: Math.floor(Math.random() * 500) + 100, // Fake some high upvotes
      updatedAt: Date.now()
    });
  }
}
