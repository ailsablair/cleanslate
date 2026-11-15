import { io, Socket } from 'socket.io-client';
import crypto from 'crypto';

export const BOTPENGUIN_CUSTOMER_ID = '6af9cb1145f11c331e6da950';
export const BOTPENGUIN_AGENT_ID = '6af9cb3f3e82b7b922bcd7b9';
export const BOTPENGUIN_AGENT_PAGE_URL =
  `https://page.botpenguin.com/${BOTPENGUIN_AGENT_ID}/${BOTPENGUIN_CUSTOMER_ID}/agent`;

export interface BotPenguinAgentConfig {
  agentId: string;
  customerId: string;
  name: string;
  welcomeNote: string;
  iceBreakers: string[];
  agencyId: string;
  isConnected: boolean;
}

interface PendingTurn {
  prompt: string;
  timeoutMs: number;
  resolve: (res: BotPenguinReplyResult) => void;
  reject: (err: Error) => void;
}

interface BotPenguinSessionState {
  sessionId: string;
  uuid: string;
  inboxUser?: string;
  socket: Socket | null;
  isConnected: boolean;
  connectPromise: Promise<Socket> | null;
  idleTimer: ReturnType<typeof setTimeout> | null;
  completedMids: Set<string>;
  lastReplyText: string;
  queue: Promise<void>;
  activeListener: {
    onResponse: (payload: any) => void;
    onStream: (payload: any) => void;
  } | null;
}

const sessionStore = new Map<string, BotPenguinSessionState>();
let cachedConfig: { value: BotPenguinAgentConfig; fetchedAt: number } | null = null;
const CONFIG_TTL_MS = 5 * 60 * 1000;
const SESSION_IDLE_MS = 5 * 60 * 1000;

const FULL_ICEBREAKER_EXPANSIONS: Array<{ prefix: string; full: string }> = [
  {
    prefix: 'Which categories are not counted towards my bankruptcy payme',
    full: 'Which categories are not counted towards my bankruptcy payment calculation?'
  },
  {
    prefix: 'What is the difference between Employment Insurance Benefits',
    full: 'What is the difference between Employment Insurance Benefits vs. Social Assistance?'
  },
  {
    prefix: 'Do I include a breakdown for each bank account or total each',
    full: 'Do I include a breakdown for each bank account or total each category across all accounts?'
  }
];

function expandClippedIceBreaker(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return trimmed;
  const match = FULL_ICEBREAKER_EXPANSIONS.find((item) =>
    trimmed.toLowerCase().startsWith(item.prefix.toLowerCase())
  );
  return match ? match.full : trimmed;
}

const DEFAULT_AGENT_CONFIG: BotPenguinAgentConfig = {
  agentId: BOTPENGUIN_AGENT_ID,
  customerId: BOTPENGUIN_CUSTOMER_ID,
  name: 'LITbot',
  welcomeNote: 'Hi! I’m your AI Trustee assistant. How can I help you today?',
  iceBreakers: [
    'Which categories are not counted towards my bankruptcy payment calculation?',
    'What is the difference between Employment Insurance Benefits vs. Social Assistance?',
    'Do I include a breakdown for each bank account or total each category across all accounts?'
  ],
  agencyId: '',
  isConnected: false
};

export async function getBotPenguinAgentConfig(): Promise<BotPenguinAgentConfig> {
  if (cachedConfig && Date.now() - cachedConfig.fetchedAt < CONFIG_TTL_MS) {
    return cachedConfig.value;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(
      `https://api.v7.botpenguin.com/ai-agent-widget/${BOTPENGUIN_CUSTOMER_ID}/${BOTPENGUIN_AGENT_ID}?uuid=null`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      return cachedConfig?.value || DEFAULT_AGENT_CONFIG;
    }

    const json: any = await res.json();
    const data = json?.data;
    if (!data?.agent) {
      return cachedConfig?.value || DEFAULT_AGENT_CONFIG;
    }

    const rawIceBreakers: string[] = Array.isArray(data.agent.iceBreaker)
      ? data.agent.iceBreaker
      : DEFAULT_AGENT_CONFIG.iceBreakers;

    const config: BotPenguinAgentConfig = {
      agentId: data.agent._id || BOTPENGUIN_AGENT_ID,
      customerId: data._customer || BOTPENGUIN_CUSTOMER_ID,
      name: data.agent.name || 'LITbot',
      welcomeNote: data.agent.welcomeNote || DEFAULT_AGENT_CONFIG.welcomeNote,
      iceBreakers: rawIceBreakers.map(expandClippedIceBreaker).filter(Boolean),
      agencyId: data.agency?._id || '',
      isConnected: true
    };

    cachedConfig = { value: config, fetchedAt: Date.now() };
    return config;
  } catch (err) {
    console.warn('Note fetching BotPenguin agent config (using cached/default):', err);
    return cachedConfig?.value || DEFAULT_AGENT_CONFIG;
  }
}

