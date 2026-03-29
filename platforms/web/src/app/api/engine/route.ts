import { NextRequest, NextResponse } from 'next/server';
import { BL0CKS } from '@bl0cks/engine';
import path from 'path';

/**
 * BL0CKS Web Engine Bridge
 * 
 * This API route acts as the server-side host for the game engine.
 * It manages ROM loading, AI state session resumption, and action delegation.
 * 
 * State is passed back and forth to keep the client "thin" 
 * and hidden stats truly hidden from the browser console.
 */

export async function POST(req: NextRequest) {
  try {
    const { action, payload, session } = await req.json();
    
    // Resolve ROM path (assuming relative to project root in dev)
    const engineRoot = process.cwd(); // Should be platforms/web
    const romDir = path.join(engineRoot, '..', '..', 'roms', payload.romId || 'chicago');
    
    // 1. Boot / Initialize Engine
    const apiKey = process.env.BL0CKS_API_KEY || ''; // Use env var for security
    const engine = await BL0CKS.boot(romDir, { apiKey });
    
    // 2. Resume Session if provided
    if (session) {
      await engine.resumeSession(session);
    }
    
    let result;
    
    // 3. Handle Actions
    switch (action) {
      case 'START_LEVEL':
        result = await engine.startLevel(payload.levelId || '01', payload.ledger);
        break;
      
      case 'SEND_ACTION':
        result = await engine.sendAction(payload.input);
        break;
        
      case 'GET_STATE':
        result = engine.getState();
        break;
        
      default:
        return NextResponse.json({ error: 'Unknown engine action' }, { status: 400 });
    }
    
    // 4. Export updated session and return current UI state
    const updatedSession = engine.exportSession();
    const uiState = engine.getState();
    const engineStats = engine.getEngineState();
    
    return NextResponse.json({
      success: true,
      state: uiState,
      _engine: engineStats,
      session: updatedSession
    });

  } catch (error: any) {
    console.error('[EngineBridge Error]:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Engine Error' 
    }, { status: 500 });
  }
}
