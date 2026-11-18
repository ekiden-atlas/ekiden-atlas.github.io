# 原网站兼容与数据同步：未执行的集成计划

原网站：保留原有个人 GitHub 仓库，不在新站公开代码中填写所有者用户名。截至 2026-11-18，原站有两种主要数据来源：

1. `index.html` 内嵌 `BASE_ATHLETES`（48 条快照），包括 PB、年级和部分原地写死的资料；`waseda-records-data.js` 有 `WSD_OFFICIAL_RECORDS` 包含箱根历史、校纪录和历代排名。
2. Supabase：`wsd_athlete_basic_profiles`、`wsd_athlete_world_rankings`、`wsd_community_editorial`、`wsd_open_archive_edits` 及旧的实时投稿/赛事表。

**已经能跨站共享展示的写入**：原站现有 `wsd_open_archive_edits` 的 `ekiden`/`school_record`/`alltime_rank` 覆盖以及 `wsd_athlete_world_rankings` 世界排名均由新站公开读取。新站没有向上述旧表写入，以免绕开管理员独占和审计要求。

**尚未同步**：本项目新的 `wsd_public_content` 是可选的安全内容覆盖表。原站此前没有读取它；新后台即使写入了记录，原站也不会显示，除非原站主动集成读取逻辑。不得把新网站前端修改解释为“原站已自动更新”。

## 推荐集成步骤（需要另行批准修改原站）

1. 在原站部署前创建 GitHub 标签/备份，固定旧版本与测试用例。
2. 只增加一个只读客户端查询 `wsd_public_content`，复用原站已有 Supabase **公开**客户端，不新增任何管理写权限。
3. 原站的 `getCurrentAthletes()` 在从 `BASE_ATHLETES` 读取后，按 `kind='athlete'` + `record_key=name` 应用覆盖；`kind='pb'` 按 `{name, field, time}` 覆盖某项 PB。
4. 在原站调用 `window.WSD_OPEN_ARCHIVE.patch()` 后再按新站 `kind='ekiden'`/`school_record`/`alltime_rank` 过滤、合并及应用软删除。保留原版档案不可变。
5. 对 `story` 仅读取本站原创、获许可的双语 `description_zh`/`description_ja`；不要把原有官方日志全文迁入。
6. 加上自动测试：“原站无新表时完全保持旧行为”“新表 tombstone 正确隐藏”“未授权用户不可写”“管理员修改能同时出现在双站”。
7. 只合并兼容性 PR，不覆盖或重新创建旧站。

**不应做的事情**：直接替换原站主页；修改原数据库的开放协作功能以凑合新站权限；依赖 Service Role key 从客户端代写；擅自覆盖旧表；假设新增 Supabase 行会被 `index.html` 自动读取。

> 管理员权限隔离：首次复用原 `wsd_community_admins` 管理员身份。新增授权写入新站专属 `wsd_atlas_admins`（仅在可选迁移启用后），不改变原网站的管理员记录或权限；原站共享管理员不可从新站后台移除。
