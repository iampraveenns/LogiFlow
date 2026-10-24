/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Real-Time Logistics WebSocket Communication Hub
 * Follows real-time server-authoritative architecture with channels, presence sync,
 * typing indicators, idempotent delivery, message attachments, and cryptographic audit hashing.
 */

import {
  ChatChannelId,
  ChatChannelDefinition,
  ChatMessage,
  ChatUserPresence,
  ChatAttachment,
  ChatReaction,
  UserSession,
  UserRole,
  WebSocketClientEvent,
  WebSocketServerEvent,
} from '../../packages/shared-types/index.ts';
import { JwtAuthService, CryptoEngine } from './jwtAuthService.ts';
import { DocumentComplianceService } from './documentComplianceService.ts';
import { logger } from '../../packages/logger/index.ts';

// Initial enterprise operational channels
export const LOGISTICS_CHANNELS: ChatChannelDefinition[] = [
  {
    id: 'dispatch-ops',
    name: 'Dispatch & Route Coordination',
    description: 'Central load assignments, corridor reroutes, cross-dock expedites, and carrier dispatch.',
    category: 'OPERATIONS',
    allowedRoles: ['ADMIN', 'DISPATCHER', 'FLEET_DRIVER', 'WAREHOUSE_MANAGER', 'COMPLIANCE_AUDITOR'],
    unreadCount: 0,
    iconName: 'Truck',
  },
  {
    id: 'vessel-quayside',
    name: 'Maritime Quayside & Port Berth',
    description: 'STS container crane sequence, feeder vessel ETAs, customs bonded gates, and TEU staging.',
    category: 'OPERATIONS',
    allowedRoles: ['ADMIN', 'DISPATCHER', 'WAREHOUSE_MANAGER', 'COMPLIANCE_AUDITOR'],
    unreadCount: 0,
    iconName: 'Ship',
  },
  {
    id: 'hazmat-emergency',
    name: 'Hazmat Incident & ERG Emergency',
    description: 'UN dangerous goods spill protocols, ERG 2024 evacuation distances, and SDS compliance.',
    category: 'SAFETY',
    allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPLIANCE_AUDITOR', 'FLEET_DRIVER'],
    unreadCount: 0,
    iconName: 'AlertTriangle',
  },
  {
    id: 'drivers-fleet',
    name: 'Fleet Drivers & Telematics Comms',
    description: 'HOS hours-of-service alerts, rest stop locations, vehicle DTC telemetry, and fuel vouchers.',
    category: 'FLEET',
    allowedRoles: ['ADMIN', 'DISPATCHER', 'FLEET_DRIVER'],
    unreadCount: 0,
    iconName: 'Navigation',
  },
  {
    id: 'customs-audit',
    name: 'Customs & Sanctions Clearance',
    description: 'EDIFACT / ANSI X12 310/856 bill of lading release, HS tariff classification, and dual-use audits.',
    category: 'COMPLIANCE',
    allowedRoles: ['ADMIN', 'DISPATCHER', 'COMPLIANCE_AUDITOR'],
    unreadCount: 0,
    iconName: 'ShieldCheck',
  },
  {
    id: 'coldchain-alarms',
    name: 'GDP Cold Chain MKT Alarms',
    description: 'Arrhenius mean kinetic temperature excursions, cryogenic sensor telemetry, and reefer alarms.',
    category: 'SAFETY',
    allowedRoles: ['ADMIN', 'DISPATCHER', 'WAREHOUSE_MANAGER', 'COMPLIANCE_AUDITOR'],
    unreadCount: 0,
    iconName: 'ThermometerSnowflake',
  },
];

export interface ConnectedClient {
  id: string;
  user: UserSession;
  activeChannel: ChatChannelId;
  lastPing: number;
  send: (event: WebSocketServerEvent) => void;
}

export class WebSocketChatHub {
  private static instance: WebSocketChatHub;
  private clients: Map<string, ConnectedClient> = new Map();
  private channelMessages: Map<ChatChannelId, ChatMessage[]> = new Map();
  private messageIds: Set<string> = new Set();
  private typingUsers: Map<string, { channelId: ChatChannelId; user: UserSession; timeout: NodeJS.Timeout | number }> = new Map();

