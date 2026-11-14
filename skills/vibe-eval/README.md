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
| Kimi Code(`-a kimi-code-cli`) | `~/.agents/skills/vibe-eval/` | `<项目>/.agents/skills/vibe-eval/` |
| Pi(`-a pi`) | `~/.pi/agent/skills/vibe-eval/` | `<项目>/.pi/skills/vibe-eval/` |
| ZCode | `~/.zcode/skills/vibe-eval/` | `<项目>/.zcode/skills/vibe-eval/` |
| CodeBuddy(`-a codebuddy`) | `~/.codebuddy/skills/vibe-eval/` | `<项目>/.codebuddy/skills/vibe-eval/` |
| Qoder(`-a qoder`) | `~/.qoder/skills/vibe-eval/` | `<项目>/.qoder/skills/vibe-eval/` |
| Trae(`-a trae`) | `~/.trae/skills/vibe-eval/` | `<项目>/.trae/skills/vibe-eval/` |
| Trae 国内版(`-a trae-cn`) | `~/.trae/skills/vibe-eval/` | `<项目>/.trae/skills/vibe-eval/` |

装进几个助手时,`skills` 把文件放在 `~/.agents/skills/vibe-eval/` 一份,其他助手的目录是指向它的软链接。

**同时用 Pi 和 DeepSeek harness(`dsh`)时,装一条命令就够:**

```bash
npx -y skills add Ant-Intelligence/public-skills --skill vibe-eval -g -a pi -a kimi-code-cli
```

- `-a pi` 放到 `~/.pi/agent/skills/vibe-eval/`,Pi 读这里。
- `-a kimi-code-cli` 放到 `~/.agents/skills/vibe-eval/`。dsh 读这个目录,`skills` 没有单给 dsh 的安装项。

两个目录都放好了,两家就都能用。装完重启助手。

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

主流程四步:找到当前项目的全部会话 → 取证 → 判定 → 出报告。助手和项目都由引擎自己认,用户不用选。判定由助手在对话里完成,引擎不调模型。

一个项目常有好几个会话。默认把这个项目在这家助手里的会话全部评,不是只评一个。

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

可以读七家助手的会话记录。读哪一家,引擎自己认:按环境变量认出你在哪个助手里跑,再按文件路径认记录属于谁。用户不用选。

| 助手 | `--agent` 值 | 记录在哪 |
|---|---|---|
| Claude Code | `claude-code` | `~/.claude/projects/`,环境变量 `CLAUDE_CONFIG_DIR` 可改 |
| Kimi Code | `kimi-code` | `~/.kimi-code/`,环境变量 `KIMI_CODE_HOME` 可改 |
| Pi | `pi` | `~/.pi/agent/sessions/`,环境变量 `PI_CODING_AGENT_DIR` 可改 |
| DeepSeek harness | `dsh` | `~/.dsh/`,环境变量 `DSH_HOME` 可改 |
| CodeBuddy | `codebuddy` | `~/.codebuddy/`,环境变量 `CODEBUDDY_CONFIG_DIR` 可改 |
| Trae | `trae` | `~/.cache/coco/`(Linux),环境变量 `XDG_CACHE_HOME` 可改 |
| Qoder | `qoder` | `~/.qoder/`、`~/.qoder-cn/` |

`--agent` 不用自己写。`current` 和 `coll-list` 打出来的命令里已经带好了。不写时引擎按路径自动认:路径在哪家的记录目录底下,就是哪家;给的是项目目录,就看哪家有这个项目的记录。

Claude Code 的多账号用逗号分隔。Windows 上 Claude Code 的记录在 `%USERPROFILE%\.claude\projects\`。WSL 读 Windows 侧用 `CLAUDE_CONFIG_DIR=/mnt/c/Users/<用户名>/.claude`。

**想先看看会评什么,跑 `current`:**

```bash
node ~/.claude/skills/vibe-eval/bin/vibe-eval.js current
```

它认出你在哪个助手里跑,再找出当前项目在这家的全部会话。输出像这样:

```
当前助手 Pi
认法 正在用的助手(按环境变量认出)
项目 /home/alice/shop
会话 12 个,全部评
另有 1 家助手也有这个项目的记录(最近用过的排前面):
  DeepSeek harness · 3 个会话 → evidence "/home/alice/shop" --agent dsh
下一步 evidence "/home/alice/shop" --agent pi
```

想评别的项目,跑 `coll-list`。它把七家的项目都列出来,每个项目下面写好了评它的命令。

**Trae 的记录格式还没对着真实记录核对过。** 读取器按 TRAE CLI 程序里的字段名写。报告里 Trae 后面标「试用」,报告里也会写明这一点。拿到真实记录核对之前,别拿 Trae 的分数定级。

**DeepSeek harness 的插件 `dsh-session-log-deepseek` 会把会话记录上传到 DeepSeek。** 那是 dsh 自己的行为,和本 skill 无关。本 skill 只读本地文件。

版本 1.1.1 · 口径 10 · 量表 v2
