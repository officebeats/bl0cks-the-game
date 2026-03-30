import { spawn } from 'child_process';
import os from 'os';
import { resolve } from 'path';

let currentAudioProcess = null;

/**
 * Plays an MP3 file in a fully headless OS-native shell.
 * Automatically stops any previously playing track to guarantee no overlapping.
 */
export function playAudio(filePath) {
  // Always kill the previous track so they never clash
  stopAudio();

  const absPath = resolve(filePath);
  const platform = os.platform();

  if (platform === 'win32') {
    // Windows: Use WMPlayer.OCX via PowerShell. It runs completely headless, 
    // supports native MP3 decompression without popups, and can be easily task-killed.
    const psScript = `
      $player = New-Object -ComObject WMPlayer.OCX;
      $player.settings.autoStart = $True;
      $player.URL = "${absPath}";
      while($player.playState -ne 1) { Start-Sleep -Milliseconds 100 }
    `;
    currentAudioProcess = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', psScript], {
      windowsHide: true,
      stdio: 'ignore'
    });
  } else if (platform === 'darwin') {
    // MacOS: Native default player
    currentAudioProcess = spawn('afplay', [absPath], { stdio: 'ignore' });
  } else {
    // Linux: Fallback
    currentAudioProcess = spawn('mpg123', ['-q', absPath], { stdio: 'ignore' });
  }

  currentAudioProcess.on('exit', () => {
    currentAudioProcess = null;
  });
}

/**
 * Instantly terminates any background audio streams.
 */
export function stopAudio() {
  if (currentAudioProcess) {
    try {
      currentAudioProcess.kill('SIGKILL');
    } catch (e) {
      // Ignore process race condition errors
    }
    currentAudioProcess = null;
  }
}
