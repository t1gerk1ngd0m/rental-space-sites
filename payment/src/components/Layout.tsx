import type { FC, PropsWithChildren } from 'hono/jsx';
import { raw } from 'hono/html';
import { CSS } from '../styles';
import { SPACES, type Space } from '../spaces';

type Props = PropsWithChildren<{
  title: string;
  space?: Space;
}>;

export const Layout: FC<Props> = ({ title, space, children }) => (
  <>
    {raw('<!DOCTYPE html>')}
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>{title} | SMART HOME THEATER</title>
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
      </head>
      <body data-space={space}>
        <div class="wrap">
          <header class="site-head">
            <h1>SMART HOME THEATER</h1>
            {space && <span class="space-name">{SPACES[space].name}</span>}
          </header>
          {children}
        </div>
      </body>
    </html>
  </>
);
