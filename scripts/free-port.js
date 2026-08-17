#!/usr/bin/env node

/**
 * Pre-start script to free up port 5000
 * Kills any process listening on port 5000
 */

import { exec } from 'child_process';
import { platform } from 'os';

const PORT = 5000;

function killProcessOnPort() {
  return new Promise((resolve, reject) => {
    const os = platform();
    
    if (os === 'win32') {
      // Windows: Find PID using port
      exec(`netstat -ano | findstr :${PORT}`, (error, stdout) => {
        if (stdout) {
          const lines = stdout.split('\n');
          const pids = new Set();
          
          lines.forEach(line => {
            if (line.includes('LISTENING')) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && !isNaN(parseInt(pid))) {
                pids.add(pid);
              }
            }
          });
          
          if (pids.size > 0) {
            console.log(`🔍 Found ${pids.size} process(es) using port ${PORT}`);
            
            // Kill all PIDs
            let killed = 0;
            pids.forEach(pid => {
              exec(`taskkill /F /PID ${pid}`, (err) => {
                if (!err) {
                  killed++;
                  console.log(`✅ Killed process ${pid}`);
                } else {
                  console.log(`⚠️  Could not kill process ${pid}: ${err.message}`);
                }
                
                if (killed === pids.size) {
                  resolve();
                }
              });
            });
          } else {
            console.log(`✅ Port ${PORT} is free`);
            resolve();
          }
        } else {
          console.log(`✅ Port ${PORT} is free`);
          resolve();
        }
      });
    } else {
      // macOS/Linux: Use lsof
      exec(`lsof -ti:${PORT}`, (error, stdout) => {
        if (stdout) {
          const pids = stdout.trim().split('\n').filter(pid => pid);
          if (pids.length > 0) {
            console.log(`🔍 Found ${pids.length} process(es) using port ${PORT}`);
            
            pids.forEach(pid => {
              exec(`kill -9 ${pid}`, (err) => {
                if (!err) {
                  console.log(`✅ Killed process ${pid}`);
                }
              });
            });
            
            setTimeout(resolve, 500);
          } else {
            console.log(`✅ Port ${PORT} is free`);
            resolve();
          }
        } else {
          console.log(`✅ Port ${PORT} is free`);
          resolve();
        }
      });
    }
  });
}

// Run the script
(async () => {
  try {
    console.log(`🔧 Checking port ${PORT}...`);
    await killProcessOnPort();
    console.log(`✅ Port ${PORT} is ready for use\n`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
})();
