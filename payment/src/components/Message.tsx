import type { FC, PropsWithChildren } from 'hono/jsx';
import type { Space } from '../spaces';

type Props = PropsWithChildren<{
  heading: string;
  space?: Space;
  showBack?: boolean;
}>;

export const Message: FC<Props> = ({ heading, children, showBack = true }) => (
  <section class="card">
    <h2>{heading}</h2>
    <div class="status">{children}</div>
    {showBack && (
      <a class="back-link" href="/">
        ← 入力画面に戻る
      </a>
    )}
  </section>
);
