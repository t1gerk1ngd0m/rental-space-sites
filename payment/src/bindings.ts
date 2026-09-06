// wrangler types が生成する Env にはシークレットが含まれないため、ここで明示する。
// PIN_* は未登録の状態がありうるので optional。
export type Bindings = Env & {
  STRIPE_SECRET_KEY: string;
  PIN_YOKOHAMA?: string;
  PIN_OFUNA?: string;
};
