# Smart ホームシアター

100インチ大画面と本格サラウンド音響のレンタルスペース（横浜中華街店・大船店）の Web サイト。[Astro](https://astro.build/) 製。

## 必要環境

- **Node.js 22 (LTS)** 推奨（Astro 5 の動作要件は 18.20.8+ / 20.3+ / 22+）
- npm（Node.js に同梱）

## セットアップ

### 1. Node.js をインストール（macOS / Homebrew 以外）

以下のどちらかの方法で入れてください。バージョンを切り替えたいなら **nvm**、とにかく手っ取り早く入れたいなら **公式インストーラ** がおすすめです。

#### 方法A: nvm（バージョン管理したい人向け・推奨）

```sh
# nvm 本体をインストール（インストール後、ターミナルを開き直す）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Node.js 22 (LTS) をインストールして有効化
nvm install 22
nvm use 22

# 確認
node -v   # v22.x.x
npm -v
```

#### 方法B: 公式インストーラ（一番シンプル）

1. [nodejs.org](https://nodejs.org/) から **LTS（22.x）** の macOS 用 `.pkg` をダウンロード
2. ダウンロードした `.pkg` を開いてインストーラの指示に従う
3. ターミナルで確認：

```sh
node -v   # v22.x.x
npm -v
```

### 2. 依存パッケージをインストール

```sh
npm ci
```

> `npm install` ではなく `npm ci` を使ってください。`package-lock.json` に固定されたバージョンを厳密に再現するため、環境差による不具合を防げます。

### 3. 開発サーバーを起動

```sh
npm run dev
```

起動後、ターミナルに表示される URL（通常は `http://localhost:4321/`）をブラウザで開きます。ファイルを保存すると自動でリロードされます。

## その他のコマンド

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動（ホットリロード付き） |
| `npm run build` | 本番用に `dist/` へ静的ビルド |
| `npm run preview` | ビルド結果をローカルで確認 |
