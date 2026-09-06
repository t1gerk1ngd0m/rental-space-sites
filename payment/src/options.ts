// TODO: 実際のオプション名・価格に置き換える。priceId は Stripe に Product を
// 登録した段階で追加する（決済処理の実装フェーズ）。
export type PaidOption = {
  id: string;
  name: string;
  description: string;
  amount: number;
};

export const PAID_OPTIONS: PaidOption[] = [
  {
    id: 'placeholder-a',
    name: '【仮】オプションA',
    description: '実際のオプション内容に差し替える',
    amount: 500,
  },
  {
    id: 'placeholder-b',
    name: '【仮】オプションB',
    description: '実際のオプション内容に差し替える',
    amount: 1000,
  },
];
