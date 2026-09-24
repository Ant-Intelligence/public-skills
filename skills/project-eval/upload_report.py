#!/usr/bin/env python3
"""upload_report.py —— 上云桥(随 SKILL.md 分发;两 skill 共用)。

把本地报告包成「临时 schema 0.1」载荷 POST 到云端 /api/project-upload,
换回 /link/<token> 访问链接。上云是 opt-in(2026-09-12 默认翻转):默认
仅本地、零出网,本桥**经用户同意后由 agent 执行** —— 用户没同意不上传。

用法:python3 upload_report.py 报告.md [--name 项目名] [--server URL]
      [--html 渲染版.html] [--no-html]
缺省自动把同目录同名的 .html 一并上送(链接页 ⑧ 新页整页打开渲染版,
沙箱语义由 CSP sandbox 响应头实现);
--no-html 仅上送 Markdown。--name 缺省自动取「被评对象 · 工具」双要素名
(0.2.11 命名规范;/my-reports 一眼看清谁被哪条工具线评的),显式指定原样
上送。仅标准库,零依赖,Python 3.9+。**http 明文传输,未加密;桥不做自动
密钥拦截 —— 上云前请自行确认报告不含密钥原文**(载荷即报告内容,
敏感项目建议保持默认仅本地)。
"""
import argparse
import json
import pathlib
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone, timedelta

SCHEMA_VERSION = "0.1"
SKILL_VERSION = "manual-bridge-0.6"
REPORT_MD_CAP = 240_000
SUMMARY_CAP = 20_000

# 从报告 md 提取结构化字段(填七节 ② 总分;等级只进摘要,不进「项目级」徽章,
# 防 doc-eval L4~L0/U 与项目级占位记号混淆)。三种来源:doc-eval 离线(结构信
# 号分)/ doc-eval 双轨(承载力总分)/ vibe-eval 会话(Tier X - n.n / 100);
# 提取失败一律略过,页面如实「未评估」,全文由 ⑧ 节兜底。
_DOC_TOTAL_RE = re.compile(
    r"\*\*(承载力总分|结构信号分)\s*([0-9]+(?:\.[0-9]+)?)\s*/\s*100\*\*")
_DOC_LEVEL_RE = re.compile(r"^##\s*接手等级\s+([A-Za-z0-9]+)", re.M)
_SESS_TOTAL_RE = re.compile(
    r"\*\*Tier\s+([A-Za-z])\s*-\s*([0-9]+(?:\.[0-9]+)?)\s*/\s*100\*\*")

# 被评对象标识(0.2.11 命名规范「被评项目 · 工具」):报告 md 首行 → 「被评的
# 是谁」。单会话与文档轨的 id 在反引号里,批量画像的 identity 是裸文本;
# 锚定首行(不全文扫)防正文里同形句子误配。
_SESSION_ID_RE = re.compile(r"\A#\s*Claude Session Score\s*-\s*`([^`\n]+)`")
_PROFILE_ID_RE = re.compile(r"\A#\s*Developer Profile\s*-\s*([^\n]+)")
_DOC_ID_RE = re.compile(r"\A#\s*文档承载力报告\s*-\s*`([^`\n]+)`")

# 缺省上云名的工具段(种类 → 工具串;与会话/批量/文档三线的 /my-reports
# 类型列用词一致)。
_KIND_TOOL = {"session": "vibe-eval", "doc-eval": "project-eval · doc-eval"}


def _resolve_html(md_path, html_arg, no_html):
    """决定附带哪份 HTML5 渲染版:.html 文件路径或 None。

    --html 显式指定优先;未指定则自动取与 .md 同目录同名的 .html
    (score_session 默认 --format both,md/html 同 stem 相邻产出),让「忘了带
    --html」也照样上送渲染版;--no-html 或自动候选不存在 → None(仅上送 md)。
    """
    if no_html:
        return None
    if html_arg:
        return pathlib.Path(html_arg)
    auto = pathlib.Path(md_path).with_suffix(".html")
    return auto if auto.is_file() else None