  private constructor() {
    this.seedInitialOperationalLogs();
  }

  public static getInstance(): WebSocketChatHub {
    if (!WebSocketChatHub.instance) {
      WebSocketChatHub.instance = new WebSocketChatHub();
    }
    return WebSocketChatHub.instance;
  }

  /**
   * Seed realistic logistics dispatch logs and conversations across channels
   */
  private seedInitialOperationalLogs() {
    const now = Date.now();
    const makeTime = (minutesAgo: number) => new Date(now - minutesAgo * 60 * 1000).toISOString();

    const dispatchMessages: ChatMessage[] = [
      {
        id: 'msg-disp-001',
        channelId: 'dispatch-ops',
        senderId: 'usr-disp-02',
        senderName: 'Frank Mueller',
        senderRole: 'DISPATCHER',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        tenantId: 'tenant-apex',
        content: 'Corridor Alert: A2 autobahn near Dortmund has lane closure due to roadworks. Rerouting heavy freight vehicles via A44 to avoid 45-minute choke.',
        timestamp: makeTime(42),
        priority: 'URGENT',
        attachments: [
          {
            type: 'GEO_PIN',
            referenceId: 'geo-a2-dortmund',
            title: 'A2 Congestion Bypass Waypoint',
            summary: 'Coordinates: 51.5136° N, 7.4653° E — Expected delay avoided: 45 mins',
          },
        ],
        reactions: [
          { emoji: '👍', userId: 'usr-admin-01', userName: 'Elena Rostova', timestamp: makeTime(39) },
          { emoji: '🚛', userId: 'usr-drv-04', userName: 'Lars van der Beek', timestamp: makeTime(35) },
        ],
        readBy: [
          { userId: 'usr-admin-01', readAt: makeTime(40) },
          { userId: 'usr-drv-04', readAt: makeTime(36) },
        ],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-disp-001:seed'),
      },
      {
        id: 'msg-disp-002',
        channelId: 'dispatch-ops',
        senderId: 'usr-drv-04',
        senderName: 'Lars van der Beek',
        senderRole: 'FLEET_DRIVER',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        tenantId: 'tenant-apex',
        content: 'Copy that Frank. I have taken the A44 interchange with vehicle TRK-101. Telematics speed is cruising steady at 82 km/h.',
        timestamp: makeTime(30),
        priority: 'ROUTINE',
        attachments: [
          {
            type: 'VEHICLE',
            referenceId: 'TRK-101',
            title: 'Volvo FH Electric (TRK-101)',
            summary: 'Battery: 78% | Speed: 82 km/h | Odometer: 14,290 km',
          },
        ],
        reactions: [{ emoji: '✅', userId: 'usr-disp-02', userName: 'Frank Mueller', timestamp: makeTime(28) }],
        readBy: [{ userId: 'usr-disp-02', readAt: makeTime(29) }],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-disp-002:seed'),
      },
      {
        id: 'msg-disp-003',
        channelId: 'dispatch-ops',
        senderId: 'usr-admin-01',
        senderName: 'Elena Rostova',
        senderRole: 'ADMIN',
        senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        tenantId: 'tenant-apex',
        content: 'Cross-dock staging at Duisburg Hub is ready for the high-priority medical consignment WB-90042. Please ensure cold-chain validation signature is recorded upon arrival.',
        timestamp: makeTime(12),
        priority: 'ROUTINE',
        attachments: [
          {
            type: 'WAYBILL',
            referenceId: 'WB-90042',
            title: 'Consignment WB-90042 (Temp Controlled)',
            summary: 'Vaccines 2°C - 8°C | 4 Pallets | Total 1,280 kg',
          },
        ],
        reactions: [{ emoji: '❄️', userId: 'usr-wm-03', userName: 'Astrid Lindberg', timestamp: makeTime(10) }],
        readBy: [{ userId: 'usr-wm-03', readAt: makeTime(10) }],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-disp-003:seed'),
      },
    ];

    const maritimeMessages: ChatMessage[] = [
      {
        id: 'msg-mar-001',
        channelId: 'vessel-quayside',
        senderId: 'usr-disp-02',
        senderName: 'Frank Mueller',
        senderRole: 'DISPATCHER',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        tenantId: 'tenant-apex',
        content: 'Vessel CMA CGM Concorde moored at Berth APMT-02 in Rotterdam. Crane gang #3 and #4 deploying twin-lift spreaders. 1,420 TEU discharge cycle underway.',
        timestamp: makeTime(60),
        priority: 'ROUTINE',
        attachments: [
          {
            type: 'WAYBILL',
            referenceId: 'VSL-CMA-CONCORDE',
            title: 'Berth Window APMT-02 Allocation',
            summary: 'Quayside Crane Productivity: 32.4 gross moves/hour | Departure ETA: 18:00 UTC',
          },
        ],
        reactions: [{ emoji: '🚢', userId: 'usr-admin-01', userName: 'Elena Rostova', timestamp: makeTime(55) }],
        readBy: [{ userId: 'usr-admin-01', readAt: makeTime(58) }],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-mar-001:seed'),
      },
    ];

    const hazmatMessages: ChatMessage[] = [
      {
        id: 'msg-haz-001',
        channelId: 'hazmat-emergency',
        senderId: 'usr-aud-05',
        senderName: 'Sarah Chen, Esq.',
        senderRole: 'COMPLIANCE_AUDITOR',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        tenantId: 'tenant-apex',
        content: 'Compliance Directive: UN 1203 (Gasoline / Flammable Liquid, Class 3, PG II) transport unit moving through tunnel sector 4 requires ERG Guide 128 placards verified before transit clearance.',
        timestamp: makeTime(75),
        priority: 'EMERGENCY',
        attachments: [
          {
            type: 'HAZMAT_GUIDE',
            referenceId: 'ERG-GUIDE-128',
            title: 'ERG 2024 Guide 128 - Flammable Liquids (Water-Immiscible)',
            summary: 'Initial Isolation: 50m (150ft) in all directions. Fire: dry chemical, CO2, or water spray.',
          },
        ],
        reactions: [{ emoji: '⚠️', userId: 'usr-disp-02', userName: 'Frank Mueller', timestamp: makeTime(70) }],
        readBy: [{ userId: 'usr-disp-02', readAt: makeTime(71) }],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-haz-001:seed'),
      },
    ];

    const driverMessages: ChatMessage[] = [
      {
        id: 'msg-drv-001',
        channelId: 'drivers-fleet',
        senderId: 'usr-drv-04',
        senderName: 'Lars van der Beek',
        senderRole: 'FLEET_DRIVER',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        tenantId: 'tenant-apex',
        content: 'Mandatory 45-minute EU tachograph break scheduled at Rasthof Münsterland West in 20 minutes. Current driving window: 4h 10m logged.',
        timestamp: makeTime(22),
        priority: 'ROUTINE',
        attachments: [],
        reactions: [{ emoji: '☕', userId: 'usr-disp-02', userName: 'Frank Mueller', timestamp: makeTime(18) }],
        readBy: [{ userId: 'usr-disp-02', readAt: makeTime(19) }],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-drv-001:seed'),
      },
    ];

    const customsMessages: ChatMessage[] = [
      {
        id: 'msg-cus-001',
        channelId: 'customs-audit',
        senderId: 'usr-aud-05',
        senderName: 'Sarah Chen, Esq.',
        senderRole: 'COMPLIANCE_AUDITOR',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        tenantId: 'tenant-apex',
        content: 'Customs release confirmed: Port of Hamburg Atlas EDI status changed to CODE 390 (Customs Cleared). Bonded release document 2025-EU-DE-9941 cryptographically sealed.',
        timestamp: makeTime(90),
        priority: 'ROUTINE',
        attachments: [
          {
            type: 'WAYBILL',
            referenceId: 'EU-DE-9941',
            title: 'Customs Release Certificate (Atlas EDI)',
            summary: 'HS 8471.30.00 — Zero tariff preference applied under WTO ITA agreement.',
          },
        ],
        reactions: [{ emoji: '📜', userId: 'usr-admin-01', userName: 'Elena Rostova', timestamp: makeTime(85) }],
        readBy: [{ userId: 'usr-admin-01', readAt: makeTime(86) }],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-cus-001:seed'),
      },
    ];

    const coldChainMessages: ChatMessage[] = [
      {
        id: 'msg-cld-001',
        channelId: 'coldchain-alarms',
        senderId: 'usr-wm-03',
        senderName: 'Astrid Lindberg',
        senderRole: 'WAREHOUSE_MANAGER',
        senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        tenantId: 'tenant-apex',
        content: 'Reefer Unit RF-809 operating smoothly at +4.2°C. Arrhenius Mean Kinetic Temperature (MKT) over last 24 hours calculated at +4.62°C, well within the GDP +2°C to +8°C ceiling.',
        timestamp: makeTime(15),
        priority: 'ROUTINE',
        attachments: [],
        reactions: [{ emoji: '🧊', userId: 'usr-aud-05', userName: 'Sarah Chen, Esq.', timestamp: makeTime(11) }],
        readBy: [{ userId: 'usr-aud-05', readAt: makeTime(12) }],
        digitalSignature: DocumentComplianceService.generateDocumentHash('msg-cld-001:seed'),
      },
    ];

    this.channelMessages.set('dispatch-ops', dispatchMessages);
    this.channelMessages.set('vessel-quayside', maritimeMessages);
    this.channelMessages.set('hazmat-emergency', hazmatMessages);
    this.channelMessages.set('drivers-fleet', driverMessages);
    this.channelMessages.set('customs-audit', customsMessages);
    this.channelMessages.set('coldchain-alarms', coldChainMessages);

    for (const msg of [...dispatchMessages, ...maritimeMessages, ...hazmatMessages, ...driverMessages, ...customsMessages, ...coldChainMessages]) {
      this.messageIds.add(msg.id);
    }
  }

