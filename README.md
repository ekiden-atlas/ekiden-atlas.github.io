# EKIDEN ATLAS / 早稻田长跑档案 / 早稲田長距離アーカイブ

独立的中日双语日本大学长跑数据网站，面向公众浏览，设计以事实数据、原创文字、CSS 图表为主。**不是早稻田大学或任何赛事主办方的官方网站。**

> **交付状态（2026-11-18）**：本项目是完整的独立静态站点源码，可在 GitHub Pages 运行。**尚未创建新的独立组织仓库、尚未部署 Pages**，因为当前 GitHub 集成没有“创建组织／仓库”和“启用 Pages”的操作能力。用户需要执行 `docs/DEPLOY.md` 中一次性的建仓/发布设置。本项目没有修改原仓库，也没有修改 Supabase 生产库。

## 数据来源

1. 本地 `data/roster.js`：从旧版静态站 `index.html` 提取的 **2026 年度 48 条选手快照**。`pb*` 不等于全量已独立核实；列表明确标注出处和快照性质，不伪称实时名单。
2. 本地 `data/recent-ekiden.js`：2025–2026 年三大驿传的精选团队、区间成绩，包含赛事出处链接。
3. **隐私保护的历史数据构建流程**：新仓库 GitHub Actions 用私密 `SOURCE_RECORDS_URL` 获取原站结构化成绩，并生成本站自己的 `data/official-records.json`。访客浏览器只请求本站静态 JSON，不联系原个人 GitHub 仓库。设置 Secret 并成功构建后才完整包含 102 届箱根档案、校纪录和历代排名；未设置时只展示精选近期资料。
4. **共用已有 Supabase** `oflrjljywtqpgrcetwob`：公开读取 `wsd_athlete_basic_profiles` 的非文章字段、`wsd_athlete_world_rankings`、`wsd_open_archive_edits`，以及在授权迁移后读取 `wsd_public_content`。
5. 前端仅有公开的 `sb_publishable_*` key。没有 `service_role`、数据库密码和服务端 API 凭据。

`wsd_open_archive_edits` 已被原网站用于 `ekiden`、`school_record`、`alltime_rank`、`ob_result` 的数据覆盖（新网站展示其中前三类），因此这些**已有**覆盖数据在两个网站共享读取。新站不会调用其旧有的、不满足管理员独占条件的写接口。

## 推荐新网址

**独立 GitHub Organization + 组织主页仓库**：在组织名 `ekiden-atlas` 可用时，创建组织和仓库 `ekiden-atlas.github.io`，发布网址为 `https://ekiden-atlas.github.io/`（尚未创建，且名称可用性未验证）。详见 `docs/DEPLOY.md`。前端不公开原个人 GitHub 源地址；Actions 使用 secret 构建本地事实 JSON。

## 本次实现

- 简体中文 / 日文整体国际化、右上角切换、localStorage 持久化；字典位于 `js/i18n.js`。
- 原创深红色视觉、响应式首页、6 位重点选手滚动故事卡片。
- 48 名选手的 PB 快照、姓名/年级/性别/距离筛选，选手详情与世界排名的不同口径说明。
- 三大驿传逐区成绩、来源链接；完整历史战绩、校纪录和历代榜需部署时设置历史数据构建 Secret，缺失时不会编造名次。
- Google 登录入口与数据库内 `wsd_community_admins` 身份验证；普通访客永远看不到编辑控件。
- 双语管理员页面：结构化内容编辑、世界排名安全说明、管理员邀请与移除、操作历史。写入、审计、软删除功能需 **先审核并手动应用可选迁移**。

## 尚未完成 / 需要授权与集成的部分

- `sql/optional-managed-content.sql` **仅是待审的迁移文件，尚未执行**。运行前请备份并审阅。它新增 `wsd_public_content`、`wsd_public_audit`、`wsd_atlas_admins`、RLS、受限管理 RPC，不覆盖原有表、政策或记录。
- 原站当前**不会**自动消费新表 `wsd_public_content`。如果要让管理员对全部选手、PB、故事的修改同步到原站，需要对原站新增**只读覆盖适配器**（严格不影响原功能）；见 `docs/ORIGINAL-SITE-SYNC.md`。未集成之前不得宣称“双站全量双向同步”。
- 现有 `wsd_athlete_basic_profiles`、`wsd_open_archive_edits` 的 RLS 写入权限过宽。新网站**不直接在这些旧表写入**；不要仅通过隐藏按钮来解决权限问题。
- Google OAuth 新站 URL 需人工加入 Supabase Authentication 的 redirect allow list。管理后台的实际写入与 Google OAuth 需由所有者完成联调。
- 初期未为所有成绩独立完成赛事原始资料逐项复核。包括 48 人 PB 静态快照，必须持续核验并标注来源。

## 运行与测试

```bash
# 无需 npm install，无外部构建依赖
python3 -m http.server 8080
# 打开 http://localhost:8080/
node tests/check.mjs
```

生产站通过固定版本的 `@supabase/supabase-js@2.119.0` ESM CDN 加载 SDK；如断网，将自动展示静态快照。没有跟踪器、官方徽标、第三方图片或部员日志全文。

## 文件地图

- `index.html`、`style.css`、`favicon.svg`：UI 与原创图形
- `data/verified.js`：3 名重点选手 5000m 校历代榜与 2026 日本学生年榜的独立抽样核查
- `js/i18n.js`：双语文案
- `js/app.js`：页面和数据解释
- `js/data.js`、`js/config.js`：本站本地历史 JSON 与 Supabase 共用数据、覆盖逻辑
- `js/admin.js`：管理员工作台
- `sql/optional-managed-content.sql`：需用户批准执行的附加安全迁移
- `docs/`：版权审查、系统数据流、原站同步、部署手册

**声明 / 免責事項：** 本网站为独立运营的非官方资料平台，与早稻田大学、早稻田大学竞走部及赛事主办方不存在官方隶属或合作关系。

本サイトは独立運営の非公式資料プラットフォームであり、早稲田大学、早稲田大学競走部および大会主催者との公式な所属・提携関係はありません。

> 管理员权限隔离：首次复用原 `wsd_community_admins` 管理员身份。新增授权写入新站专属 `wsd_atlas_admins`（仅在可选迁移启用后），不改变原网站的管理员记录或权限；原站共享管理员不可从新站后台移除。
