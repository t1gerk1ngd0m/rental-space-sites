# payment.smart-hometheater.com 設計

レンタルスペースの Amazon Prime Video 有料コンテンツ実費、および有料オプションを
オンライン決済し、決済完了後に Fire TV の購入 PIN を顧客へ配信する仕組み。

現行フロー（顧客が都度銀行振込 → 口頭/チャットで PIN 伝達）を置き換える。

---

## 1. リポジトリ構成

`rental-space-sites/` 配下は「1 サブドメイン = 1 アプリ」。各アプリが自前の
`package.json` と `wrangler.jsonc` を持つ。この規模ではモノレポツール（npm workspaces 等）は不要。

```
rental-space-sites/
├─ smart-hometheater/   → smart-hometheater.com          （既存 / Astro 静的サイト）
└─ payment/             → payment.smart-hometheater.com  （新規 / Hono on Workers）
```

### smart-hometheater/ 側の変更

各店舗セクションに決済ページへの導線ボタンを 1 つずつ追加するのみ。

- 横浜中華街店 → `https://payment.smart-hometheater.com/?space=yokohama`
- 大船店 → `https://payment.smart-hometheater.com/?space=ofuna`

---

## 2. 新 Worker のスタック

**Hono on Cloudflare Workers** を採用する。

処理の実体が API 形状（Checkout Session 作成 → リダイレクト、Stripe Webhook 受信、
LINE Webhook 受信、HTML 1〜2 枚）であり、静的サイトジェネレータのビルドパイプラインは不要。

代替案として Astro SSR（`@astrojs/cloudflare`）があるが、メインサイトとレイアウトを
共有する強い要求が出るまでは採用しない。

### wrangler.jsonc（骨子）

```jsonc
{
  "name": "payment-smart-hometheater",
  "main": "src/index.ts",
  "compatibility_date": "2026-08-01",
  "routes": [
    { "pattern": "payment.smart-hometheater.com", "custom_domain": true }
  ],
  "kv_namespaces": [
    { "binding": "PAYMENTS", "id": "<作成後に記入>" }
  ]
  // メール送信バインディングは実装時に cloudflare-email-service スキルを参照して確定
}
```

DNS ゾーンは既に Cloudflare 上にあるため、サブドメイン追加のみで済む。

---

## 3. 決済フロー

決済基盤は **Stripe Checkout（Stripe ホスト型ページ）** を使う。
カード情報を自前で扱わないため PCI DSS の対象範囲を最小化できる。

```
[顧客]
  │ 各店舗に掲示した QR コード / サイトのボタン
  ▼
GET /?space=yokohama            … 注文フォーム（Worker が HTML 返却）
  │  ・レンタル料金（顧客入力）
  │  ・有料オプション（チェックボックス）
  │  ・PIN 受け取り方法（ページ表示 / メール / LINE）
  ▼
POST /checkout                  … Worker が Checkout Session 作成
  │  metadata: { space, delivery, options }
  ▼
Stripe ホスト決済ページ
  │
  ├─→ webhook: checkout.session.completed  → 履行処理（PIN 配信・オーナー通知）
  │
  ▼
GET /success?session_id=...     … Worker が Stripe API で再検証 → PIN 表示
```

### 重要な設計判断

1. **success ページは Stripe API で必ず再検証する。**
   リダイレクト URL の到達だけを根拠に PIN を出さない。Worker 側で
   Checkout Session を取得し `payment_status === 'paid'` を確認してから表示する。
   これをやらないと `session_id` の推測・URL 共有で PIN が漏れる。

2. **履行の正は Webhook（`checkout.session.completed`）。**
   顧客がリダイレクトを待たずにブラウザを閉じても、メール / LINE 配信と
   オーナー通知は Webhook 側で完結する。success ページは「速い経路」にすぎない。

3. **Webhook は署名検証必須。** `STRIPE_WEBHOOK_SECRET` で検証する。

4. **Webhook の冪等性。** Stripe はリトライするため、`event.id` を KV に記録して
   処理済みイベントを弾く。処理後は必ず 2xx を返す（返さないとリトライが続く）。

---

## 4. 店舗（スペース）の識別

決済がどの店舗のものか常に判別できるよう、`space` キーを 3 箇所で保持する。

- キー値: `yokohama`（横浜中華街店） / `ofuna`（大船店）
  ※ 既存サイトのアンカー ID と一致させる
- 経路 1: URL クエリ `?space=yokohama`（各店舗に QR コードを掲示するのが実運用上もっとも確実）
- 経路 2: フォーム上の店舗選択（クエリが欠けた場合のフォールバック。必須項目）
- 経路 3: Checkout Session の `metadata.space`

オーナー通知は `metadata` を読むだけで店舗が分かる。KV 参照を挟まない。

---

## 5. 金額モデル

| 項目 | 方式 |
|------|------|
| レンタル料金（Prime Video 実費） | 顧客が金額を入力 |
| 有料オプション | Stripe Product / Price として事前登録 |

