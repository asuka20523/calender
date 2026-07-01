# カレンダーアプリ（React + Vite）

スマホ向けカレンダー・タスク管理アプリです。Vercelにそのままデプロイできます。

## アプリらしく（ブラウザのアドレスバーなしで）使う方法

ブラウザで開いただけだとアドレスバーが見えてブラウザっぽくなります。**スマホのホーム画面に追加**すると、全画面表示でアプリのように使えます。

### iPhone（Safari）の場合
1. SafariでデプロイしたURLを開く
2. 下部の「共有」ボタン（四角に矢印のアイコン）をタップ
3. 「ホーム画面に追加」をタップ
4. 名前を確認して「追加」をタップ
5. ホーム画面に追加されたアイコンから開くと、アドレスバーなしの全画面で表示されます

### Androidの場合
1. Chromeで開く
2. 右上の「︙」メニューをタップ
3. 「ホーム画面に追加」または「アプリをインストール」をタップ

※ ホーム画面に追加した時に正しくアイコン・全画面表示になるよう、`manifest.webmanifest`とアイコン画像を同梱しています。

## ローカルで動かす

```bash
npm install
npm run dev
```

## Vercelへデプロイする方法（一番確実な手順）

ターミナル（Mac:ターミナル / Windows:コマンドプロンプトかPowerShell）で、このフォルダ（calendar-app）の中に移動してから、以下を順番に実行してください。

```bash
cd calendar-app
npm install -g vercel
vercel login
vercel --prod
```

- `vercel login` でメールアドレスを入力し、届いたメールのリンクをクリックしてログインを完了させてください。
- `vercel --prod` を実行すると、いくつか質問されます。基本的には全部Enter（デフォルト）でOKです。
  - "Set up and deploy?" → Enter（y）
  - "Which scope?" → 自分のアカウントを選択
  - "Link to existing project?" → N（新規の場合）
  - "What's your project's name?" → 好きな名前（例: calendar-app）
  - "In which directory is your code located?" → Enter（そのまま ./）
  - フレームワークは Vite が自動検出されます
- 完了すると最後に `https://◯◯◯.vercel.app` というURLが表示されるので、それをスマホで開いてください。

**重要**: 表示されたURLが本当に存在するかは、`vercel --prod` のコマンドが**エラーなく最後まで終わった場合のみ**保証されます。途中でエラーが出ていないか必ず確認してください。

## うまく開けない場合の確認方法

1. https://vercel.com/dashboard を開く
2. デプロイしたプロジェクトをクリック
3. 「Deployments」タブの一番上の状態が緑色の「Ready」になっているか確認
   - 赤色の「Error」になっている場合は、そこをクリックするとビルドログ（エラーの詳細）が見られます。そのログを共有していただければ原因を特定できます。
4. 「Visit」ボタンから開くURLが、実際にスマホでアクセスしているURLと一致しているか確認

## データの保存について
予定・タスク・色の名前・テンプレート・履歴などは、ブラウザのlocalStorageに保存されます。
サーバー側にデータベースは持っていないため、端末・ブラウザを変えるとデータは引き継がれません。

## ファイル構成
```
calendar-app/
├── index.html          Viteのエントリーhtml
├── package.json
├── vite.config.js
├── vercel.json          Vercel向けビルド設定
├── dist/                 確認用にビルド済みファイルも同梱（デプロイには使いません）
└── src/
    ├── main.jsx         Reactのマウント処理
    ├── App.jsx           ルートコンポーネント
    ├── App.css           アプリのスタイル
    ├── index.css         ベースのリセットCSS
    └── calendarApp.js    カレンダー本体のロジック（DOM操作で描画）
```
