# Ant-Intelligence Skills(Agent Skills 公开分发仓)

vibe-eval 的两个 skill 公开分发仓,供 [skills CLI](https://github.com/vercel-labs/skills)(`npx skills`)一键安装。

## 安装

```bash
# 会话评分(评人):对 Claude Code 会话转录打分,L1–L4 四层 + 26 能力域中文评分卡
npx -y skills add Ant-Intelligence/public-skills --skill vibe-eval -g

# 项目评估(评项目):评估项目能否支撑「下一个不了解项目的 AI」接手开发
npx -y skills add Ant-Intelligence/public-skills --skill project-eval -g
```

`-g` 装到用户级(所有项目可用);去掉 `-g` 装当前项目。CLI 会自动识别本机
已装的 agent(Claude Code / Codex / Cursor / ZCode / Trae / OpenCode 等)并提示;
也可显式指定:`-a claude-code -a codex -a cursor -a zcode -a trae`,`-y` 免交互确认。
Windows 建议加 `--copy`,绕开 junction / 权限问题。

用户级落点(skills CLI 实测):

| Agent | Ubuntu / macOS | Windows |
|---|---|---|
| Claude Code | `~/.claude/skills/` | `%USERPROFILE%\.claude\skills\` |
| Codex | `~/.agents/skills/` | `%USERPROFILE%\.agents\skills\` |
| Cursor | `~/.agents/skills/`(也读 `~/.cursor/skills/`) | `%USERPROFILE%\.agents\skills\` |
| ZCode | `~/.zcode/skills/` | `%USERPROFILE%\.zcode\skills\` |
| Trae | `~/.trae/skills/` | `%USERPROFILE%\.trae\skills\` |

Trae CN 用 `~/.trae-cn/skills/`(`-a trae-cn`)。Cursor Cloud Agents 只同步
`~/.cursor/skills/`,要用云端 Cursor 需另外放一份到该目录。

## 更新 / 卸载

```bash
npx -y skills update vibe-eval -g      # 更新(project-eval 同理)
npx -y skills list -g                  # 查看已装
npx -y skills remove vibe-eval -g      # 卸载(project-eval 同理)
```

## 环境要求与兼容性(装前必读)

- **运行环境**:vibe-eval 1.0.0 起需要 **Node.js 18 或更高**,零第三方依赖,
  不再需要 Python。project-eval 仍是纯标准库 Python 脚本,需要 **Python 3.9+**:
  Ubuntu / macOS 用 `python3`;Windows 用 `py -3`(回退 `python`),路径加引号,
  并加 `-X utf8` 防中文乱码。
- **数据源边界:vibe-eval 只认 Claude Code 转录**(`~/.claude/projects/**/*.jsonl`;
  Windows 为 `%USERPROFILE%\.claude\projects\**\*.jsonl`)。装进 Codex / Cursor /
  ZCode / Trae 后 skill 能运行,但这些 agent 自己的会话转录不支持;没有 Claude
  Code 转录数据时会如实列空、打不了分。project-eval 评本地项目目录,任意 agent
  下语义一致。
- **数据交底(如实,不夸大)**:评分默认仅本地、零出网;上云是 opt-in——
  - project-eval 整包轨(`--upload`):上送最终报告与脱敏统计,密钥命中即拒传、
    零原文;链接只绑认领账号;
  - vibe-eval(`upload` 命令):上送最终报告全文(.md/.html)。报告里有会话的
    摘录片段。上传前引擎把用户目录路径和邮箱换成占位符,发现疑似密钥默认拒传;
  - 上云目标是 `http://123.207.204.220:8077`,走 **http 明文传输,未加密**。
- **skills CLI 的安装统计**:`npx skills add` 默认向 skills CLI 的作者发一次匿名
  安装统计(装了哪个仓、哪个 skill、哪些 agent)。这不是本仓的行为。不想发,
  先设 `DISABLE_TELEMETRY=1` 再装。

## vibe-eval 1.0.0 替换 0.4.4

0.4.4 的 vibe-eval(Python 版)已停用,1.0.0 替换它。1.0.0 是重写版:26 个能力域、
149 条检测项,由你正在用的 agent 在对话里逐域判定,引擎本身不调模型。

升级:再跑一次上面的安装命令,新版文件会替换旧版。旧版报告的分数和新版不能
直接比较,两版的检测项和打分规则不同。

## vibe-eval 1.0.1

1.0.1 修了取证:工具调用和结果按编号配对,打断只认用户按 ESC 或拒绝工具,
不再把系统插入的文字当成人发的消息,token 按回复编号去重,写文件的 heredoc
正文不再误报危险命令。L3 闸门只数真的框架调用(斜杠命令、`Skill` 工具、子代理
类型),命令文字里出现框架名不再算调用。检测项和量表没变。1.0.0 的报告和 1.0.1 的报告不能直接
比较。装过 1.0.0 的,跑 `npx -y skills update vibe-eval -g` 更新,再重新评一次。

## 版本与复核

本仓 tag(`vX.Y.Z`)与根目录 `manifest.json` 的 `release_version` 一致;
`manifest.json` 记录每个文件的 SHA-256,可逐文件复核镜像内容。1.0.0 起两个
skill 的版本号分开:vibe-eval 是 1.0.1,project-eval 仍是 0.4.4(本次未改动)。CI 每次推送在 Ubuntu 与 Windows 上自动做六 agent id 的安装冒烟
(五家 + OpenCode)。

## 平台验证面(如实)

vibe-eval 引擎是单个 Node.js 文件,project-eval 是纯 Python 标准库脚本,理论跨平台。本仓 CI 在 **Ubuntu 与 Windows** 上
验证:skills CLI 能把两个 skill 装进各 agent 用户级目录、装好的引擎能启动并
如实报告「无转录」。**agent 应用内**是否真的读取 SKILL.md 并执行,未做端到端
实测(CI 不运行这些 GUI/CLI agent);macOS 也未实测。遇到问题欢迎开 issue。
