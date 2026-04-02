import { NextRequest, NextResponse } from 'next/server';
import { BL0CKS } from '@bl0cks/engine';
import path from 'path';

/**
 * BL0CKS Web Engine Bridge
 *
 * This API route acts as the server-side host for the game engine.
 * It manages ROM loading, AI state session resumption, and action delegation.
 *
 * Performance: Engine instances are cached at the module level to avoid
 * redundant ROM file reads and AI adapter re-initialization on every request.
 * The session state is stateless — it round-trips through the client.
 */

/** Cached engine instances keyed by ROM id. Survives across requests in the same server process. */
const engineCache = new Map<string, { engine: BL0CKS; timestamp: number }>();

/** Cache TTL: 10 minutes. Invalidate to force re-boot. */
const ENGINE_CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Get or create a cached engine instance for a ROM.
 * Avoids re-reading ROM files from disk on every request.
 */
async function getEngine(romId: string): Promise<BL0CKS> {
  const cached = engineCache.get(romId);
  if (cached && (Date.now() - cached.timestamp) < ENGINE_CACHE_TTL_MS) {
    return cached.engine;
  }

  const engineRoot = process.cwd(); // Should be platforms/web
  const romDir = path.join(engineRoot, '..', '..', 'roms', romId);
  const apiKey = process.env.BL0CKS_API_KEY || '';

  const engine = await BL0CKS.boot(romDir, { apiKey });
  engineCache.set(romId, { engine, timestamp: Date.now() });
  return engine;
}

interface EngineAction {
  action: string;
  payload: Record<string, unknown>;
  session?: Record<string, unknown> | null;
}

interface EngineResponse {
  success: boolean;
  state?: unknown;
  _engine?: unknown;
  session?: unknown;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<EngineResponse>> {
  try {
    const { action, payload, session } = (await req.json()) as EngineAction;

    const romId = (payload?.romId as string) || 'chicago';
    const engine = await getEngine(romId);

    // Resume session if provided (stateless round-trip from client)
    if (session) {
      await engine.resumeSession(session);
    }

    let result: unknown;

    switch (action) {
      case 'START_LEVEL':
        result = await engine.startLevel(
          (payload?.levelId as string) || '01',
          payload?.ledger
        );
        break;

      case 'SEND_ACTION':
        result = await engine.sendAction(payload?.input as string);
        break;

      case 'GET_STATE':
        result = engine.getState();
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown engine action: ${action}` },
          { status: 400 }
        );
    }

    // Export state snapshot for the client
    const updatedSession = engine.exportSession();
    const uiState = engine.getState();
    const engineStats = engine.getEngineState();

    return NextResponse.json({
      success: true,
      state: uiState,
      _engine: engineStats,
      session: updatedSession,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Engine Error';
    console.error('[EngineBridge Error]:', error);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
