#!/usr/bin/env node
// vibe-eval 安装器。只列我们支持的 AI 编程助手,勾选后把 skills/vibe-eval/ 拷到对应目录。
// 零依赖。Node 18 以上可用。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'skills', 'vibe-eval');
const VERSION = readRootVersion();

// 我们支持的助手。dir 是 skills 目录,同一目录的助手合成一行,只拷一次。
const TARGETS = [
  { key: 'claude-code', label: 'Claude Code', dir: (h) => path.join(h, '.claude', 'skills'), pdir: '.claude/skills' },
  { key: 'agents', alias: ['codex', 'cursor', 'kimi-code', 'kimi-code-cli', 'universal', 'dsh'], label: 'Codex / Cursor / Kimi Code / DeepSeek harness', dir: (h) => path.join(h, '.agents', 'skills'), pdir: '.agents/skills' },
  { key: 'zcode', label: 'ZCode', dir: (h) => path.join(h, '.zcode', 'skills'), pdir: '.zcode/skills' },
  { key: 'trae', label: 'Trae', dir: (h) => path.join(h, '.trae', 'skills'), pdir: '.trae/skills' },
  { key: 'trae-cn', label: 'Trae 国内版', dir: (h) => path.join(h, '.trae-cn', 'skills'), pdir: '.trae/skills' },
  { key: 'pi', label: 'Pi', dir: (h) => path.join(h, '.pi', 'agent', 'skills'), pdir: '.pi/skills' },
  { key: 'codebuddy', label: 'CodeBuddy', dir: (h) => path.join(h, '.codebuddy', 'skills'), pdir: '.codebuddy/skills' },
  { key: 'qoder', label: 'Qoder', dir: (h) => path.join(h, '.qoder', 'skills'), pdir: '.qoder/skills' },
  { key: 'qoder-cn', label: 'Qoder 国内版', dir: (h) => path.join(h, '.qoder-cn', 'skills'), pdir: '.qoder/skills' },
];

function readRootVersion() {
  try {
    return JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8')).version || '';
  } catch {
    return '';
  }
}

function parseArgs(argv) {
  const out = { project: false, list: false, yes: false, agents: null, help: false, version: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project' || a === '-p') out.project = true;
    else if (a === '--list' || a === '-l') out.list = true;
    else if (a === '--yes' || a === '-y') out.yes = true;
    else if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--version' || a === '-v') out.version = true;
    else if (a === '--agents' || a === '-a') out.agents = (argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (a.startsWith('--agents=')) out.agents = a.slice(9).split(',').map((s) => s.trim()).filter(Boolean);
    else {
      console.error(`error[E_USAGE] 不认识的参数:${a}。 跑 --help 看用法。`);
      process.exit(1);
    }
  }
  return out;
}

function rows(project) {
  const home = os.homedir();
  const cwd = process.cwd();
  const list = [];
  const byDir = new Map();
  for (const t of TARGETS) {
    const dir = project ? path.join(cwd, t.pdir) : t.dir(home);
    const abs = path.resolve(dir);
    const key = abs.toLowerCase();
    let row = byDir.get(key);
    if (!row) {
      row = { dir: abs, labels: [], keys: [] };
      byDir.set(key, row);
      list.push(row);
    }
    row.labels.push(t.label);
    row.keys.push(t.key);
  }
  return list;
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function isInstalled(dir) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dir, 'vibe-eval', 'manifest.json'), 'utf8'));
    return m && m.name === 'vibe-eval';
  } catch {
    return false;
  }
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const ent of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, ent.name);
    const d = path.join(to, ent.name);
    if (ent.isDirectory()) copyTree(s, d);
    else if (ent.isSymbolicLink()) fs.symlinkSync(fs.readlinkSync(s), d);
    else fs.copyFileSync(s, d);
  }
}

function verifyInstalled(dir, manifest) {
  const bad = [];
  for (const f of manifest.files || []) {
    const p = path.join(dir, f.path);
    let buf;
    try {
      buf = fs.readFileSync(p);
    } catch {
      bad.push(f.path);
      continue;
    }
    if (sha256(buf) !== f.sha256) bad.push(f.path);
  }
  return bad;
}

