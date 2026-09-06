import { Hono } from 'hono';
import { Layout } from './components/Layout';
import { OrderForm } from './components/OrderForm';
import { isSpace } from './spaces';

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => {
  const raw = c.req.query('space');
  const space = isSpace(raw) ? raw : undefined;
  return c.html(
    <Layout title="お支払い" space={space}>
      <OrderForm space={space} />
    </Layout>,
  );
});

// TODO: Stripe Checkout Session の作成に差し替える（決済処理の実装フェーズ）
app.post('/checkout', (c) =>
  c.html(
    <Layout title="準備中">
      <section class="card">
        <h2>準備中</h2>
        <p class="status">決済機能は現在準備中です。しばらくお待ちください。</p>
        <a class="back-link" href="/">
          ← 入力画面に戻る
        </a>
      </section>
    </Layout>,
    501,
  ),
);

// TODO: Stripe API で payment_status を検証したうえで PIN を表示する
app.get('/success', (c) =>
  c.html(
    <Layout title="お支払い完了">
      <section class="card">
        <h2>準備中</h2>
        <p class="status">決済機能は現在準備中です。</p>
      </section>
    </Layout>,
  ),
);

app.get('/cancel', (c) =>
  c.html(
    <Layout title="お支払いのキャンセル">
      <section class="card">
        <h2>お支払いはキャンセルされました</h2>
        <p class="status">料金は請求されていません。</p>
        <a class="back-link" href="/">
          ← 入力画面に戻る
        </a>
      </section>
    </Layout>,
  ),
);

// Stripe の Webhook エンドポイント登録用のスタブ。
// 署名検証（constructEventAsync）と履行処理は決済実装フェーズで差し替える。
// TODO: 署名検証を入れるまでは受信内容を一切信用しない。
app.post('/webhooks/stripe', (c) => c.text('ok', 200));

app.notFound((c) =>
  c.html(
    <Layout title="ページが見つかりません">
      <section class="card">
        <h2>ページが見つかりません</h2>
        <a class="back-link" href="/">
          ← 入力画面に戻る
        </a>
      </section>
    </Layout>,
    404,
  ),
);

export default app;
