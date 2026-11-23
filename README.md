# Ant-Intelligence Skills(Agent Skills 公开分发仓)

Ant-Intelligence 的 skills 公开分发仓。vibe-eval 自带安装器(`npx -y github:Ant-Intelligence/public-skills`),只列我们支持的 AI 编程助手;也可以用 [skills CLI](https://github.com/vercel-labs/skills)(`npx skills`)安装。

## 安装

vibe-eval(会话评分,评人):一条命令,出现勾选列表,勾你要装到哪几个 AI 编程助手,回车。

```bash
npx -y github:Ant-Intelligence/public-skills
```

列表里只有我们支持的 9 个落点:Claude Code、Codex / Cursor / Kimi Code / DeepSeek harness、ZCode、Trae、Trae 国内版、Pi、CodeBuddy、Qoder、Qoder 国内版。本机已经装过的那几行会先勾上。零依赖,Node 18 以上可用。装之前逐份核对 sha256,对不上就整份不装。

- 空格 勾选 / 取消,↑↓ 移动,a 全选,回车安装,q 退出。
- `-p` 装到当前项目;`-a claude-code,pi` 不开列表直接装;`-l` 只列落点。
- 往每个勾选的目录各拷一份完整文件,不建软链接,Windows 上不用额外加参数。

项目评估(评项目)仍用 `skills` 安装:

```bash
npx -y skills add Ant-Intelligence/public-skills --skill project-eval -g
```

`skills` 是 [skills CLI](https://github.com/vercel-labs/skills)。vibe-eval 也可以用它装(`npx -y skills add Ant-Intelligence/public-skills --skill vibe-eval -g`),效果一样;区别是它的勾选列表是它自己写死的,有 50 多个助手,不是只列我们支持的这几家。

`-g` 装到用户级(所有项目可用);去掉 `-g` 装当前项目。Windows 建议加 `--copy`。

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
- **数据源边界**:vibe-eval 1.1.0 起读七个助手命令行版的会话记录:Claude Code、
  Kimi Code、Pi、DeepSeek harness(`dsh`)、CodeBuddy、Trae、Qoder。编辑器版的
  聊天记录读不了。Codex / Cursor / ZCode 里也能跑这个 skill,但它们自己的会话记录
  不支持;本机没有这七家的记录时会如实列空、打不了分。project-eval 评本地项目
  目录,任意 agent 下语义一致。
- **数据交底(如实,不夸大)**:评分默认仅本地、零出网;上云是 opt-in——
  - project-eval 整包轨(`--upload`):上送最终报告与脱敏统计,密钥命中即拒传、
    零原文;链接只绑认领账号;
  - vibe-eval(`upload` 命令):上送最终报告全文(.md/.html)。报告里有会话的
    摘录片段。上传前引擎把用户目录路径和邮箱换成占位符,发现疑似密钥默认拒传;
  - 上云目标是 `http://123.207.204.220:8077`,走 **http 明文传输,未加密**。
- **skills CLI 的安装统计**:`npx skills add` 默认向 skills CLI 的作者发一次匿名
  安装统计(装了哪个仓、哪个 skill、哪些 agent)。这不是本仓的行为。不想发,
  先设 `DISABLE_TELEMETRY=1` 再装。

## vibe-eval 1.1.7

这一版重写报告末尾的学习区域,教你怎么补低分的域。**评分规则从 12 升到 13,分数不能和 1.1.5 直接比较。** 算分公式没改,26 份量表一个字没改,量表版本仍是 2。规则号要升,是因为判分的模型现在要多写一样东西(每条扣分的原因),判出来的结果可能跟着变。1.1.6 没有单独发布,它的改动都在这一版里。

- **得分低于 60 分的域,报告会指出问题在哪。** 在能力层那一章,每个低分域下面列出没做到、只做到一部分的检测项。重点项排在前面,每域最多列 5 条。
- **报告末尾多一个「学习区域」。** 每个低分域列最该补的 3 条,最多展开 6 个域。Markdown 里放在「说明」之后,是最后一节;HTML 里叫「学习中心」。
- **每条写三样:扣分原因、为什么要紧、怎么提高。** 扣分原因由判分的模型对着会话记录写,带证据编号,你能回去查是哪一段。判分时没写这一条的,报告写一句话,指向这个域的判分理由。「为什么要紧」和「怎么提高」149 条检测项都写好了,每份报告都一样。
- **每个低分域多一行「这个域补到 100 分,总分能多几分」。** 先补哪个域,看这一行。
- 「怎么提高」以 Claude Code 为例。用别的助手,照着做,意思一样。
- L3 没过闸门时,C 域不进学习区域。闸门没过,L3 加分本来就是 0。
- 上传时报告超过 200KB,会先裁掉 HTML 的学习中心,其余照传,不报错。

**判分稳不稳,只测了一部分,结果没达标。** 测法:同一份记录让三个独立的判分各判一次。档位三次都相同;但 26 个域里,只有一半在三次之间分差不超过 8 分,要求是 90%。另外造了 6 份明显差的记录,全部落在 D 档(23 到 48 分),这一项通过。这些测试按评分规则 12 做,规则 13 还没重测。和客户自评对照、跨档对比、分数与记录长度的关系,都没测。结论只对判定宿主 `claude-code`、判定模型 `claude-sonnet-5-5` 成立。**总分可以当趋势看,域分和档位不要直接拿来定级。**

更新:再跑一次 `npx -y github:Ant-Intelligence/public-skills`。已装的落点会先勾上,直接回车。

## vibe-eval 1.1.5

1.1.5 改了 L3 闸门怎么数 skill 调用。**口径 11 → 12,分数不可直接比较**:1.1.4 及更早的报告和 1.1.5 的报告不能直接比,要看分数变化,用 1.1.5 重跑一遍。

同一批记录重评后,过闸门的会话会变多,L3 加分可能从 0 变成正分。

- 以前只认已知的 skill 包名(superpowers、bmad、gsd 这类)。名字对不上就一次都不算,自己写或团队自建的 skill 装了也白装。现在反过来:任何一次真的 skill 调用都数。
- 只有助手自带的命令不算:clear、compact、config、help、init、model、plan、goal、feedback 等。
- 数三处:斜杠命令的名字、`Skill` / `skill` 工具调用里的技能名、子代理类型(只在名字带已知包名时数)。
- 过闸门还是两条路:用够 2 次;或用够 1 次,并且仓库里有 skill 包留下的目录。
- 目录名单补了几项:openspec、agent-os、conductor、.taskmaster、.kiro。原来写的 `.agent-os` 是错的,实际是不带点的 `agent-os`。
- 报告里加一行「认出的 skill 包」。它只给名字贴标签,不影响闸门。原来的「skill 调用次数」照旧。
- 26 份量表一个字没改,149 条检测项也没动,量表版本仍是 2。

**区分度未验证。** 这一版没跑 4 项区分度测试。分数先当趋势看,不要直接拿来定级。

更新:再跑一次 `npx -y github:Ant-Intelligence/public-skills`。已装的落点会先勾上,直接回车。

## vibe-eval 1.1.4

1.1.4 只改了 DeepSeek harness(`dsh`)的记录读法。评分口径仍是 11,其它六家的报告可以和 1.1.3 直接比较。

**1.1.3 及更早版本评出的 dsh 报告不能用。** 那些报告几乎只看了项目文档,没读到会话。要用 1.1.4 重评。

- 一个 zstd 文件里有多个帧,以前只解了第一帧,等于只读到会话开头一行。现在逐帧解,末尾写了一半的帧也照常读到它前面的内容。
- 项目路径改成先读会话开头的 `cwd`,不再从目录名反推。`nex-router` 不再被推成 `nex/router`。
- 读取器按 `@deepseek-ai/dsh` 0.2.2-rc.3 的源码重写,并对着一份真实的 v4 记录核对过。人发的话、工具调用与结果、ESC 打断、人拒绝、退出码、压缩、斜杠命令、模型、用量、会话标题都能读到。
- 子代理的会话并进派出它的主会话。分叉来的会话跳过开头复制的那一段。人拒绝和命令失败分开算。
- dsh 只写进记录、不进对话的状态(待办、目标、审批问答、权限预设、沙箱模式、计划模式、代理预设、规则文件路径、会话标题来源、是否续接或分叉)现在收进证据包的 `stats.harness`。命令在哪个目录里跑收进 `tool_use.workdir`。
- 26 份量表一个字没改,量表版本仍是 2。

更新:再跑一次 `npx -y github:Ant-Intelligence/public-skills`。已装的落点会先勾上,直接回车。CI 的 Windows / macOS 路径未实测,遇到问题欢迎开 issue。

## vibe-eval 1.1.3

1.1.3 改了算分。**口径 10 → 11,分数不可直接比较**:1.1.2 及更早的报告和 1.1.3 的报告不能直接比,要看分数变化,用 1.1.3 重跑一遍。

- 基础分满分 100 分,只由三层算:L1 基础分 40 分、L2 基础分 40 分、L4 基础分 20 分。
- L3 改成加分项,最多加 10 分。过了资格闸门才计分,L3 层分乘 0.1 加进总分。没过闸门就加 0 分。
- 总分满分 110 分。报告第 2 行写 `Tier X - n.n / 110`。
- 段位按含加分的总分判,门槛不变:S ≥ 90 / A ≥ 80 / B ≥ 70 / C ≥ 60,低于 60 为 D。
- 报告的层表写分值,不写百分比:表头是「分值」,四行写「基础分 40 分」「基础分 40 分」「加分 10 分」「基础分 20 分」。

26 份量表一个字没改。更新:再跑一次 `npx -y github:Ant-Intelligence/public-skills`。已装的落点会先勾上,直接回车。

已知问题:报告服务端还只认 0–100 的总分。总分超过 100 的报告上传后,项目页的总分一栏是空的。报告全文照常上传。

## vibe-eval 1.1.2

1.1.2 加了安装器:`npx -y github:Ant-Intelligence/public-skills` 打开勾选列表,只列我们支持的 9 个落点,勾完把文件直接拷到对应目录。给 DeepSeek harness(`dsh`)装改用 `-a universal`。引擎没改,评审口径仍是 10,分数可以和 1.1.1 直接比较。

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

## vibe-eval 1.1.0

1.1.0 加了六个来源助手。现在能读这七家的会话记录:Claude Code、Kimi Code、Pi、
DeepSeek harness、CodeBuddy、Trae(TRAE CLI)、Qoder。每家一个读取器,把记录翻成
同一套事件,后面的取证、判定、出报告都不变。编辑器版(IDE)的聊天记录这次不做。

新增两条命令:

- `agents`:认出你现在在哪个助手里跑,列出本机每家有几个项目、几个会话,推荐评哪个。
- `current`:认出助手,再到那家的记录目录里找出你正在用的那个会话,给出文件路径。

`SKILL.md` 第 0 步改成先跑 `current`。认出的助手和会话会先告诉你,你点头才继续。
用 `--agent <id>` 可以指定读哪家的记录;不写时按 Claude Code 读,1.0.x 的用法照旧。
1.1.1 起改成自动认来源,`--agent` 一般不用写。见下一节。

口径 9 → 10:判定者看到的东西变了(工具名已翻成 Claude Code 的叫法,证据包多了
`source_agent`)。量表文字与 149 条检测项一个字都没改。1.0.x 的报告和 1.1.0 的
报告不能直接比较。装过的跑 `npx -y skills update vibe-eval -g` 更新。

Trae 的读取器标「试用」:按 TRAE CLI 程序里的字段名写的,还没对着真实记录核对过。
拿到真实记录核对之前,别拿 Trae 的分数定级。

## vibe-eval 1.1.1

这一版做两件事:默认评当前项目的全部会话;把用七家助手时要你操心的事,交给引擎自己做。不用读文档、不用加参数、不用装东西。

- **评这个项目的全部会话。** 一个项目常有好几个会话,只看一个会漏掉你在别的会话里的做法。跑 skill 时,引擎认出你在用哪个助手,找出当前项目在这个助手里的全部会话,一起评。开评前告诉你会话数和要读几份项目文档;不想读文档,说一声就行。
- **不用回答「你现在用哪个助手」。** 认不出时,引擎自己把七家都找一遍。只有一家有这个项目的记录,直接评那家。几家都有、又认不出你正在用哪家,才列出来让你选。
- **不用写 `--agent`。** `evidence`、`score`、`coll` 按你给的文件、记录目录或项目目录认出是哪家的记录。认不出才按 Claude Code 读。
- **`coll-list` 七家都列。** 想评别的项目时用它,每个项目下面给好「评这个项目」的命令。
- **不用装 zstd。** dsh 的会话记录是 zstd 压缩的。引擎自己依次试 Node 自带解压、`zstd`、`unzstd`、`zstdcat`,哪个能用用哪个。全都不成才提示一句。
- `doctor` 多打一行「解压 dsh 记录 可用(…)」,装完就能看出这台机器行不行。

口径仍是 10。证据包字段和判定者看到的东西都没变,1.1.1 的分数可以和 1.1.0 直接比较。

给 DeepSeek harness 装的命令 1.1.2 起改了,见下一节。

## vibe-eval 1.1.2

这一版只改给 DeepSeek harness(`dsh`)装 skill 的命令。引擎没变,口径仍是 10,1.1.2 的分数可以和 1.1.1 直接比较。

**只用 dsh 的机器,不要用不带 `-a` 的安装命令。** `skills` 不认识 dsh。它找不到认识的助手时,会往 50 多个助手的目录各放一份。

`skills` 没有 `-a dsh` 这一项,写了会报 `Invalid agents: dsh`。给 dsh 装用 `-a universal`。`universal` 是 `skills` 的一个安装项,它只把文件放进公用目录 `~/.agents/skills/vibe-eval/`。dsh 读这个目录。

只用 dsh:

```bash
npx -y skills add Ant-Intelligence/public-skills --skill vibe-eval -g -a universal
```

同时用 Pi 和 dsh:

```bash
npx -y skills add Ant-Intelligence/public-skills --skill vibe-eval -g -a pi -a universal
```

`-a pi` 放到 `~/.pi/agent/skills/`,Pi 读这里。`-a universal` 放到 `~/.agents/skills/`,dsh 读这里。

1.1.1 写的是 `-a kimi-code-cli`。它的落点也是 `~/.agents/skills/`,已经这样装好的不用重装。

## 版本与复核

本仓 tag(`vX.Y.Z`)与根目录 `manifest.json` 的 `release_version` 一致;
`manifest.json` 记录每个文件的 SHA-256,可逐文件复核镜像内容。1.0.0 起两个
skill 的版本号分开:vibe-eval 是 1.1.7,project-eval 仍是 0.4.4(本次未改动)。CI 每次推送在 Ubuntu 与 Windows 上自动做六 agent id 的安装冒烟
(五家 + OpenCode)。

## 平台验证面(如实)

vibe-eval 引擎是单个 Node.js 文件,project-eval 是纯 Python 标准库脚本,理论跨平台。本仓 CI 在 **Ubuntu 与 Windows** 上
验证:skills CLI 能把两个 skill 装进各 agent 用户级目录、装好的引擎能启动并
如实报告「无转录」。**agent 应用内**是否真的读取 SKILL.md 并执行,未做端到端
实测(CI 不运行这些 GUI/CLI agent);macOS 也未实测。遇到问题欢迎开 issue。
