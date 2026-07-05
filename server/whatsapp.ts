import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  WAMessage,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode";
import {
  upsertWhatsappConnection,
  getWhatsappConnection,
  saveMessage,
  getUserRules,
  logActivity,
} from "./db";
import type { AutomationRule, Message } from "../drizzle/schema";

// Store active socket instances per user
const activeSockets = new Map<number, ReturnType<typeof makeWASocket>>();
const qrCodeCallbacks = new Map<number, (qr: string) => void>();

/**
 * Initialize WhatsApp connection for a user
 */
export async function initializeWhatsAppConnection(
  userId: number,
  onQR: (qr: string) => void
) {
  try {
    // Set QR callback
    qrCodeCallbacks.set(userId, onQR);

    // Get or create auth state
    const { state, saveCreds } = await useMultiFileAuthState(
      `./auth_info_${userId}`
    );

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["SmartGen Chatbot", "Chrome", "1.0.0"],
    });

    // Handle QR code
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await qrcode.toDataURL(qr);
          onQR(qrDataUrl);
          await upsertWhatsappConnection(userId, {
            status: "connecting",
            qrCode: qrDataUrl,
          });
        } catch (error) {
          console.error("QR generation error:", error);
        }
      }

      if (connection === "open") {
        console.log(`[WhatsApp] Connected for user ${userId}`);
        const phoneNumber = sock.user?.id?.split(":")?.[0] || "unknown";
        await upsertWhatsappConnection(userId, {
          status: "connected",
          phoneNumber,
          lastConnectedAt: new Date(),
          qrCode: null,
        });
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        console.log(
          `[WhatsApp] Connection closed for user ${userId}, reconnect: ${shouldReconnect}`
        );

        if (shouldReconnect) {
          await upsertWhatsappConnection(userId, {
            status: "error",
            errorMessage: "Connection closed unexpectedly",
          });
          setTimeout(() => initializeWhatsAppConnection(userId, onQR), 3000);
        } else {
          await upsertWhatsappConnection(userId, {
            status: "disconnected",
            sessionData: null,
            qrCode: null,
          });
        }
      }
    });

    // Handle messages
    sock.ev.on("messages.upsert", async (m) => {
      const message = m.messages[0];
      if (!message.message) return;

      // Store incoming message
      const messageContent =
        message.message.conversation ||
        message.message.extendedTextMessage?.text ||
        "[Media message]";

      const sender = message.key.remoteJid || "unknown";
      const messageId = message.key.id || "";

      await saveMessage({
        userId,
        messageId,
        sender,
        senderName: message.pushName,
        content: messageContent,
        direction: "incoming",
        timestamp: (message.messageTimestamp as number) * 1000,
        isAutomated: false,
      });

      // Check automation rules
      await checkAndExecuteRules(userId, sender, messageContent, messageId, sock);
    });

    // Save credentials
    sock.ev.on("creds.update", saveCreds);

    // Store socket
    activeSockets.set(userId, sock);

    return sock;
  } catch (error) {
    console.error(`[WhatsApp] Init error for user ${userId}:`, error);
    await upsertWhatsappConnection(userId, {
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}

/**
 * Check and execute automation rules for incoming message
 */
async function checkAndExecuteRules(
  userId: number,
  sender: string,
  messageContent: string,
  messageId: string,
  sock: ReturnType<typeof makeWASocket>
) {
  try {
    const rules = await getUserRules(userId);
    const enabledRules = rules.filter((r) => r.enabled);

    for (const rule of enabledRules) {
      if (matchesRule(messageContent, rule)) {
        // Send automated response
        try {
          await sock.sendMessage(sender, {
            text: rule.response,
          });

          // Save outgoing message
          await saveMessage({
            userId,
            messageId: `auto_${Date.now()}`,
            sender: "bot",
            senderName: "SmartGen Bot",
            content: rule.response,
            direction: "outgoing",
            timestamp: Date.now(),
            isAutomated: true,
          });

          // Log activity
          await logActivity({
            userId,
            ruleId: rule.id,
            messageId,
            contact: sender,
            contactName: messageContent.substring(0, 50),
            matchedKeyword: rule.keyword,
            sentResponse: rule.response,
            status: "success",
          });
        } catch (sendError) {
          console.error("Error sending automated response:", sendError);
          await logActivity({
            userId,
            ruleId: rule.id,
            messageId,
            contact: sender,
            matchedKeyword: rule.keyword,
            sentResponse: rule.response,
            status: "failed",
            errorMessage:
              sendError instanceof Error ? sendError.message : "Unknown error",
          });
        }

        // Only execute first matching rule
        break;
      }
    }
  } catch (error) {
    console.error("Error checking rules:", error);
  }
}

/**
 * Check if message matches automation rule
 */
function matchesRule(messageContent: string, rule: AutomationRule): boolean {
  const content = messageContent.toLowerCase();
  const keyword = rule.keyword.toLowerCase();

  switch (rule.matchType) {
    case "exact":
      return content === keyword;
    case "contains":
      return content.includes(keyword);
    case "startsWith":
      return content.startsWith(keyword);
    case "endsWith":
      return content.endsWith(keyword);
    default:
      return false;
  }
}

/**
 * Send a manual message
 */
export async function sendManualMessage(
  userId: number,
  recipient: string,
  message: string
) {
  const sock = activeSockets.get(userId);
  if (!sock) {
    throw new Error("WhatsApp not connected");
  }

  try {
    const response = await sock.sendMessage(recipient, {
      text: message,
    });

    // Save outgoing message
    await saveMessage({
      userId,
      messageId: response?.key?.id || `manual_${Date.now()}`,
      sender: "bot",
      senderName: "You",
      content: message,
      direction: "outgoing",
      timestamp: Date.now(),
      isAutomated: false,
    });

    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/**
 * Disconnect WhatsApp
 */
export async function disconnectWhatsApp(userId: number) {
  const sock = activeSockets.get(userId);
  if (sock) {
    await sock.logout();
    activeSockets.delete(userId);
  }
  await upsertWhatsappConnection(userId, {
    status: "disconnected",
    sessionData: null,
    qrCode: null,
  });
}

/**
 * Get socket for user
 */
export function getSocket(userId: number) {
  return activeSockets.get(userId);
}

/**
 * Get QR callback for user
 */
export function getQRCallback(userId: number) {
  return qrCodeCallbacks.get(userId);
}
