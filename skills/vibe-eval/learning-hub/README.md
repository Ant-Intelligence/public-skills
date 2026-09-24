# learning-hub · Vibe Eval 学习知识库

发现能力薄弱域后，报告的「查看证据 → 推荐学习」会指到这里：**配套模块**（教你这一类怎么把 Claude Code 用得更好）+ **匹配课程**（外部学习资源）。

本目录**与评分引擎解耦**——评分逻辑在 `mvp/`，本目录只放「学什么、去哪学」的内容与数据，团队可直接维护，不必碰代码。

## 结构

```
learning-hub/
├── courses.json                  # 课程库 + 「能力域 → 模块」映射(数据,团队维护)
├── README.md                     # 本文件
├── intent-and-planning/index.html   # 模块教程(样板已完成)
├── context-and-boundaries/index.html
├── explore-and-tools/index.html
├── debug-and-recovery/index.html
├── verify-and-quality/index.html
├── security-and-supply-chain/index.html
├── cost-and-efficiency/index.html
└── collaboration-and-knowledge/index.html
```

模块按 ~8 个**主题**划分（一个主题覆盖若干能力域），映射见 `courses.json` 的 `modules`。目前 `intent-and-planning` 为完整样板，其余为占位，逐步补齐。

## 怎么维护

**加一门课 / 一个学习资源**：往 `courses.json` 的 `courses[]` 加一条：

```json
{
  "id": "唯一短id",
  "title": "课程名",
  "url": "https://…",
  "price": "免费 / ¥199 / $49 等",
  "provider": "Coursera / Udemy / B站 / 极客时间 / 某开源项目 …",
  "kind": "doc | article | course | oss | skill | site",
  "domains": ["A1", "B3"],          // 这门课覆盖哪些能力域码(见报告)
  "note": "一句话:它对哪块薄弱最对症"
}
```

报告会自动把它推荐给 `domains` 命中的薄弱域。**价格/链接请以官网为准并人工复核**（尤其平台课程）。

**加一个模块**：往 `courses.json` 的 `modules` 加一项（键=文件夹名，值含 `title` 和覆盖的 `domains`），并在本目录建同名文件夹 + `index.html`（照 `intent-and-planning/index.html` 的样板写）。

## 能力域码对照

A1–A4=基础技巧(L1)，B0–B10=工程与风险(L2)，C1–C6=组织杠杆(L3)。完整定义见 `docs/evaluation-system.md`（第一部分与附录 A）。