function installOne(dir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(SRC, 'manifest.json'), 'utf8'));
  const target = path.join(dir, 'vibe-eval');
  fs.mkdirSync(dir, { recursive: true });
  if (isInstalled(dir)) {
    const bad = verifyInstalled(target, manifest);
    const sameVersion = readVersion(target) === manifest.version;
    if (bad.length === 0 && sameVersion) return { dir: target, action: 'skip' };
  }
  const tag = `${process.pid}-${Date.now()}`;
  const tmp = `${target}.tmp-${tag}`;
  const bak = `${target}.bak-${tag}`;
  fs.rmSync(tmp, { recursive: true, force: true });
  copyTree(SRC, tmp);
  const bad = verifyInstalled(tmp, manifest);
  if (bad.length > 0) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw new Error(`复制后校验失败:${bad.slice(0, 3).join(', ')}`);
  }
  let action = 'install';
  if (exists(target)) {
    fs.renameSync(target, bak);
    action = 'update';
  }
  try {
    fs.renameSync(tmp, target);
  } catch (e) {
    if (exists(bak)) fs.renameSync(bak, target);
    throw e;
  }
  if (exists(bak)) fs.rmSync(bak, { recursive: true, force: true });
  return { dir: target, action };
}

function readVersion(skillDir) {
  try {
    return JSON.parse(fs.readFileSync(path.join(skillDir, 'manifest.json'), 'utf8')).version || '';
  } catch {
    return '';
  }
}

function label(row) {
  return row.labels.join(' / ');
}

function printList(list, project) {
  console.log(project ? '当前项目里的落点:' : '用户级落点(所有项目可用):');
  list.forEach((r, i) => {
    const mark = isInstalled(r.dir) ? '已装' : '未装';
    console.log(`  ${i + 1}) ${label(r)}  →  ${r.dir}  [${mark}]`);
  });
}

function chooseInteractive(list) {
  const state = list.map(() => false);
  let cur = 0;
  for (let i = 0; i < list.length; i++) if (isInstalled(list[i].dir)) state[i] = true;
  const detected = state.some(Boolean);

  const out = process.stdout;
  const HEAD = 3;
  let drawn = 0;

  function render() {
    const lines = [];
    lines.push('');
    lines.push(`vibe-eval ${VERSION} · 选要装到哪些 AI 编程助手`);
    lines.push('  空格 勾选/取消 · ↑↓ 移动 · a 全选 · 回车 安装 · q 退出');
    list.forEach((r, i) => {
      const box = state[i] ? '[x]' : '[ ]';
      const ptr = i === cur ? '❯' : ' ';
      const mark = isInstalled(r.dir) ? '(已装) ' : '';
      lines.push(`${ptr} ${box} ${mark}${label(r)}`);
    });
    lines.push(`  装到:${list[cur] ? list[cur].dir : ''}`);
    if (drawn > 0) out.write(`\x1b[${drawn}A`);
    for (const l of lines) out.write('\x1b[2K' + l + '\n');
    drawn = lines.length;
  }

  return new Promise((resolve) => {
    if (!detected) {
      console.log('本机没发现已装的助手。用空格勾选,回车安装。');
    }
    out.write('\x1b[?25l');
    render();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    function finish(code, picked) {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      out.write('\x1b[?25h');
      resolve(code === 0 ? picked : null);
    }

    process.stdin.on('data', (chunk) => {
      for (let i = 0; i < chunk.length; i++) {
        const ch = chunk[i];
        if (ch === '\x1b') {
          const seq = chunk.slice(i, i + 3);
          if (seq === '\x1b[A') {
            cur = (cur - 1 + list.length) % list.length;
            i += 2;
          } else if (seq === '\x1b[B') {
            cur = (cur + 1) % list.length;
            i += 2;
          } else {
            i += 2;
          }
          render();
          continue;
        }
        if (ch === '\x03' || ch === 'q' || ch === 'Q') {
          finish(1, null);
          return;
        }
        if (ch === ' ') {
          state[cur] = !state[cur];
          render();
        } else if (ch === 'k' || ch === 'K') {
          cur = (cur - 1 + list.length) % list.length;
          render();
        } else if (ch === 'j' || ch === 'J') {
          cur = (cur + 1) % list.length;
          render();
        } else if (ch === 'a' || ch === 'A') {
          const allOn = state.every(Boolean);
          state.fill(!allOn);
          render();
        } else if (ch === '\r' || ch === '\n') {
          const picked = list.filter((_, i) => state[i]);
          if (picked.length === 0) {
            out.write('\x1b[2K\x1b[1A\x1b[2K');
            out.write('  一个都没勾。用空格勾选,或按 q 退出。\n');
            drawn -= 1;
            continue;
          }
          render();
          finish(0, picked);
          return;
        }
      }
    });
  });
}

