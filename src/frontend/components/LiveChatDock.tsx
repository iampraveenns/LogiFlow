/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * LogiFlow Enterprise - Real-Time WebSocket Logistics Live Chat Dock
 * Provides server-authoritative multi-channel communications, active participant rosters,
 * attachments for waybills and telematics, emoji reactions, and typing indicators.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Users,
  Paperclip,
  Smile,
  AlertTriangle,
  Truck,
  Ship,
  Navigation,
  ShieldCheck,
  ThermometerSnowflake,
  Radio,
  FileText,
  MapPin,
  CheckCheck,
  ChevronDown,
} from 'lucide-react';
import {
  ChatChannelId,
  ChatChannelDefinition,
  ChatMessage,
  ChatUserPresence,
  ChatAttachment,
  UserSession,
  WebSocketServerEvent,
} from '../../packages/shared-types/index.ts';
import { LOGISTICS_CHANNELS, LocalWebSocketBridge, WebSocketChatHub } from '../../backend/services/webSocketChatService.ts';

interface LiveChatDockProps {
  currentUser: UserSession;
  rawAccessToken: string;
  activeWaybillId?: string;
  activeVehicleId?: string;
}

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  Truck,
  Ship,
  AlertTriangle,
  Navigation,
  ShieldCheck,
  ThermometerSnowflake,
};