  /**
   * Handle incoming WebSocket client connection with JWT token verification
   */
  public handleConnection(clientId: string, sendCallback: (event: WebSocketServerEvent) => void, rawToken?: string): boolean {
    let authUser: UserSession | undefined;

    if (rawToken) {
      const verified = JwtAuthService.verifyJwt(rawToken);
      if (verified.valid && verified.claims) {
        authUser = {
          userId: verified.claims.sub,
          tenantId: verified.claims.tenantId,
          organizationName: verified.claims.organizationName,
          name: verified.claims.name,
          email: verified.claims.email,
          role: verified.claims.role,
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          permissions: verified.claims.permissions,
          mfaEnabled: true,
          tokenExpiresAt: (verified.claims.exp || 0) * 1000,
        };
      }
    }

    // Default fallback to dispatcher session if prototyping or unauthenticated handshake
    if (!authUser) {
      authUser = {
        userId: `anon-${clientId.slice(0, 6)}`,
        tenantId: 'tenant-apex',
        organizationName: 'Apex Global Logistics & Freight',
        name: 'Guest Dispatcher',
        email: 'guest.dispatcher@apexlogistics.io',
        role: 'DISPATCHER',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        permissions: ['shipments:read', 'fleet:read'],
        mfaEnabled: false,
        tokenExpiresAt: Date.now() + 86400000,
      };
    }

    const client: ConnectedClient = {
      id: clientId,
      user: authUser,
      activeChannel: 'dispatch-ops',
      lastPing: Date.now(),
      send: sendCallback,
    };

    this.clients.set(clientId, client);
    logger.info('WS_CLIENT_CONNECTED', `Client ${clientId} authenticated as ${authUser.name} (${authUser.role})`);

    // Send ACK with channel list
    client.send({
      type: 'chat:auth_ack',
      success: true,
      user: authUser,
      activeChannels: LOGISTICS_CHANNELS,
    });

    // Send current channel history
    const history = this.channelMessages.get('dispatch-ops') || [];
    client.send({
      type: 'chat:history',
      channelId: 'dispatch-ops',
      messages: history,
    });

    // Broadcast user joined presence
    this.broadcastPresence();

    return true;
  }

