export type Eth = string;
export type Network = "Ethereum" | "Polygon" | "Solana";
export interface Edition {
  id: string;
  label: string;
  stock: number;
}
export interface Nft {
  id: string;
  name: string;
  collection: string;
  network: Network;
  price: Eth;
  image: string;
  description: string;
  version: number;
  editions: Edition[];
  trending: boolean;
  createdAt: number;
}
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  username?: string;
  ens?: string;
  walletLabel?: string;
}
export interface Session {
  user: User | null;
  expiresAt: number | null;
}
export interface Wallet {
  id: string;
  label: string;
  address: string;
  network: Network;
  primary: boolean;
  displayName?: string;
  profileName?: string;
  email?: string;
  provider?: string;
  referral?: string;
  ens?: string;
}
export interface CartItem {
  nftId: string;
  editionId: string;
  quantity: number;
}
export interface Cart {
  items: CartItem[];
  coupon: string;
  version: number;
}
export interface QuoteLine extends CartItem {
  name: string;
  image: string;
  edition: string;
  price: Eth;
  total: Eth;
  nftVersion: number;
  available: number;
}
export interface Quote {
  id: string;
  items: QuoteLine[];
  subtotal: Eth;
  discount: Eth;
  fee: Eth;
  total: Eth;
  coupon: string;
  expiresAt: number;
  valid: boolean;
  issues: string[];
}
export interface Order {
  id: string;
  userId: string;
  status: "pending" | "confirmed" | "declined";
  version: number;
  quote: Quote;
  wallet: Wallet;
  collector: {
    name: string;
    email: string;
    phone: string;
    username?: string;
    profileName?: string;
    ens?: string;
    referral?: string;
    note?: string;
  };
  transaction: string;
  createdAt: number;
  settleAt: number;
  outcome: "confirmed" | "declined";
}
export interface ResourceEvent {
  id: string;
  resourceId: string;
  version: number;
  userId?: string;
}
export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}
export interface CatalogSearch {
  q: string;
  collections: string;
  networks: string;
  min: string;
  max: string;
  sort: string;
  page: number;
  tab: string;
}
export interface CatalogResult {
  items: Nft[];
  total: number;
  pages: number;
  page: number;
  collections: Record<string, number>;
}
export type Scenario =
  | "default"
  | "empty"
  | "slow"
  | "variable-latency"
  | "offline"
  | "server-error"
  | "expired-session"
  | "validation-error"
  | "favorite-error"
  | "payment-declined"
  | "order-timeout"
  | "price-change"
  | "sold-out";
