import type { Nft, User, Wallet } from "../domain/types";
const names = [
  "Emerald Ape #042",
  "Sage Nomad #009",
  "Neon Vessel #552",
  "Cosmic Bloom #118",
  "Violet Nomad #314",
  "Ivory Baron #088",
  "Golden Beat #207",
  "Golden Echo #121",
  "Golden Signal #160",
];
const prices = [
  "1.19",
  "1.69",
  "1.99",
  "1.29",
  "1.39",
  "1.79",
  "0.99",
  "0.79",
  "0.39",
];
const images = [
  "8f387.webp",
  "83794.webp",
  "9add2.webp",
  "83794.webp",
  "83794.webp",
  "9add2.webp",
  "b7cfc.webp",
  "b7cfc.webp",
  "b7cfc.webp",
];
export const collections = [
  "Arte digital",
  "Fotografia",
  "Música",
  "Arte 3D",
  "Colecionáveis",
  "Generativa",
  "Jogos",
  "Assinaturas",
  "Utilidade",
];
export const nfts: Nft[] = Array.from({ length: 36 }, (_, i) => ({
  id: `nft-${i + 1}`,
  name:
    i < 9
      ? names[i]
      : `${names[i % 9].split(" #")[0]} #${String(200 + i).padStart(3, "0")}`,
  price: prices[i % 9],
  image: `/assets/${images[i % 9]}`,
  collection: collections[Math.floor(i / 4)],
  network: (["Ethereum", "Polygon", "Solana"] as const)[Math.floor(i / 3) % 3],
  description:
    "Uma obra de uma coleção independente de arte digital. Personagens únicos, detalhes cuidadosamente criados e uma nova maneira de colecionar cultura.",
  version: 1,
  editions: [
    { id: "standard", label: "1/50", stock: 5 },
    { id: "rare", label: "1/10", stock: 2 },
    { id: "genesis", label: "1/1", stock: 0 },
  ],
  trending: i % 2 === 0,
  createdAt: 1790000000000 - i * 86400000,
}));
export const users: User[] = [
  {
    id: "user-1",
    name: "Nova Colecionadora",
    email: "nova@kurio.test",
    phone: "11999990000",
    avatar: "",
  },
  {
    id: "user-2",
    name: "Alex Criador",
    email: "alex@kurio.test",
    phone: "21999990000",
    avatar: "",
  },
];
export const wallets: Wallet[] = [
  {
    id: "wallet-1",
    label: "Principal",
    address: "0xA91F00000000000000000000000000000000E82C",
    network: "Ethereum",
    primary: true,
  },
  {
    id: "wallet-2",
    label: "Reserva",
    address: "nova.kurio.eth",
    network: "Polygon",
    primary: false,
  },
];