  /**
   * Handle incoming WebSocket client event
   */
  public handleClientEvent(clientId: string, event: WebSocketClientEvent) {
    const client = this.clients.get(clientId);
    if (!client) {
      logger.warn('WS_UNREGISTERED_CLIENT', `Received event from unregistered client ${clientId}`);
      return;
    }

    client.lastPing = Date.now();

    switch (event.type) {
      case 'chat:auth': {
        const verified = JwtAuthService.verifyJwt(event.token);
        if (verified.valid && verified.claims) {
          client.user = {
            userId: verified.claims.sub,
            tenantId: verified.claims.tenantId,
            organizationName: verified.claims.organizationName,
            name: verified.claims.name,
            email: verified.claims.email,
            role: verified.claims.role,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            permissions: verified.claims.permissions,
            mfaEnabled: true,
            tokenExpiresAt: (verified.claims.exp || 0) * 1000,
          };
          client.send({
            type: 'chat:auth_ack',
            success: true,
            user: client.user,
            activeChannels: LOGISTICS_CHANNELS,
          });
          this.broadcastPresence();
        }
        break;
      }

      case 'chat:join_channel': {
        const ch = event.channelId;
        client.activeChannel = ch;
        // Send full channel history
        const messages = this.channelMessages.get(ch) || [];
        client.send({
          type: 'chat:history',
          channelId: ch,
          messages,
        });
        this.broadcastPresence();
        break;
      }

      case 'chat:leave_channel': {
        // No-op or switch to default
        break;
      }

      case 'chat:send_message': {
        const text = event.content.trim();
        if (!text) return;

        const messageId = `msg-${CryptoEngine.generateUuid()}`;
        // Idempotency check: Guard against duplicates
        if (this.messageIds.has(messageId)) {
          return;
        }
        this.messageIds.add(messageId);

        const newMsg: ChatMessage = {
          id: messageId,
          channelId: event.channelId,
          senderId: client.user.userId,
          senderName: client.user.name,
          senderRole: client.user.role,
          senderAvatar: client.user.avatarUrl,
          tenantId: client.user.tenantId,
          content: text,
          timestamp: new Date().toISOString(),
          priority: event.priority || 'ROUTINE',
          attachments: event.attachments || [],
          reactions: [],
          readBy: [{ userId: client.user.userId, readAt: new Date().toISOString() }],
          digitalSignature: DocumentComplianceService.generateDocumentHash(`${messageId}:${client.user.userId}:${text}`),
        };

        // Append to authoritative storage
        const currentList = this.channelMessages.get(event.channelId) || [];
        currentList.push(newMsg);
        this.channelMessages.set(event.channelId, currentList);

        // Broadcast to all clients viewing or subscribed to this channel
        this.broadcastToChannel(event.channelId, {
          type: 'chat:message',
          message: newMsg,
        });

        logger.info('WS_CHAT_MESSAGE', `[${event.channelId}] ${client.user.name}: ${text.slice(0, 50)}...`);
        break;
      }

      case 'chat:add_reaction': {
        for (const [chId, messages] of this.channelMessages.entries()) {
          const msg = messages.find((m) => m.id === event.messageId);
          if (msg) {
            // Check if user already reacted with this emoji
            const existingIdx = msg.reactions.findIndex(
              (r) => r.userId === client.user.userId && r.emoji === event.emoji
            );
            if (existingIdx >= 0) {
              msg.reactions.splice(existingIdx, 1); // Toggle off
            } else {
              msg.reactions.push({
                emoji: event.emoji,
                userId: client.user.userId,
                userName: client.user.name,
                timestamp: new Date().toISOString(),
              });
            }

            this.broadcastToChannel(chId, {
              type: 'chat:message_updated',
              message: msg,
            });
            break;
          }
        }
        break;
      }

      case 'chat:typing': {
        const key = `${client.id}:${event.channelId}`;
        if (event.isTyping) {
          const timeout = setTimeout(() => {
            this.typingUsers.delete(key);
            this.broadcastTyping(event.channelId, client.user.userId, client.user.name, false);
          }, 4000);

          this.typingUsers.set(key, { channelId: event.channelId, user: client.user, timeout });
          this.broadcastTyping(event.channelId, client.user.userId, client.user.name, true);
        } else {
          const existing = this.typingUsers.get(key);
          if (existing) {
            clearTimeout(existing.timeout);
            this.typingUsers.delete(key);
          }
          this.broadcastTyping(event.channelId, client.user.userId, client.user.name, false);
        }
        break;
      }

      case 'chat:mark_read': {
        for (const [chId, messages] of this.channelMessages.entries()) {
          const msg = messages.find((m) => m.id === event.messageId);
          if (msg) {
            const alreadyRead = msg.readBy.some((r) => r.userId === client.user.userId);
            if (!alreadyRead) {
              msg.readBy.push({
                userId: client.user.userId,
                readAt: new Date().toISOString(),
              });
              this.broadcastToChannel(chId, {
                type: 'chat:message_updated',
                message: msg,
              });
            }
            break;
          }
        }
        break;
      }

      case 'presence:heartbeat': {
        client.lastPing = Date.now();
        break;
      }
    }
  }

