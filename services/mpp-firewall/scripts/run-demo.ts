import chalk from 'chalk';

const BASE_URL = 'http://localhost:3010';

const AGENTS = {
  A: '0xAAAA000000000000000000000000000000000001',
  B: '0xBBBB000000000000000000000000000000000002',
  C: '0xCCCC000000000000000000000000000000000003',
  D: '0xDDDD000000000000000000000000000000000004',
  E: '0xEEEE000000000000000000000000000000000005',
};

function truncate(wallet: string): string {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

async function api(path: string, opts?: RequestInit): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  return res.json();
}

function header(text: string): void {
  console.log('\n' + chalk.bold.cyan('═'.repeat(60)));
  console.log(chalk.bold.cyan(`  ${text}`));
  console.log(chalk.bold.cyan('═'.repeat(60)) + '\n');
}

function info(label: string, value: string): void {
  console.log(`  ${chalk.gray(label.padEnd(20))} ${value}`);
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Scene 1: The Problem (15s) ─────────────────────────────────────

async function scene1(): Promise<void> {
  header('SCENE 1 — THE PROBLEM');

  console.log(chalk.yellow('  Any agent can pay for API calls.'));
  console.log(chalk.yellow('  Trust gating helps protect your app before charging.\n'));

  await sleep(3000);
}

// ─── Scene 2: The Firewall (30s) ────────────────────────────────────

async function scene2(): Promise<void> {
  header('SCENE 2 — THE FIREWALL');

  console.log(chalk.white('  Three agents, three outcomes:\n'));

  const agentA = await api(`/trust/${AGENTS.A}`) as any;
  info('Agent A', chalk.green(`tier=${agentA.tier}  score=${agentA.score}  multiplier=${agentA.multiplier}x`));

  const agentB = await api(`/trust/${AGENTS.B}`) as any;
  info('Agent B', chalk.red(`tier=${agentB.tier}  ${agentB.blocked ? 'BLOCKED' : ''}  score=${agentB.score}`));

  const agentC = await api(`/trust/${AGENTS.C}`) as any;
  info('Agent C', chalk.yellow(`tier=${agentC.tier}  score=${agentC.score ?? 'N/A'}  multiplier=${agentC.multiplier}x`));

  console.log('');
  console.log(chalk.green('  ✓ Trusted agent allowed'));
  console.log(chalk.red('  ✗ Blocked tier denied'));
  console.log(chalk.yellow('  ◐ Unrated agent handled by SDK policy'));

  await sleep(3000);
}

// ─── Scene 3: Earning Trust (45s) ───────────────────────────────────

async function scene3(): Promise<void> {
  header('SCENE 3 — EARNING TRUST');

  console.log(chalk.white('  Agent C starts as UNRATED.'));
  console.log(chalk.white('  Sending requests to capture behavior...\n'));

  for (let i = 1; i <= 15; i++) {
    try {
      await fetch(`${BASE_URL}/api/data`, {
        headers: { 'x-agent-wallet': AGENTS.C },
      });
      process.stdout.write(chalk.green('.'));
    } catch {
      process.stdout.write(chalk.red('x'));
    }
    await sleep(200);
  }
  console.log('\n');

  const updated = await api(`/trust/${AGENTS.C}`) as any;
  info('Agent C updated', `tier=${chalk.bold(updated.tier)}  score=${updated.score ?? 'N/A'}  multiplier=${updated.multiplier}x`);

  console.log('');
  console.log(chalk.green('  → Trust decisions come from the SDK.'));

  await sleep(2000);
}

// ─── Scene 4: Operator Control (30s) ───────────────────────────────

async function scene4(): Promise<void> {
  header('SCENE 4 — OPERATOR CONTROL');
  console.log(chalk.white('  Operator issues a directive via chat...\n'));
  const tellResult = await api('/chat/command', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: `tell ${AGENTS.E} reduce batch sizes` }),
  }) as any;
  info('Chat response', chalk.yellow(`[${tellResult.badge || 'QUERY'}] ${tellResult.response}`));

  console.log('');

  console.log(chalk.white('  Now degrading Agent D for burst behavior...\n'));
  const downgradeResult = await api('/chat/command', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: `downgrade ${AGENTS.D} burst behavior` }),
  }) as any;
  info('Chat response', chalk.yellow(`[${downgradeResult.badge}] ${downgradeResult.response}`));

  console.log('');
  await sleep(2000);
}

// ─── Main ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(chalk.bold.magenta('\n  ╔══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('  ║         MPP FIREWALL — LIVE DEMO                 ║'));
  console.log(chalk.bold.magenta('  ╚══════════════════════════════════════════════════╝\n'));

  try {
    await fetch(`${BASE_URL}/health`);
  } catch {
    console.log(chalk.red('  ✗ Firewall not running. Start with: pnpm dev'));
    process.exit(1);
  }

  // Seed agents first
  console.log(chalk.gray('  Seeding demo agents...'));
  await import('./seed-demo.js');
  await sleep(1000);

  await scene1();
  await scene2();
  await scene3();
  await scene4();

  console.log(chalk.bold.magenta('\n  ╔══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('  ║                    DEMO COMPLETE                  ║'));
  console.log(chalk.bold.magenta('  ╚══════════════════════════════════════════════════╝\n'));

  console.log(chalk.bold.white('  "SDK-backed trust gating + app-specific pricing = safer agent commerce."\n'));

  console.log(chalk.gray('  Dashboard: http://localhost:3000/mpp-firewall'));
  console.log(chalk.gray('  Firewall:  http://localhost:3010/status\n'));
}

main().catch(console.error);