export interface BotPenguinReplyResult {
  text: string;
  provider: 'botpenguin';
  sessionId: string;
}

function closeSessionSocket(session: BotPenguinSessionState) {
  if (session.idleTimer) {
    clearTimeout(session.idleTimer);
    session.idleTimer = null;
  }
  session.isConnected = false;
  session.connectPromise = null;
  if (session.socket) {
    try {
      session.socket.removeAllListeners();
      session.socket.disconnect();
    } catch {
      // ignore disconnect errors
    }
    session.socket = null;
  }
}

function refreshSessionIdleTimer(session: BotPenguinSessionState) {
  if (session.idleTimer) clearTimeout(session.idleTimer);
  session.idleTimer = setTimeout(() => {
    closeSessionSocket(session);
    sessionStore.delete(session.sessionId);
  }, SESSION_IDLE_MS);
}

async function ensureSessionSocket(
  session: BotPenguinSessionState,
  config: BotPenguinAgentConfig
): Promise<Socket> {
  if (session.socket && session.socket.connected && session.isConnected) {
    refreshSessionIdleTimer(session);
    return session.socket;
  }

  if (session.connectPromise) {
    return session.connectPromise;
  }

  session.connectPromise = new Promise<Socket>((resolve, reject) => {
    closeSessionSocket(session);

    const socket = io('https://api.v7.botpenguin.com/', {
      path: '/ws/chatbot',
      transports: ['websocket', 'polling'],
      query: {
        platform: 'ai-agent',
        host: 'page.botpenguin.com',
        url: BOTPENGUIN_AGENT_PAGE_URL,
        uuid: session.uuid,
        _customer: config.customerId,
        _agency: config.agencyId || '',
        _aiAgent: config.agentId,
        user: session.inboxUser || ''
      },
      timeout: 10000,
      forceNew: true
    });

    session.socket = socket;
    let settled = false;

    const connectTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      closeSessionSocket(session);
      reject(new Error('BotPenguin socket connection timed out'));
    }, 10000);

    const markReady = () => {
      if (settled) return;
      settled = true;
      clearTimeout(connectTimer);
      session.isConnected = true;
      session.connectPromise = null;
      socket.emit('update-user-details', {
        configuration: {
          name: config.name
        }
      });
      refreshSessionIdleTimer(session);
      resolve(socket);
    };

    socket.on('connected', markReady);
    socket.on('connect', () => {
      setTimeout(() => {
        if (!settled) markReady();
      }, 450);
    });

    socket.on('ai-agent-response', (payload: any) => {
      if (payload?.uuid) session.uuid = payload.uuid;
      if (payload?._inboxUser) session.inboxUser = payload._inboxUser;
      session.activeListener?.onResponse(payload);
    });

    socket.on('ai-agent-stream', (payload: any) => {
      if (payload?.uuid) session.uuid = payload.uuid;
      session.activeListener?.onStream(payload);
    });

    socket.on('disconnect', () => {
      session.isConnected = false;
    });

    socket.on('connect_error', (err: Error) => {
      if (!settled) {
        settled = true;
        clearTimeout(connectTimer);
        closeSessionSocket(session);
        reject(new Error(`BotPenguin connect error: ${err?.message || 'unknown'}`));
      }
    });
  });

  return session.connectPromise;
}