Worker が `line_items` を組み立てる。

- レンタル料金: `price_data` に `unit_amount` を動的指定
- オプション: 登録済みの `price` ID を指定

実装上の注意:

- JPY はゼロ十進通貨。`unit_amount: 500` が ¥500 を意味する（100 倍しない）
- サーバ側で入力値を必ずクランプする（整数 / 最小値 / 最大値）。
  クライアント側バリデーションだけに依存しない
- 上記を満たしても金額の過少入力は原理的に防げない。**運用（利用後の確認）で対処する方針**とする

補足: Stripe の `custom_unit_amount` を使うと金額入力欄を Stripe のホストページ側に
持たせられ、Worker 側のバリデーション実装を減らせる。ただし Checkout の `mode: 'payment'`
との組み合わせ可否を実装時に検証すること。既定は上記の `price_data` 方式とする。

---

## 6. PIN 配信（3 経路すべて対応）

顧客はフォームで受け取り方法を選択する。選択値は `metadata.delivery` に載せる。

### 6-1. ページ表示

success ページで表示する。選択内容に関わらず常に利用可能な経路とする
（メール / LINE が失敗しても顧客が詰まらないため）。

### 6-2. メール

Checkout が収集した `customer_details.email` 宛に送信する。
Cloudflare Email Service を使用。送信ドメインは `smart-hometheater.com`。
SPF / DKIM / DMARC の DNS 設定が事前に必要。

### 6-3. LINE

LINE Messaging API を使う。顧客の userId が事前に分からない点が制約になる。

```
success ページに「友だち追加」リンク + 6 桁のワンタイムコードを表示
  ▼
顧客が公式アカウントを友だち追加し、コードをトークに送信
  ▼
LINE Webhook 受信 → KV の linecode:{code} を照合
  ▼
reply API で PIN を返信 → コードを KV から削除
```

- 顧客への返信は **reply API**（応答メッセージ）を使う。reply は無料枠の従量対象外
- push（プッシュメッセージ）は無料プランで月間上限があるため、オーナー通知に温存する
  ※ 上限値は実装時に最新のプラン仕様を確認すること
- LINE Login は使わない（顧客側の手順が増えるため）
- Webhook は `X-Line-Signature` の署名検証必須

---

## 7. オーナー通知

決済発生時に自分（オーナー）へ通知を飛ばす。メールと LINE の両方に対応する。

**通知内容:**

- 店舗（横浜中華街店 / 大船店）
- 金額（レンタル料金 / オプション内訳）
- 決済日時
- Stripe session id（サポート時の追跡用）

**経路:**

- メール: Cloudflare Email Service で `OWNER_EMAIL` 宛
- LINE: Messaging API の push を `OWNER_LINE_USER_ID` 宛

注意: LINE Notify は 2025 年にサービス終了済み。オーナー通知にも Messaging API を使う。
`OWNER_LINE_USER_ID` は自分が公式アカウントを友だち追加した際の `follow` イベントを
ログ出力して一度だけ取得する。

---

## 8. エラー通知

決済フローの失敗はサイレントにせず、必ずオーナーへ飛ばす。

- Hono の `app.onError` でハンドラ全体の例外を捕捉
- Webhook ハンドラ内でも明示的に try/catch し、失敗内容を通知
- 通知送信は `ctx.waitUntil()` に載せ、レスポンスをブロックしない
- **Webhook は通知失敗時でも 2xx を返す**（500 を返すと Stripe が延々とリトライする）。
  決済データの永続化を先に済ませてから通知を投げる

制約: 通知経路自体（メール / LINE）が落ちている場合、そのエラーは失われる。
Workers のログ（`wrangler tail` / Workers Observability）が最終的な確認手段になる。

---

## 9. データストア

Cloudflare KV を使う。注文履歴の一覧や管理画面が必要になった時点で D1 を検討する。

| キー | 値 | TTL |
|------|-----|-----|
| `session:{stripe_session_id}` | 決済状態、店舗、配信方法、金額 | 長め（サポート対応用） |
| `event:{stripe_event_id}` | Webhook 冪等性フラグ | 数日 |
| `linecode:{code}` | 対応する session id | 短め（数時間） |

---

## 10. シークレット

`wrangler secret put <NAME>` で登録する。リポジトリには含めない。

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `OWNER_LINE_USER_ID`
- `OWNER_EMAIL`
- `PIN_YOKOHAMA`
- `PIN_OFUNA`

PIN は店舗ごとに別（各店舗が別の Fire TV / Amazon アカウントを持つ想定）。
両店舗で同一アカウントを共用している場合は単一のシークレットに統合する。→ 未確認事項

---

## 11. 実装フェーズ

**フェーズ 1（最小構成 / まずこれを出す）**

- 注文フォーム（`space` パラメータ対応、金額入力、オプション選択）
- Stripe Checkout Session 作成
- Webhook 受信 + 署名検証 + 冪等性
- success ページでの PIN 表示
- オーナーへのメール通知
- エラー通知

