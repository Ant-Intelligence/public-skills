# vibe-eval —— AI 编程 agent 技能包(interim 版)

一个技能包承载两条评估线:**vibe-eval 评人**(驾驭 AI 编程助手的水平)与
**project-eval 评项目**(项目能否让新 AI 接手;当前上线其文档轨 doc-eval)。
装进你的 AI 编程 agent(Claude Code / Codex / Cursor / Trae / Qoder / zcode 等),
之后在 agent 里说「评一下我这次 AI 编程的表现」「评估这个项目/这份文档能不能让 AI 接手」,
agent 就会在本地跑评分、把报告递给你 —— **默认仅本地、零出网**;要不要上云换访问
链接由 agent 询问你,**你同意才上**(说「仅本地」则连问都不问)。

## 包装了什么

| 文件 | 作用 |
|---|---|
| `SKILL.md` | **技能定义**(agent 读的规程:何时触发、跑什么命令、怎么上云) |
| `score_session.py` | 评分内核单文件 CLI(vibe-eval 会话评分 + project-eval 文档轨 doc-eval) |
| `domain_content.py` | 能力域文案(缺失也能跑,报告只少润色) |
| `upload_report.py` | 上云桥(经用户同意后由 agent 执行的显式 opt-in 上传件) |
| `learning-hub/` | 学习课件目录(courses.json + 各能力域配套模块页);Learning Center 用它把薄弱域模块内联进 HTML 评分卡 |

零第三方依赖,Python 3.9+。评分引擎纯本地、零联网:会话轨离线确定性;**doc-eval
语义轨 = 「导出-灌回」**(引擎 `--judge-export` 出评审包 → coding agent 按包内
提示词就地评 → `--judge-import` 灌回出分;D3 语义判定同一机制),全程零端点、
零 API key;显式 `--offline` 或未灌回时走结构轨(报告明示)。唯一出网动作
「上云换链接」是 opt-in:默认不做,你同意才上(上云由桥
`upload_report.py` 执行;project-eval 整包轨另可用 `--upload` 旗标显式选择)。

## 安装到各家 agent

**Claude Code**(原生支持 skills,体验最好):

```bash
mkdir -p ~/.claude/skills
cp -r vibe-eval ~/.claude/skills/        # 整个目录拷进去
# 之后在 Claude Code 里:/vibe-eval 或直接说「评一下我这次 vibe coding」
```

**Codex**:把 `SKILL.md` 的正文(frontmatter 以下)追加到项目根的 `AGENTS.md`
(或 `~/.codex/AGENTS.md` 全局),并把本目录拷到项目里;Codex 读到规程后
按里面的命令执行。也可以直接对它说「读 vibe-eval/SKILL.md 并按它评一次」。

**Cursor**:`.cursor/rules/` 下建 `vibe-eval.mdc`,把 SKILL.md 正文粘进去,
`globs` 留空、勾 `Always Apply` 或按需手动引用;脚本目录拷进项目。

**Trae / Qoder / zcode**:这些 IDE 都支持自定义规则/指令文件,把 SKILL.md
正文放进各自的「自定义规则」(如 Trae 的 `user_rules` / 项目规则)即可;
或者直接对 agent 说「读 vibe-eval/SKILL.md,按里面的步骤给我评估」。

> 通用兜底:任何 agent,直接把 `SKILL.md` 喂给它(「读这个文件并照做」)就能跑通。

## 一句话验证装好了

对 agent 说:**「评估一下我最近这次 AI 编程会话」**。
agent 应该跑 `score_session.py` 给你 `./vibe-eval-reports/` 下的 `.md` + `.html`
中文评分卡(**到此为止即默认行为:仅本地、零出网**),并询问要不要上云换链接;
你同意后 agent 才跑 `upload_report.py`(md + html 一起上送)递给你
`http://123.207.204.220:8077/link/<token>`。链接页 ⑧ 整页新页打开与本地一致的
HTML5 渲染版评分卡(沙箱语义由 CSP sandbox 响应头实现;即你本地双击 `.html`
看到的那个样式)。

打开链接的绑定规则:**已登录**(非 admin)→ 打开即**自动认领**并直出全文(免确认页;
admin 登录态只读、不占名额);**未登录** → 页面要求先登录/注册,登录后再次打开即
自动绑定到该账号。绑定后一链接只属该账号,别人打开不可读。
(上云永远是 opt-in:对 agent 说「仅本地」则不上云,连询问都省去。)

## 须知

- 会话评分**目前只认 Claude Code 转录**;其它 agent 用户可走 project-eval 的文档轨 doc-eval(评项目文档)。
- HTML 评分卡的 **Learning Center** 会按薄弱能力域(score < 70)内联配套学习模块;课件目录随本包分发(`learning-hub/`),别删。若被删,报告不崩,但学习中心退化为「薄弱域清单」兜底、不再内联模块。
- 文档轨支持:单份文档、**文档集 zip/目录整包**(跨文档贯通)、**五阶段验收**(通用/需求碰头/PRD/开发文档/测试文档,`--stage` 选);产出总分 + 接手等级 L4~L0 + 缺口清单 P0~P2。
- project-eval 的**工程设施轨**(agents / hooks / settings / skills 静态检查)规划中未上线,当前只能跑文档轨。
- 会话评分默认离线确定性;语义判定 = 「导出-灌回」两步(`--judge-export` 出评审包 → coding agent 按包内提示词就地评 → `--judge-import` 灌回出分;doc-eval 同一机制),全程零联网、零端点、零 API key;显式 `--offline` 或未灌回时走结构轨:DQ4 记缺口、接手等级记 U、结构分封顶 69,报告与终端明示「未接语义轨 · 结构分不具承载力含义」,语义轨可随时用导出-灌回补上。
- 上云 = opt-in(本包上云只走桥 `upload_report.py`,经 agent 询问、你同意才执行):桥上送**最终报告全文(.md + .html),桥不做自动密钥拦截 —— 上云前请自行确认报告不含密钥原文**;不上传任何源代码、原始数据、原始转录;链接只绑认领账号。
- 上云走 **http 明文传输,未加密**;上云载荷即报告内容,敏感项目建议保持默认仅本地。
- 链接页的 HTML5 渲染版整页新页打开(沙箱语义由 CSP sandbox 响应头实现):报告自带 JS 可跑,但摸不到页面登录态(Cookie/DOM 隔离)。
- 链接 30 天有效,一链接绑一账号;限速 30 次/时/IP,单载荷 ≤256KB。
- 这是 interim 形态:正式 SKILL.md 规程(Story 4.1)在立项会后定稿,届时本包升级。