const ALIASES = new Map();
for (const t of TARGETS) for (const a of t.alias || []) ALIASES.set(a, t.key);

function byKeys(list, keys) {
  const out = [];
  for (const k of keys) {
    const hit = list.find((r) => r.keys.includes(k) || ALIASES.get(k) && r.keys.includes(ALIASES.get(k)));
    if (!hit) {
      console.error(`error[E_USAGE] 不认识的助手:${k}。 支持:${TARGETS.map((t) => t.key).join(', ')}。`);
      process.exit(1);
    }
    if (!out.includes(hit)) out.push(hit);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`用法:npx -y github:Ant-Intelligence/public-skills [选项]

不带选项:打开勾选列表,只列我们支持的 AI 编程助手。

  -p, --project        装到当前项目,不装到用户目录
  -a, --agents a,b     不打开列表,直接按名字装;名字见 --list
  -y, --yes            不再逐项确认
  -l, --list           列出落点,不安装
  -v, --version        打版本号
  -h, --help           打这段说明

支持的助手:${TARGETS.map((t) => `${t.label}(${t.key})`).join('、')}`);
    return 0;
  }
  if (args.version) {
    console.log(`vibe-eval ${VERSION}`);
    return 0;
  }
  if (!exists(path.join(SRC, 'manifest.json'))) {
    console.error('error[E_NO_SOURCE] 找不到 skills/vibe-eval/。 请重新跑安装命令。');
    return 2;
  }
  const list = rows(args.project);
  if (args.list) {
    printList(list, args.project);
    return 0;
  }

  let picked;
  if (args.agents) {
    picked = byKeys(list, args.agents);
  } else if (process.stdin.isTTY && process.stdout.isTTY) {
    picked = await chooseInteractive(list);
    if (!picked) {
      console.log('已退出,什么都没装。');
      return 1;
    }
  } else {
    picked = list.filter((r) => isInstalled(r.dir));
    if (picked.length === 0) {
      console.error('error[E_NO_STDIN] 这里没有可勾选的终端。 加 -a <助手名>,名字见 --list。');
      return 1;
    }
    console.log('没有可勾选的终端,只更新本机已装的落点。要装新的落点,加 -a <助手名>。');
  }

  console.log('');
  console.log(`要装 ${picked.length} 处:`);
  for (const r of picked) console.log(`  ${label(r)}  →  ${path.join(r.dir, 'vibe-eval')}`);
  if (!args.yes && !(args.agents && !process.stdin.isTTY)) {
    // 交互模式已由回车确认;这里只对 --agents 的非交互场景再问一句
  }

  const results = [];
  let failed = 0;
  for (const r of picked) {
    try {
      results.push(installOne(r.dir));
    } catch (e) {
      failed++;
      console.error(`  ✗ ${r.dir}:${e.message}`);
    }
  }
  console.log('');
  for (const r of results) {
    const word = r.action === 'skip' ? '已是这一版,跳过' : r.action === 'update' ? '已更新' : '已安装';
    console.log(`  ✓ ${word}  ${r.dir}`);
  }
  if (results.length > 0) console.log(`\nvibe-eval ${VERSION} 装好 ${results.length} 处。重新打开助手,在对话里说「用 vibe-eval 评一下」。`);
  return failed > 0 ? 2 : 0;
}

main().then((code) => process.exit(code), (e) => {
  console.error(`error[E_INSTALL] ${e && e.message ? e.message : e}。 没装完,已装的目录保持原样。`);
  process.exit(2);
});
