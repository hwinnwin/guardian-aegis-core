import { spawn } from 'node:child_process';

const cmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const args = ['bench:buffer:force', '--', '--force-exit'];
const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });

let out = '';
let err = '';
child.stdout.on('data', (data) => {
  out += data.toString();
});
child.stderr.on('data', (data) => {
  err += data.toString();
});

const timeout = setTimeout(() => {
  console.error('[smoke] Timeout: bench did not exit within 10s');
  console.error('[smoke] Last stdout:\n', out.split('\n').slice(-30).join('\n'));
  console.error('[smoke] Last stderr:\n', err.split('\n').slice(-30).join('\n'));
  process.exit(1);
}, 10000);

child.on('exit', (code) => {
  clearTimeout(timeout);
  if (code !== 0) {
    console.error('[smoke] Non-zero exit:', code);
    process.exit(code ?? 1);
  }
  if (!/Benchmarks complete/.test(out)) {
    console.error('[smoke] Did not detect completion banner');
    process.exit(2);
  }
  console.log('[smoke] Bench exited cleanly and printed completion banner.');
});
