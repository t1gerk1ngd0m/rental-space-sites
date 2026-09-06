import type { FC } from 'hono/jsx';
import { SPACES, SPACE_KEYS, type Space } from '../spaces';
import { PAID_OPTIONS } from '../options';
import { AMOUNT_MIN, AMOUNT_MAX, DELIVERY_METHODS, DELIVERY_LABELS } from '../config';

// 合計金額のライブ表示のみを担当する。金額の確定はサーバー側で行うため、
// このスクリプトが動作しなくても決済結果は変わらない。
const TOTAL_SCRIPT = `
(function () {
  var form = document.getElementById('order-form');
  if (!form) return;
  var out = document.getElementById('total-value');
  function update() {
    var data = new FormData(form);
    var total = parseInt(data.get('amount'), 10);
    if (!isFinite(total) || total < 0) total = 0;
    form.querySelectorAll('input[name="options"]:checked').forEach(function (el) {
      total += parseInt(el.dataset.amount, 10) || 0;
    });
    out.textContent = '\\u00A5' + total.toLocaleString('ja-JP');
  }
  form.addEventListener('input', update);
  update();
})();
`;

export const OrderForm: FC<{ space?: Space }> = ({ space }) => (
  <>
    <p class="lead">
      Prime Video の有料コンテンツをご覧いただくためのお支払いページです。
      お支払い後に、Fire TV の購入用 PIN コードをお伝えします。
    </p>

    <form id="order-form" method="post" action="/checkout">
      {space ? (
        <input type="hidden" name="space" value={space} />
      ) : (
        <section class="card">
          <h2>ご利用店舗</h2>
          <p class="hint">ご利用中の店舗を選択してください。</p>
          <div class="field">
            <select name="space" required>
              <option value="">選択してください</option>
              {SPACE_KEYS.map((key) => (
                <option value={key}>{SPACES[key].name}</option>
              ))}
            </select>
          </div>
        </section>
      )}

      <section class="card">
        <h2>レンタル料金</h2>
        <p class="hint">
          Amazon Prime Video に表示されている金額（税込）をそのまま入力してください。
        </p>
        <div class="field amount-row">
          <span class="yen">¥</span>
          <input
            type="number"
            name="amount"
            required
            min={AMOUNT_MIN}
            max={AMOUNT_MAX}
            step={1}
            inputmode="numeric"
            placeholder="500"
          />
        </div>
      </section>

      <section class="card">
        <h2>有料オプション</h2>
        <p class="hint">必要な場合のみ選択してください。</p>
        {PAID_OPTIONS.map((opt) => (
          <label class="choice">
            <input type="checkbox" name="options" value={opt.id} data-amount={opt.amount} />
            <span class="body">
              <span class="name">{opt.name}</span>
              <span class="desc">{opt.description}</span>
            </span>
            <span class="price">¥{opt.amount.toLocaleString('ja-JP')}</span>
          </label>
        ))}
      </section>

      <section class="card">
        <h2>PIN コードの受け取り方法</h2>
        <p class="hint">お支払い完了後の画面でも必ず表示されます。</p>
        {DELIVERY_METHODS.map((method) => (
          <label class="choice">
            <input type="radio" name="delivery" value={method} checked={method === 'page'} />
            <span class="body">
              <span class="name">{DELIVERY_LABELS[method]}</span>
            </span>
          </label>
        ))}
      </section>

      <section class="card">
        <div class="total">
          <span class="label">お支払い合計</span>
          <span class="value" id="total-value">¥0</span>
        </div>
      </section>

      <button type="submit">お支払いに進む</button>
      <p class="note">決済は Stripe の安全な決済ページで行われます。</p>
    </form>

    <script dangerouslySetInnerHTML={{ __html: TOTAL_SCRIPT }} />
  </>
);
