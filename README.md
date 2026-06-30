# カレンダーアプリ

React + Vite + Tailwind CSS で作られたスマホ向けカレンダー/タスク管理アプリです。

## ローカルで動作確認

```bash
npm install
npm run dev
```

`http://localhost:5173` を開いて確認できます。

## Vercelへのデプロイ方法

### 方法A: GitHub経由（推奨）
1. このフォルダ一式をGitHubリポジトリにpushする
2. https://vercel.com にログインし「Add New... → Project」を選択
3. 対象のリポジトリをImport
4. Framework Presetは自動で「Vite」が選ばれます（選ばれない場合は手動で「Vite」を選択）
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 「Deploy」をクリックすれば数十秒で公開されます

### 方法B: Vercel CLIから直接デプロイ
```bash
npm install -g vercel
cd calendar-app
vercel
```
質問に答えていくとそのままデプロイされます（本番反映は `vercel --prod`）。

## ファイル構成
```
calendar-app/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx     # エントリーポイント
    ├── App.jsx      # カレンダーアプリ本体
    └── index.css    # Tailwindの読み込み
```

## 注意点
- データ（予定・タスク・テンプレート・色の名前など）はブラウザのメモリ内（React state）にのみ保持されます。ページをリロードすると消えるので、永続化したい場合は localStorage や外部DB（Supabase等）との連携を追加してください。
- アイコンには `lucide-react` を使用しています。