async function executeTurnOnSession(
  session: BotPenguinSessionState,
  config: BotPenguinAgentConfig,
  turn: PendingTurn
): Promise<BotPenguinReplyResult> {
  const socket = await ensureSessionSocket(session, config);
  refreshSessionIdleTimer(session);

  return new Promise<BotPenguinReplyResult>((resolve, reject) => {
    let settled = false;
    const streamBuffers = new Map<string, Map<number, string>>();
    let activeStreamMid: string | null = null;
    let responseText = '';
    let responseMid: string | null = null;
    let fallbackResolveTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanupTurn = () => {
      clearTimeout(overallTimer);
      if (fallbackResolveTimer) clearTimeout(fallbackResolveTimer);
      session.activeListener = null;
    };

    const finishSuccess = (text: string, mid?: string | null) => {
      if (settled) return;
      const cleaned = text.trim();
      if (!cleaned) return;
      settled = true;
      if (mid) session.completedMids.add(mid);
      session.lastReplyText = cleaned;
      cleanupTurn();
      refreshSessionIdleTimer(session);
      resolve({
        text: cleaned,
        provider: 'botpenguin',
        sessionId: session.sessionId
      });
    };

    const finishError = (err: Error) => {
      if (settled) return;
      settled = true;
      cleanupTurn();
      reject(err);
    };

    const assembleStream = (mid: string): string => {
      const map = streamBuffers.get(mid);
      if (!map || map.size === 0) return '';
      return Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([, tok]) => tok)
        .join('');
    };

    const overallTimer = setTimeout(() => {
      if (activeStreamMid) {
        const partial = assembleStream(activeStreamMid);
        if (partial.trim().length > 0) {
          finishSuccess(partial, activeStreamMid);
          return;
        }
      }
      if (responseText.trim().length > 0) {
        finishSuccess(responseText, responseMid);
        return;
      }
      finishError(new Error(`BotPenguin AI Agent timed out after ${turn.timeoutMs}ms`));
    }, turn.timeoutMs);

    session.activeListener = {
      onResponse: (payload: any) => {
        if (settled) return;
        const txt = typeof payload?.text === 'string' ? payload.text.trim() : '';
        if (!txt) return;
        const pMid: string | null = payload?.mid || null;
        if (pMid && session.completedMids.has(pMid)) return;

        responseText = txt;
        responseMid = pMid;

        // Wait briefly for streaming completion event (`lastExpectedSequence`), or resolve cleanly if streaming already matches / isn't sent
        if (fallbackResolveTimer) clearTimeout(fallbackResolveTimer);
        fallbackResolveTimer = setTimeout(() => {
          finishSuccess(responseText, responseMid || activeStreamMid);
        }, 700);
      },
      onStream: (payload: any) => {
        if (settled) return;
        const mid: string = payload?.mid || 'stream-default';
        if (session.completedMids.has(mid)) return;

        activeStreamMid = mid;
        if (!streamBuffers.has(mid)) {
          streamBuffers.set(mid, new Map());
        }
        const buf = streamBuffers.get(mid)!;

        if (typeof payload?.sequence === 'number' && typeof payload?.token === 'string') {
          buf.set(payload.sequence, payload.token);
        }

        // Reset fallback timer while tokens are actively streaming
        if (fallbackResolveTimer && responseText) {
          clearTimeout(fallbackResolveTimer);
          fallbackResolveTimer = setTimeout(() => {
            const bestText = responseText || assembleStream(mid);
            finishSuccess(bestText, mid);
          }, 900);
        }

        if (payload?.lastExpectedSequence) {
          const assembled =
            typeof payload?.label === 'string' && payload.label.trim().length > 0
              ? payload.label
              : assembleStream(mid);
          const finalTxt = assembled.trim().length >= responseText.length ? assembled : responseText;
          if (finalTxt.trim().length > 0) {
            finishSuccess(finalTxt, mid);
          }
        }
      }
    };

    const userMid = crypto.randomUUID();
    socket.emit('ai-agent-message', {
      mid: userMid,
      text: turn.prompt,
      type: 'text',
      _user: session.inboxUser,
      _customer: config.customerId,
      isMedia: false,
      _agent: config.agentId,
      platform: 'website',
      uuid: session.uuid,
      _agency: config.agencyId || '',
      isPreview: false,
      isLiveChat: false
    });
  });
}

export async function askBotPenguinAgent(
  prompt: string,
  sessionId: string = 'default',
  timeoutMs: number = 18000
): Promise<BotPenguinReplyResult> {
  const config = await getBotPenguinAgentConfig();

  let session = sessionStore.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      uuid: crypto.randomUUID(),
      socket: null,
      isConnected: false,
      connectPromise: null,
      idleTimer: null,
      completedMids: new Set<string>(),
      lastReplyText: '',
      queue: Promise.resolve(),
      activeListener: null
    };
    sessionStore.set(sessionId, session);

    if (sessionStore.size > 150) {
      const oldestKey = sessionStore.keys().next().value;
      if (oldestKey) {
        const stale = sessionStore.get(oldestKey);
        if (stale) closeSessionSocket(stale);
        sessionStore.delete(oldestKey);
      }
    }
  }

  // Serialize turns within the same session so streams never overlap or cross-wire
  return new Promise<BotPenguinReplyResult>((resolve, reject) => {
    session!.queue = session!.queue
      .then(() => executeTurnOnSession(session!, config, { prompt, timeoutMs, resolve, reject }))
      .then(resolve)
      .catch((err) => {
        // Reset socket cleanly on failure so next turn opens a fresh socket
        closeSessionSocket(session!);
        reject(err);
      });
  });
}