def _extract_subject_id(text, kind):
    """报告 md 首行 → 被评对象标识(strip 反引号/空白,截 40);识别不出 → None。

    种类决定找哪一种首行:session 认单会话(`# Claude Session Score - ` +
    反引号 sid)与批量画像(`# Developer Profile - ` + identity)两形,
    doc-eval 认文档轨(`# 文档承载力报告 - ` + 反引号 doc_id)。
    """
    head = text.lstrip()
    if kind == "session":
        m = _SESSION_ID_RE.match(head) or _PROFILE_ID_RE.match(head)
    elif kind == "doc-eval":
        m = _DOC_ID_RE.match(head)
    else:
        return None
    if not m:
        return None
    return (m.group(1).strip().strip("`").strip()[:40]) or None


def _default_upload_name(kind, subject, stem):
    """缺省上云名(无显式 --name,0.2.11「被评对象 · 工具」双要素)。

    有种类:`<标识> · 工具`(标识已自带该工具段 → 不重复追加);有种类但
    标识提取不出 → `f"{stem} · 工具"`;种类也识别不出(md 首行/总分形都不
    匹配)→ 维持 stem 现状。显式 --name 在调用方原样优先,不过本函数。
    """
    tool = _KIND_TOOL.get(kind)
    if not tool:
        return stem
    if not subject:
        return f"{stem} · {tool}"
    if subject == tool or subject.endswith(" · " + tool):
        return subject
    return f"{subject} · {tool}"


def _resolve_upload_name(explicit, kind, subject, stem):
    """上云名取值单一入口:显式 --name 原样优先(不加工具后缀),缺省走
    双要素取名;两者统一截 200(服务端 project_name 上限)。"""
    return (explicit or _default_upload_name(kind, subject, stem))[:200]


def _extract_scores_and_summary(text, fallback_summary):
    """报告 md → (scores dict, 自动摘要, 报告种类, 被评对象标识)。
    识别不出 → ({}, fallback, None, None)。

    种类(meta.report_kind)供服务端页面分派标题与⑦文案:doc-eval / session;
    None 时服务端兜底嗅探 report_md 首行。被评对象标识供缺省上云名
    (`_default_upload_name`),不是哪种报告都能读出来,读不出按 None 走。
    """
    m = _DOC_TOTAL_RE.search(text)
    if m:
        label, total = m.group(1), float(m.group(2))
        lv = _DOC_LEVEL_RE.search(text)
        level = f" · 接手等级 {lv.group(1)}" if lv else ""
        return ({"total": total},
                f"doc-eval:{label} {total}/100{level}", "doc-eval",
                _extract_subject_id(text, "doc-eval"))
    m = _SESS_TOTAL_RE.search(text)
    if m:
        tier, total = m.group(1), float(m.group(2))
        return ({"total": total},
                f"vibe-eval 会话评分:Tier {tier} · {total}/100", "session",
                _extract_subject_id(text, "session"))
    return {}, fallback_summary, None, None


