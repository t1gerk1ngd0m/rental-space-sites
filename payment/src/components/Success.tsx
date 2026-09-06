import type { FC } from 'hono/jsx';
import { SPACES, type Space } from '../spaces';

type Props = {
  space: Space;
  pin?: string;
  amountTotal: number | null;
};

export const Success: FC<Props> = ({ space, pin, amountTotal }) => (
  <>
    <section class="card">
      <h2>お支払いが完了しました</h2>
      <p class="hint">
        {SPACES[space].name}
        {amountTotal !== null && ` / ¥${amountTotal.toLocaleString('ja-JP')}`}
      </p>
      {pin ? (
        <div class="pin-box">
          <div class="hint">Fire TV の購入用 PIN コード</div>
          <div class="pin">{pin}</div>
        </div>
      ) : (
        <p class="status">
          PIN コードの準備ができていません。お手数ですが、スタッフまでお声がけください。
        </p>
      )}
    </section>
    <section class="card">
      <h2>ご利用方法</h2>
      <p class="status">
        Fire TV で購入・レンタルの操作を進め、PIN コードの入力を求められたら上記の番号を
        入力してください。
      </p>
    </section>
  </>
);
