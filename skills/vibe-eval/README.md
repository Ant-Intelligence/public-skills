# vibe-eval 用户手册

评估**人**驾驭 AI 编程助手的水平。不评代码质量,不跑被评项目。

## 安装

```bash
npx -y skills add Ant-Intelligence/public-skills --skill vibe-eval -g
```

`skills` 是一个开源的安装工具(<https://github.com/vercel-labs/skills>),它从 GitHub 仓 `Ant-Intelligence/public-skills` 取文件,装进本机的 AI 编程助手。

- `-g` 装到用户目录,所有项目都能用。去掉 `-g`,只装到当前项目。
- 它会自动找本机装了哪些助手。也可以用 `-a` 指定,例如 `-a claude-code -a codex`。
- `-y` 不再逐项确认。
- Windows 建议加 `--copy`,直接复制文件,不建链接。

注意:`skills` 安装时默认向它的作者发一次匿名安装统计(装了哪个仓、哪个 skill、哪些助手)。不想发,先设 `DISABLE_TELEMETRY=1` 再装。

装完重启助手,在对话里说「用 vibe-eval 评一下」。

## 装在哪

| 助手 | 用户级(`-g`) | 项目级 |
|---|---|---|
| Claude Code | `~/.claude/skills/vibe-eval/` | `<项目>/.claude/skills/vibe-eval/` |
| Codex | `~/.agents/skills/vibe-eval/` | `<项目>/.agents/skills/vibe-eval/` |
| Cursor | `~/.agents/skills/vibe-eval/` | `<项目>/.agents/skills/vibe-eval/` |
| ZCode | `~/.zcode/skills/vibe-eval/` | `<项目>/.zcode/skills/vibe-eval/` |
| Trae | `~/.trae/skills/vibe-eval/` | `<项目>/.trae/skills/vibe-eval/` |
| Trae 国内版(`-a trae-cn`) | `~/.trae-cn/skills/vibe-eval/` | `<项目>/.trae/skills/vibe-eval/` |

装进几个助手时,`skills` 把文件放在 `~/.agents/skills/vibe-eval/` 一份,其他助手的目录是指向它的软链接。

## 更新、查看、卸载

```bash
npx -y skills update vibe-eval -g   # 更新到仓里的最新版
npx -y skills list -g               # 看装了哪些
npx -y skills remove vibe-eval -g   # 卸载
```

## 从 0.4.4 升级

旧版 0.4.4 用 Python。1.0.0 起改用 Node.js,不再需要 Python。直接跑上面的安装命令,新版会替换旧版的文件。

旧版报告的分数和新版不能直接比较。两版的检测项和打分规则不同。

1.0.0 的报告和 1.0.1 的报告也不能直接比较。1.0.1 修了取证,判定时看到的证据不一样。装过 1.0.0 的,跑 `npx -y skills update vibe-eval -g` 更新,再重新评一次。

## 装好之后怎么用

在助手里说「用 vibe-eval 评一下」。Claude Code 里也可以输入 `/vibe-eval`。

主流程四步:选项目 → 取证 → 判定 → 出报告。判定由助手在对话里完成,引擎不调模型。

报告写到 `./vibe-eval-reports/`,有 `.md` 与 `.html` 两份。HTML 带证据抽屉,能看到每个域的判分依据。

## 环境自检

```bash
node ~/.claude/skills/vibe-eval/bin/vibe-eval.js doctor
```

路径换成你的助手的落点。需要 Node.js 18 或更高。

## 安全

- 默认不联网。报告生成后,助手会问一次要不要上传。
- 上传的是整份报告。报告里有会话的摘录片段。上传前引擎会把用户目录路径和邮箱换成占位符,发现疑似密钥就拒绝上传。
- 传输走 http 明文,不加密。敏感项目选「仅本地」。
- 引擎只读会话记录,从不修改它们。

## 离线安装

```bash
# 有网的机器上
git clone https://github.com/Ant-Intelligence/public-skills.git
# 把 public-skills 目录拷到目标机器,然后在目标机器上
npx -y skills add ./public-skills --skill vibe-eval -g
```

目标机器上的 `npx` 也要能取到 `skills` 这个包。完全断网时,直接把 `public-skills/skills/vibe-eval/` 整个目录拷到上面表里的落点。

## 数据源

只认 Claude Code 的会话记录:`~/.claude/projects/**/*.jsonl`。
Windows:`%USERPROFILE%\.claude\projects\`。
WSL 读 Windows 侧:`CLAUDE_CONFIG_DIR=/mnt/c/Users/<用户名>/.claude`。
多账号用逗号分隔。

版本 1.0.1 · 口径 9
