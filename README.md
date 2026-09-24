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
已装的 agent(Claude Code / Codex / ZCode / Trae / OpenCode 等)并提示;
也可 `-a claude-code` 等显式指定,`-y` 免交互确认。

## 更新 / 卸载

```bash
npx -y skills update vibe-eval -g      # 更新(project-eval 同理)
npx -y skills list -g                  # 查看已装
npx -y skills remove vibe-eval -g      # 卸载(project-eval 同理)
```

## 环境要求与兼容性(装前必读)

- **Python 3.9+,零第三方依赖**:skill 本体是纯标准库 Python 脚本;skills CLI
  只是安装器,运行时不依赖 Node。
- **数据源边界:vibe-eval 只认 Claude Code 转录**(`~/.claude/projects/**/*.jsonl`)。
  装进 Codex / ZCode / Trae 等其它 agent 后 skill 能运行,但那些环境里没有
  Claude Code 转录数据时会如实列空、打不了分。project-eval 评本地项目目录,
  任意 agent 下语义一致。
- **数据交底(如实,不夸大)**:评分默认仅本地、零出网;上云是 opt-in——
  - project-eval 整包轨(`--upload`):上送最终报告与脱敏统计,密钥命中即拒传、
    零原文;链接只绑认领账号;
  - 会话 / 文档轨(`upload_report.py` 桥):上送最终报告全文(.md/.html),
    **桥不做自动密钥拦截**,上云前请自行确认报告不含密钥原文;
  - 上云目标是 `http://123.207.204.220:8077`,走 **http 明文传输,未加密**。

## 版本与复核

本仓 tag(`vX.Y.Z`)与 skill 引擎发布号一致(单仓单 tag,两 skill 随同一
发布号重发);根目录 `manifest.json` 记录每个文件的 SHA-256 与版本,可逐文件
复核镜像内容。CI 每次推送自动做五 agent 安装冒烟。

## 平台验证面(如实)

skill 脚本纯 Python 标准库,理论跨平台;本仓发布验证目前覆盖 Linux,
**macOS 与 Windows 未实测**。遇到问题欢迎开 issue。