**フェーズ 2**

- 顧客へのメール配信（Cloudflare Email Service / DNS 設定含む）

**フェーズ 3**

- LINE Messaging API
  - まずオーナー向け push 通知（userId 固定で確実に動く）
  - 次に顧客向けワンタイムコード → reply 配信

---

## 12. フロントエンド

サーバーサイドレンダリングのみ。クライアントフレームワークは使わない。

### 構成

- ページは3枚: `/`（注文フォーム）、`/success`、`/cancel`
- テンプレートは **Hono JSX**（`hono/jsx`）。wrangler の esbuild がそのまま `.tsx` を
  バンドルするため、追加のビルドステップ・React 依存は不要
- コンポーネント: `Layout` / `OrderForm` / `Success`

### Stripe.js を使わない

`POST /checkout` でサーバー側が Checkout Session を作成し、`303` で `session.url` へ
リダイレクトする。ブラウザ側に Stripe のスクリプトを読み込ませない。
結果としてフォームは JavaScript 無効でも動作する。

クライアント JS は合計金額のライブ表示（レンタル料金 + チェック済オプション）のみ。
素の JS で 30 行程度、インラインで持つ。金額はサーバー側で再計算・クランプするため、
この JS が動かなくても決済結果は正しい。

### スタイル

既存サイトの `global.css` は 2723 行あるため、インポートしない。

- `:root` のデザイントークン（約 25 行）のみ `payment/src/styles.ts` にコピーし、
  フォーム / success 用のスタイルを 150〜200 行あらためて書く
- 既存トークンに `--yokohama: #CE863F` / `--ofuna: #20AAD8` が定義済み。
  `<body data-space="ofuna">` を出力して、アクセント色（ヘッダー、送信ボタン）を
  店舗ごとに切り替える
- トークンはメインサイトと二重管理になるが 25 行程度。共有 CSS パッケージ化は
  この規模では割に合わない
- CSS は `<style>` としてインライン配信。Worker のレスポンス 1 本で完結させる
- フォントは既存と同じ Google Fonts。フォーム画面では `Noto Sans JP` のみでよい
  （`Bruno Ace` は英字見出し用）

---

## 13. TypeScript 設定

### tsconfig.json の要点

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx"
  }
}
```

`jsxImportSource` の指定が無いと React を解決しようとしてビルドが落ちる。

### バインディングの型

```
wrangler types
```

`wrangler.jsonc` の定義から `worker-configuration.d.ts` を生成する。手書きしない。
`package.json` に `"cf-typegen": "wrangler types"` を用意する。

Hono には型引数で渡す。

```ts
const app = new Hono<{ Bindings: Env }>()
```

これで `c.env.STRIPE_SECRET_KEY` や `c.env.PAYMENTS`（KV）が型付きで参照できる。

### 実行時バリデーション

TypeScript の型はコンパイル時に消える。以下の 3 つは信用できない入力として
Zod で実行時検証する（`@hono/zod-validator` をミドルウェアに挟む）。

1. 注文フォームの POST（金額、`space`、配信方法）
2. Stripe Webhook のペイロード
3. LINE Webhook のペイロード

金額のクランプもここで行う。

`type Space = 'yokohama' | 'ofuna'` をユニオン型で定義し、PIN の取得を `switch` で
網羅させる。店舗追加時にコンパイルエラーで検知できる。

### Stripe SDK の Workers 対応

`stripe` npm パッケージは Workers 上で動作するが、2 点の作法がある。

1. 初期化時に `httpClient: Stripe.createFetchHttpClient()` を指定する
   （Node の http モジュールを使わせない）
2. Webhook 検証は **`constructEventAsync()`** を使う。同期版の `constructEvent()` は
   Node の crypto 前提のため Workers では動かない（WebCrypto は非同期のため）

### 依存パッケージ

- 実行時: `hono` / `stripe` / `zod` / `@hono/zod-validator`
- 開発時: `typescript` / `wrangler`

型チェックは `tsc --noEmit` を独立したスクリプトで実行する。
wrangler のバンドルは esbuild のため型を検査しない。

---

## 14. 前提と未決事項

**前提**

- PIN のスコープ（Fire TV の購入 PIN はアカウント全体に有効でタイトル単位ではない）については
  制御しない。顧客を信頼する運用とする
- レンタル金額の過少入力は運用（利用後の確認）で対処する

**未決事項**
1. Stripe `custom_unit_amount` が Checkout `mode: 'payment'` で使えるか（要検証）
2. 既存 Worker の名前が `rental-space-sites`（リポジトリ名）になっている。
   命名規則を `<subdomain>-<role>` に揃えるなら `smart-hometheater-site` へ改名する。
   改名は新規 Worker としてのデプロイになり、旧 Worker のカスタムドメイン解除と削除が
   必要な一度きりの移行作業。今回の新規 Worker とは名前が衝突しないため、必須ではない