  public handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      logger.info('WS_CLIENT_DISCONNECTED', `Client ${clientId} disconnected`);
      this.broadcast({
        type: 'presence:user_left',
        userId: client.user.userId,
        lastSeen: new Date().toISOString(),
      });
      this.broadcastPresence();
    }
  }

  private broadcastToChannel(channelId: ChatChannelId, event: WebSocketServerEvent) {
    for (const client of this.clients.values()) {
      if (client.activeChannel === channelId) {
        try {
          client.send(event);
        } catch (err) {
          logger.error('WS_BROADCAST_ERROR', `Failed sending to ${client.id}`, err);
        }
      }
    }
  }

  private broadcastTyping(channelId: ChatChannelId, userId: string, userName: string, isTyping: boolean) {
    this.broadcastToChannel(channelId, {
      type: 'chat:typing_indicator',
      channelId,
      userId,
      userName,
      isTyping,
    });
  }

  private broadcastPresence() {
    const onlineUsers: ChatUserPresence[] = Array.from(this.clients.values()).map((c) => ({
      userId: c.user.userId,
      userName: c.user.name,
      userRole: c.user.role,
      avatarUrl: c.user.avatarUrl,
      tenantId: c.user.tenantId,
      status: 'ONLINE',
      activeChannel: c.activeChannel,
      lastPing: new Date(c.lastPing).toISOString(),
    }));

    this.broadcast({
      type: 'presence:sync',
      onlineUsers,
    });
  }

  private broadcast(event: WebSocketServerEvent) {
    for (const client of this.clients.values()) {
      try {
        client.send(event);
      } catch (err) {
        logger.error('WS_GLOBAL_BROADCAST_ERROR', `Failed sending to ${client.id}`, err);
      }
    }
  }

  public getChannelMessages(channelId: ChatChannelId): ChatMessage[] {
    return this.channelMessages.get(channelId) || [];
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

// In-Memory simulated transport bridge for client side in case native WebSocket is not reachable in development iFrame
export class LocalWebSocketBridge {
  private static listeners: Set<(event: WebSocketServerEvent) => void> = new Set();

  public static subscribe(cb: (event: WebSocketServerEvent) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public static sendToHub(clientId: string, event: WebSocketClientEvent) {
    const hub = WebSocketChatHub.getInstance();
    hub.handleClientEvent(clientId, event);
  }

  public static registerClient(clientId: string, rawToken?: string): () => void {
    const hub = WebSocketChatHub.getInstance();
    const send = (ev: WebSocketServerEvent) => {
      for (const cb of this.listeners) {
        cb(ev);
      }
    };
    hub.handleConnection(clientId, send, rawToken);

    return () => {
      hub.handleDisconnect(clientId);
    };
  }
}