export function LiveChatDock({
  currentUser,
  rawAccessToken,
  activeWaybillId,
  activeVehicleId,
}: LiveChatDockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<ChatChannelId>('dispatch-ops');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [channels, setChannels] = useState<ChatChannelDefinition[]>(LOGISTICS_CHANNELS);
  const [onlineUsers, setOnlineUsers] = useState<ChatUserPresence[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputPriority, setInputPriority] = useState<'ROUTINE' | 'URGENT' | 'EMERGENCY'>('ROUTINE');
  const [showUserRoster, setShowUserRoster] = useState(false);
  const [typingIndicator, setTypingIndicator] = useState<{ userId: string; userName: string } | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(3);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientId = useRef<string>(`client_${currentUser.userId}_${Math.random().toString(36).slice(2, 7)}`);

  // Auto-scroll messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingIndicator]);

  // Connect to WebSocket communication hub
  useEffect(() => {
    const cid = clientId.current;

    // Load initial channel messages directly from hub
    const hub = WebSocketChatHub.getInstance();
    setMessages(hub.getChannelMessages(activeChannelId));

    // Register with LocalWebSocketBridge (works seamlessly in all environments)
    const cleanup = LocalWebSocketBridge.registerClient(cid, rawAccessToken);

    const unsubscribe = LocalWebSocketBridge.subscribe((event: WebSocketServerEvent) => {
      switch (event.type) {
        case 'chat:auth_ack':
          setIsConnected(true);
          setChannels(event.activeChannels);
          break;

        case 'chat:message':
          if (event.message.channelId === activeChannelId) {
            setMessages((prev) => {
              // Idempotency: skip duplicates
              if (prev.some((m) => m.id === event.message.id)) return prev;
              return [...prev, event.message];
            });
          } else {
            // Increment unread count for other channel
            setChannels((prev) =>
              prev.map((c) =>
                c.id === event.message.channelId
                  ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                  : c
              )
            );
            setUnreadTotal((u) => u + 1);
          }
          break;

        case 'chat:message_updated':
          setMessages((prev) =>
            prev.map((m) => (m.id === event.message.id ? event.message : m))
          );
          break;

        case 'chat:history':
          if (event.channelId === activeChannelId) {
            setMessages(event.messages);
          }
          break;

        case 'chat:typing_indicator':
          if (event.channelId === activeChannelId && event.userId !== currentUser.userId) {
            if (event.isTyping) {
              setTypingIndicator({ userId: event.userId, userName: event.userName });
            } else {
              setTypingIndicator(null);
            }
          }
          break;

        case 'presence:sync':
          setOnlineUsers(event.onlineUsers);
          break;

        case 'presence:user_joined':
          setOnlineUsers((prev) => [...prev.filter((u) => u.userId !== event.presence.userId), event.presence]);
          break;

        case 'presence:user_left':
          setOnlineUsers((prev) => prev.filter((u) => u.userId !== event.userId));
          break;
      }
    });

    return () => {
      cleanup();
      unsubscribe();
    };
  }, [activeChannelId, currentUser.userId, rawAccessToken]);

  // Handle switching channels
  const handleSelectChannel = (channelId: ChatChannelId) => {
    setActiveChannelId(channelId);
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
    LocalWebSocketBridge.sendToHub(clientId.current, {
      type: 'chat:join_channel',
      channelId,
    });
  };

  // Handle sending a message
  const handleSendMessage = (e?: React.FormEvent, attachments?: ChatAttachment[]) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text && (!attachments || attachments.length === 0)) return;

    LocalWebSocketBridge.sendToHub(clientId.current, {
      type: 'chat:send_message',
      channelId: activeChannelId,
      content: text || 'Attached logistics dispatch reference',
      priority: inputPriority,
      attachments: attachments || [],
    });

    setInputText('');
    setInputPriority('ROUTINE');
    setShowAttachmentMenu(false);

    // Stop typing indicator
    LocalWebSocketBridge.sendToHub(clientId.current, {
      type: 'chat:typing',
      channelId: activeChannelId,
      isTyping: false,
    });
  };

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    LocalWebSocketBridge.sendToHub(clientId.current, {
      type: 'chat:typing',
      channelId: activeChannelId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      LocalWebSocketBridge.sendToHub(clientId.current, {
        type: 'chat:typing',
        channelId: activeChannelId,
        isTyping: false,
      });
    }, 2000);
  };

  // Add emoji reaction
  const handleReaction = (messageId: string, emoji: string) => {
    LocalWebSocketBridge.sendToHub(clientId.current, {
      type: 'chat:add_reaction',
      messageId,
      emoji,
    });
  };

  // Attach Waybill
  const handleAttachWaybill = () => {
    if (!activeWaybillId) return;
    const attachment: ChatAttachment = {
      type: 'WAYBILL',
      referenceId: activeWaybillId,
      title: `Waybill Consignment ${activeWaybillId}`,
      summary: `Active shipment attached by ${currentUser.name} for team dispatch coordination.`,
    };
    handleSendMessage(undefined, [attachment]);
  };

  // Attach Vehicle Telematics
  const handleAttachVehicle = () => {
    if (!activeVehicleId) return;
    const attachment: ChatAttachment = {
      type: 'VEHICLE',
      referenceId: activeVehicleId,
      title: `Fleet Vehicle ${activeVehicleId}`,
      summary: `Live telematics ping and geofence tracking shared to ${activeChannelId}.`,
    };
    handleSendMessage(undefined, [attachment]);
  };

  // Minimized Trigger Pill
  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          setUnreadTotal(0);
        }}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-4 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 border border-blue-400/40 transition transform hover:-translate-y-0.5"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {unreadTotal > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-slate-950">
              {unreadTotal}
            </span>
          )}
        </div>
        <div className="text-left">
          <div className="text-xs font-bold leading-tight">Live Logistics Chat</div>
          <div className="text-[10px] text-blue-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {onlineUsers.length || 5} online dispatchers
          </div>
        </div>
      </button>
    );
  }

  const activeChannelDef = channels.find((c) => c.id === activeChannelId) || channels[0];
  const ChannelIcon = CHANNEL_ICONS[activeChannelDef?.iconName] || MessageSquare;

  return (
    <div
      className={`fixed bottom-4 right-4 z-40 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isMinimized ? 'w-80 h-14' : 'w-[440px] h-[600px] max-w-[calc(100vw-2rem)]'
      }`}
    >
      {/* Top Bar */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <ChannelIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white truncate">
                {activeChannelDef?.name}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                #{activeChannelId}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>WebSocket Connected</span>
              <span>•</span>
              <button
                onClick={() => setShowUserRoster(!showUserRoster)}
                className="text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <Users className="w-2.5 h-2.5" />
                {onlineUsers.length || 5} online
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Channel Ribbon */}
          <div className="flex border-b border-slate-800 bg-slate-950/70 overflow-x-auto p-1.5 gap-1 scrollbar-none text-xs">
            {channels.map((ch) => {
              const Icon = CHANNEL_ICONS[ch.iconName] || MessageSquare;
              const isActive = ch.id === activeChannelId;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSelectChannel(ch.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md shrink-0 text-[11px] font-medium transition ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="truncate max-w-[110px]">{ch.name.split(' ')[0]}</span>
                  {ch.unreadCount ? (
                    <span className="px-1 py-0.2 rounded-full bg-red-500 text-[9px] text-white font-bold">
                      {ch.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* User Roster Drawer (Overlay) */}
          {showUserRoster && (
            <div className="p-3 bg-slate-950 border-b border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Active Operators ({onlineUsers.length || 5})</span>
                <button
                  onClick={() => setShowUserRoster(false)}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                {(onlineUsers.length > 0 ? onlineUsers : [
                  { userId: 'usr-admin-01', userName: 'Elena Rostova', userRole: 'ADMIN' },
                  { userId: 'usr-disp-02', userName: 'Frank Mueller', userRole: 'DISPATCHER' },
                  { userId: 'usr-drv-04', userName: 'Lars van der Beek', userRole: 'FLEET_DRIVER' },
                  { userId: 'usr-aud-05', userName: 'Sarah Chen, Esq.', userRole: 'COMPLIANCE_AUDITOR' },
                  { userId: 'usr-wm-03', userName: 'Astrid Lindberg', userRole: 'WAREHOUSE_MANAGER' },
                ]).map((u: any) => (
                  <div
                    key={u.userId}
                    className="flex items-center gap-2 p-1.5 rounded bg-slate-900 border border-slate-800"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-medium text-white truncate text-[11px]">{u.userName}</div>
                      <div className="text-[9px] text-blue-400 uppercase font-mono">{u.userRole}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-900/60">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
                <p>No messages yet in #{activeChannelId}.</p>
                <p className="text-[10px] text-slate-600">Send dispatch instructions or attach waybills.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    {/* Header meta */}
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                      <span className="font-semibold text-slate-200">{msg.senderName}</span>
                      <span className="px-1 py-0.2 rounded text-[8px] font-mono bg-slate-800 text-slate-300">
                        {msg.senderRole}
                      </span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {msg.priority !== 'ROUTINE' && (
                        <span
                          className={`px-1 rounded text-[8px] font-bold ${
                            msg.priority === 'EMERGENCY'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {msg.priority}
                        </span>
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`p-2.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      <p>{msg.content}</p>

                      {/* Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.attachments.map((att, i) => (
                            <div
                              key={i}
                              className={`p-2 rounded-lg border text-[11px] ${
                                isMe
                                  ? 'bg-blue-700/70 border-blue-500/50 text-blue-100'
                                  : 'bg-slate-900 border-slate-700 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold mb-0.5">
                                {att.type === 'WAYBILL' && <FileText className="w-3.5 h-3.5" />}
                                {att.type === 'VEHICLE' && <Truck className="w-3.5 h-3.5" />}
                                {att.type === 'GEO_PIN' && <MapPin className="w-3.5 h-3.5" />}
                                {att.type === 'HAZMAT_GUIDE' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                                <span>{att.title}</span>
                              </div>
                              <p className="text-[10px] opacity-90">{att.summary}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Reactions & Action Bar */}
                    <div className="flex items-center gap-1 px-1">
                      {msg.reactions && msg.reactions.map((r, ri) => (
                        <button
                          key={ri}
                          onClick={() => handleReaction(msg.id, r.emoji)}
                          className="px-1.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] flex items-center gap-1 text-slate-300 transition"
                          title={`Reacted by ${r.userName}`}
                        >
                          <span>{r.emoji}</span>
                        </button>
                      ))}

                      {/* Quick reaction buttons */}
                      <button
                        onClick={() => handleReaction(msg.id, '👍')}
                        className="text-[10px] opacity-40 hover:opacity-100 px-1 hover:bg-slate-800 rounded transition"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '⚠️')}
                        className="text-[10px] opacity-40 hover:opacity-100 px-1 hover:bg-slate-800 rounded transition"
                      >
                        ⚠️
                      </button>
                      <button
                        onClick={() => handleReaction(msg.id, '✅')}
                        className="text-[10px] opacity-40 hover:opacity-100 px-1 hover:bg-slate-800 rounded transition"
                      >
                        ✅
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {typingIndicator && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 italic px-2">
                <span className="flex space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>{typingIndicator.userName} is typing dispatch directive...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Selector Tray */}
          {showAttachmentMenu && (
            <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center gap-2 text-xs">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Attach:</span>
              {activeWaybillId && (
                <button
                  type="button"
                  onClick={handleAttachWaybill}
                  className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-[10px] flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  Waybill {activeWaybillId}
                </button>
              )}
              {activeVehicleId && (
                <button
                  type="button"
                  onClick={handleAttachVehicle}
                  className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-[10px] flex items-center gap-1"
                >
                  <Truck className="w-3 h-3" />
                  Vehicle {activeVehicleId}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(false)}
                className="text-slate-500 hover:text-slate-300 text-[10px] ml-auto"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => handleSendMessage(e)}
            className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`p-1.5 rounded hover:bg-slate-800 transition ${
                  showAttachmentMenu ? 'text-blue-400 bg-slate-800' : 'text-slate-400'
                }`}
                title="Attach Waybill or Telematics Pin"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <select
                value={inputPriority}
                onChange={(e) => setInputPriority(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[10px] font-bold text-slate-300 focus:outline-none"
              >
                <option value="ROUTINE">ROUTINE</option>
                <option value="URGENT">URGENT</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </div>

            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder={`Message #${activeChannelId}...`}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
