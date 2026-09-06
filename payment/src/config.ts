/** レンタル料金（顧客入力）の下限・上限。フォームの min/max とサーバー側クランプで共用する。 */
export const AMOUNT_MIN = 100;
export const AMOUNT_MAX = 10000;

export const DELIVERY_METHODS = ['page', 'email', 'line'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  page: 'この画面に表示',
  email: 'メールで受け取る',
  line: 'LINEで受け取る',
};
