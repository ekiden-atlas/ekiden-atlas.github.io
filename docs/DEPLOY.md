# 新站部署：独立品牌网址，不使用个人 GitHub 用户名

**目标公开地址示例**：`https://ekiden-atlas.github.io/`。仅在名为 `ekiden-atlas` 的 GitHub Organization 已成功创建且相应仓库部署后成立，未预先保证此名称可用。

1. 在 GitHub 创建一个独立的 **Organization**，建议名称 `ekiden-atlas`，不需要转移或修改原来的个人仓库。如该名称已被占用，请选择其他不含真实姓名的组织名称。
2. 在组织内创建 **Public** 仓库，**仓库名需精确对应 `组织名.github.io`**，例如组织名 `ekiden-atlas` → 仓库 `ekiden-atlas.github.io`。这是组织根域名方式，不是项目子路径方式。
3. 将交付 ZIP 解压后的文件（不包括 ZIP 外层文件夹）上传到这个新仓库的根目录。务必保留 `.github/workflows/deploy.yml` 和 `.nojekyll`。
4. 前往 **Settings → Pages → Build and deployment → Source → GitHub Actions**，启用该模式；`main` 上的 workflow 会部署至该组织的 Pages 根地址，而不是个人账户地址。
5. **完整历史档案（推荐）**：GitHub → 新组织仓库 → Settings → Secrets and variables → Actions → New repository secret；Name 填 `SOURCE_RECORDS_URL`，Value 填原仓库 `waseda-records-data.js` 的 Raw HTTPS 地址。该 URL 不会写进新仓库文件，不会出现在访客浏览器网络请求中；Action 只提取客观的结构化数据后，生成新的 `data/official-records.json`。**不要将这个 URL 放进 README、前端配置或提交历史**。如果不设置 Secret，新站仍可展示 2025–2026 近期静态比赛记录，但 102 届箱根历史、学校纪录和历代排名不会完整显示。
6. 在 Actions 页面触发 `Deploy EKIDEN ATLAS (privacy-friendly)`，也可等 `main` 提交自动运行。必须在该工作流的部署结果里看到真实 Pages URL，不能仅根据格式推断网站已上线。
7. **Google 管理员登录**：Supabase Dashboard → Authentication → URL Configuration → Redirect URLs，在保留原站地址的情况下，**新增**实际网站地址，例如 `https://ekiden-atlas.github.io/`。需要 Google OAuth provider 已启用。不要覆盖原 Site URL。
8. 完整权限管理及审计功能仍需独立审阅 `sql/optional-managed-content.sql` 后决定是否执行。**目前未修改生产库**。原站读取新覆盖表的功能也仍需另行批准。

## 关于隐私

- 新站的**公开 URL、页面链接、源代码和发布后的资源请求**均不再包含原 GitHub 用户名。
- 完整历史数据由 Action 使用私密仓库 Secret 获取，部署时只上传 `dist/` 静态内容；没有把原 URL 嵌进网页。
- 新建组织并不能保证完全匿名：组织公开成员、Git 提交作者、GitHub 账号关联和 Supabase 项目所有权仍可能暴露身份。请检查 Organization People/member visibility 和 Git 提交邮箱，优先使用 GitHub noreply 地址；原 GitHub 仓库仍然公开。
- 如果未来改用自定义域名，可在 Pages 的 Custom domain 选项绑定；这并不能自动隐藏 GitHub 的公开仓库归属。

## 网站实际 URL

仓库 `ekiden-atlas/ekiden-atlas.github.io` → `https://ekiden-atlas.github.io/`（仅示例；请用实际组织名替换）。
