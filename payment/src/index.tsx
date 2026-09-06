import { Hono } from 'hono';
import Stripe from 'stripe';
import { Layout } from './components/Layout';
import { OrderForm } from './components/OrderForm';
import { Message } from './components/Message';
import { Success } from './components/Success';
import { isSpace } from './spaces';
import type { Bindings } from './bindings';
import { buildLineItems, createStripeClient, parseOrder, pinFor } from './checkout';

// 末尾スラッシュの有無どちらでも同じルートに解決させる（メインサイトが trailingSlash: always のため）
const app = new Hono<{ Bindings: Bindings }>({ strict: false });

app.get('/', (c) => {
  const raw = c.req.query('space');
  const space = isSpace(raw) ? raw : undefined;
  return c.html(
    <Layout title="お支払い" space={space}>
      <OrderForm space={space} />
    </Layout>,
  );
});

app.post('/checkout', async (c) => {
  const body = await c.req.parseBody({ all: true });
  const parsed = parseOrder(body);

  if (!parsed.success) {
    return c.html(
      <Layout title="入力内容をご確認ください">
        <Message heading="入力内容をご確認ください">
          金額は {String(body['amount'] ?? '')} 円として送信されました。
          店舗・金額・受け取り方法が正しく選択されているかご確認のうえ、もう一度お試しください。
        </Message>
      </Layout>,
      400,
    );
  }

  const order = parsed.data;
  const origin = new URL(c.req.url).origin;
  const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'ja',
      line_items: buildLineItems(order),
      metadata: {
        space: order.space,
        delivery: order.delivery,
        options: order.options.join(','),
      },
      success_url: `${origin}/success/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel/`,
    });

    if (!session.url) throw new Error('Checkout Session に url が含まれていません');
    return c.redirect(session.url, 303);
  } catch (e) {
    console.error('checkout.sessions.create failed', e);
    return c.html(
      <Layout title="エラー" space={order.space}>
        <Message heading="決済ページを開けませんでした">
          時間をおいてもう一度お試しください。解消しない場合はスタッフまでお声がけください。
        </Message>
      </Layout>,
      500,
    );
  }
});

app.get('/success', async (c) => {
  const sessionId = c.req.query('session_id');
  if (!sessionId) {
    return c.html(
      <Layout title="お支払い情報が見つかりません">
        <Message heading="お支払い情報が見つかりません">
          お支払い完了後のリンクからアクセスしてください。
        </Message>
      </Layout>,
      400,
    );
  }

  const stripe = createStripeClient(c.env.STRIPE_SECRET_KEY);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    console.error('checkout.sessions.retrieve failed', e);
    return c.html(
      <Layout title="お支払い情報が見つかりません">
        <Message heading="お支払い情報が見つかりません">
          リンクが正しいかご確認ください。
        </Message>
      </Layout>,
      404,
    );
  }

  // リダイレクト先の URL だけを根拠に PIN を表示しない。必ず Stripe 側の状態を検証する。
  if (session.payment_status !== 'paid') {
    return c.html(
      <Layout title="お支払いが確認できません">
        <Message heading="お支払いが確認できません">
          お支払いがまだ完了していないか、処理中の可能性があります。
        </Message>
      </Layout>,
      402,
    );
  }

  const space = session.metadata?.space;
  if (!isSpace(space)) {
    console.error('session metadata に有効な space がありません', sessionId);
    return c.html(
      <Layout title="エラー">
        <Message heading="お支払い情報を読み取れませんでした">
          スタッフまでお声がけください。
        </Message>
      </Layout>,
      500,
    );
  }

  return c.html(
    <Layout title="お支払い完了" space={space}>
      <Success space={space} pin={pinFor(c.env, space)} amountTotal={session.amount_total} />
    </Layout>,
  );
});

app.get('/cancel', (c) =>
  c.html(
    <Layout title="お支払いのキャンセル">
      <Message heading="お支払いはキャンセルされました">料金は請求されていません。</Message>
    </Layout>,
  ),
);

// Stripe の Webhook エンドポイント登録用のスタブ。
// 署名検証（constructEventAsync）と履行処理は次フェーズで差し替える。
// TODO: 署名検証を入れるまでは受信内容を一切信用しない。
app.post('/webhooks/stripe', (c) => c.text('ok', 200));

app.notFound((c) =>
  c.html(
    <Layout title="ページが見つかりません">
      <Message heading="ページが見つかりません">{''}</Message>
    </Layout>,
    404,
  ),
);

app.onError((err, c) => {
  console.error('unhandled error', err);
  return c.html(
    <Layout title="エラー">
      <Message heading="エラーが発生しました">
        時間をおいてもう一度お試しください。
      </Message>
    </Layout>,
    500,
  );
});

export default app;