def main() -> int:
    ap = argparse.ArgumentParser(description="vibe-eval 上云桥(经用户同意后由 agent 执行)")
    ap.add_argument("report", help="本地报告文件(.md 推荐;.html 按原文上送)")
    ap.add_argument("--name", default=None,
                    help="项目名(缺省自动取名:被评对象 · 工具;显式指定"
                         "原样上送,不加工具后缀)")
    ap.add_argument("--server", default="http://123.207.204.220:8077")
    ap.add_argument("--summary", default="", help="一句话摘要(可选)")
    ap.add_argument("--html", default=None,
                    help="本地 .html 渲染版报告路径(可选;缺省自动取与 .md 同目录"
                         "同名的 .html,没有则仅上送 md)")
    ap.add_argument("--no-html", action="store_true",
                    help="仅上送 Markdown,不附带 HTML5 渲染版")
    args = ap.parse_args()
    if args.html and args.no_html:
        print("不能同时给 --html 与 --no-html", file=sys.stderr)
        return 2

    p = pathlib.Path(args.report)
    if not p.is_file():
        print(f"读不到报告文件:{p}", file=sys.stderr)
        return 2
    text = p.read_text(encoding="utf-8", errors="replace")
    if len(text) > REPORT_MD_CAP:
        print(f"报告 {len(text)} 字符超上限 {REPORT_MD_CAP},请先裁剪", file=sys.stderr)
        return 2

    html_path = _resolve_html(p, args.html, args.no_html)
    html_text = None
    if html_path is not None:
        if not html_path.is_file():
            print(f"读不到 HTML 报告:{html_path}", file=sys.stderr)
            return 2
        html_text = html_path.read_text(encoding="utf-8", errors="replace")
        if len(html_text) > REPORT_MD_CAP:
            print(f"HTML 报告 {len(html_text)} 字符超上限 {REPORT_MD_CAP},"
                  f"请先裁剪", file=sys.stderr)
            return 2

    scores, auto_summary, kind, subject = _extract_scores_and_summary(
        text, f"{p.name} 手动上云")
    meta = {"skill_version": SKILL_VERSION}
    if kind:
        meta["report_kind"] = kind

    # 上云名:显式 --name 原样优先(不加工具后缀);缺省走 0.2.11 双要素取名
    # (被评对象 · 工具;识别不出维持 stem 现状)。
    name = _resolve_upload_name(args.name, kind, subject, p.stem)

    payload = {
        "schema_version": SCHEMA_VERSION,
        "project_name": name,
        "generated_at": datetime.now(timezone(timedelta(hours=8))).isoformat()[:40],
        "summary": (args.summary or auto_summary)[:SUMMARY_CAP],
        "report_md": text,
        "scores": scores,
        "meta": meta,
    }
    if html_text is not None:
        payload["report_html"] = html_text
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    if len(body) > 256 * 1024:
        print(f"载荷 {len(body)} 字节超服务端 256KB 上限,请先裁剪", file=sys.stderr)
        return 2

    print("=" * 46)
    print(f"桥:{SKILL_VERSION} · 报告种类:{kind or '未识别(服务端将按 md 首行嗅探)'}"
          f" · 总分:{scores.get('total', '—')}")
    print(f"上云名:{payload['project_name']}"
          + ("(显式 --name 原样上送)" if args.name else "(缺省:被评对象 · 工具)"))
    if html_text is not None:
        src = "--html" if args.html else "同目录同名 .html 自动发现"
        print(f"HTML5 渲染版:随附({src};链接页 ⑧ 新页整页打开,"
              "沙箱语义由 CSP sandbox 头实现)")
    else:
        print("HTML5 渲染版:未附带 —— 链接页 ⑧ 将只显示 Markdown 原文"
              "(评分请 --format both 让 md/html 同目录产出)")
    print(f"载荷:{len(body)} 字节 / 256KB 上限")
    print("=" * 46)

    req = urllib.request.Request(
        args.server.rstrip("/") + "/api/project-upload",
        data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            out = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        try:
            detail = json.loads(exc.read().decode("utf-8")).get("error", "")
        except Exception:
            detail = ""
        print(f"上传被拒 [{exc.code}] {detail}", file=sys.stderr)
        return 1
    except (urllib.error.URLError, OSError) as exc:
        print(f"连不上云端:{exc}", file=sys.stderr)
        return 1

    link = args.server.rstrip("/") + out.get("link_url", "")
    print("上传成功:")
    print(f"  链接:   {link}")
    print(f"  有效期: {out.get('expires_at', '?')}(30 天)")
    print("打开链接 → 已登录(非 admin)即自动绑定出全文;未登录先登录/注册,"
          "再打开即自动绑定(2026-09-03 起免确认页)。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
