# HTML Tool Hub V1.0

GitHub Pages + Firebase 的繁體中文工具中心，首個工具為「金山萬里一日遊」。原生 HTML/CSS/JavaScript，不需要前端編譯。

**網站已發布：[開啟 HTML Tool Hub](https://da199919-ux.github.io/html-tool-hub/)。** Firebase、Google 登入供應商與安全規則已設定；專案唯一人員擁有者與網站管理員皆為 da199919@gmail.com（2026-10-31 核對）。已以兩個真實 Google 帳號完成隔離、即時同步、唯讀、撤權與衝突驗收，結果與尚未測試項目見 [驗證紀錄](docs/verification.md)；部署狀態見 [部署紀錄](docs/deployment.md)。

請先看 [新手設定說明](docs/setup.md)，再看 [驗收與權限設計](docs/architecture.md)。

## 已實作

- Google 彈出式登入（每次可選擇帳號）、登出；登入只保留在目前分頁的工作階段。
- 工具搜尋、公開唯讀示範、依授權顯示工作空間。
- 管理員新增工作空間，以 UID 授予／更新／撤銷編輯者及檢視者。
- 成員可跨多個空間取得不同角色；未核准使用者無資料存取權。
- 行程逐筆新增、編輯、完成標記；只有管理員可刪除。
- Firestore 即時監聽；撤權時清除顯示，停止相應監聽。
- 儲存與刪除使用交易和版本檢查；衝突保留編輯草稿。
- 明確標示尚未設定、唯讀示範、快取／連線中、權限不足及衝突。
- 安全規則測試與 GitHub Pages 工作流程；測試通過後才發布靜態檔案。

## 檔案配置

```text
html-tool-hub/
├─ public/                      # 唯一公開部署目錄
│  ├─ index.html                # 首頁、登入與管理員區塊
│  ├─ .nojekyll
│  ├─ css/style.css
│  ├─ js/
│  │  ├─ firebase-config.js     # 填入 Firebase Web 設定
│  │  ├─ core.js               # 共用登入、訊息及 UI 工具
│  │  ├─ data.js               # 交易式儲存、版本檢查、示範資料
│  │  ├─ hub.js                # 工作空間與授權管理
│  │  └─ travel.js             # 旅遊工具與即時監聽
│  └─ tools/travel/index.html
├─ firestore.rules             # 預設拒絕的正式規則來源
├─ firestore.indexes.json
├─ firebase.json               # 規則部署／測試模擬器設定
├─ tests/rules.test.mjs         # 9 組角色與資料驗證測試
├─ scripts/check.mjs           # 語法／連結／JSON 檢查
├─ scripts/serve.mjs            # 僅在本機開啟的預覽伺服器
├─ .github/workflows/pages.yml  # 測試通過才發布 public/
└─ docs/
   ├─ setup.md
   ├─ architecture.md
   ├─ deployment.md
   └─ verification.md
```

## 本機預覽

安裝 Node.js 22 或更新版本後，在本資料夾開啟終端機：

```sh
node scripts/check.mjs
node scripts/serve.mjs
```

瀏覽 `http://127.0.0.1:4173`。不要直接雙擊 HTML，JavaScript 模組需由 HTTP 提供。未設定 Firebase 時仍可瀏覽公開示範。

## 檢查結果與尚待驗收

請見 `docs/verification.md`。本機檢查不等於真實 Firebase、Google 登入及多人跨裝置驗收。
