import type { Cart, Nft, Order, Quote, ResourceEvent, Scenario, User, Wallet } from '../domain/types'
import { eth, wei } from '../domain/money'
import { nfts, users, wallets } from './fixtures'

interface Account { user: User; salt: string; hash: string; favorites: string[]; cart: Cart; wallets: Wallet[] }
interface Database { schema: number; accounts: Account[]; nfts: Nft[]; guest: Cart; session: { userId: string; expiresAt: number } | null; orders: Order[]; attempts: Record<string,{ body: string; orderId: string }>; scenario: Scenario; sequence: number }
const KEY = 'kurio.mock.database.v1'
const emptyCart = (): Cart => ({ items: [], coupon: '', version: 1 })
export let db: Database
export const save = () => localStorage.setItem(KEY, JSON.stringify(db))
export async function hashPassword(password: string, salt: string) {
 const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
 const bits = await crypto.subtle.deriveBits({ name:'PBKDF2', salt:new TextEncoder().encode(salt), iterations:100000, hash:'SHA-256' }, key, 256)
 return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2,'0')).join('')
}
export async function reset(scenario: Scenario = 'default') {
 const accounts = await Promise.all(users.map(async user => { const salt=crypto.randomUUID(); return { user:structuredClone(user), salt, hash:await hashPassword('Kurio123!',salt), favorites:[], cart:emptyCart(), wallets:structuredClone(wallets) } }))
 db = { schema:1, accounts, nfts:structuredClone(nfts), guest:emptyCart(), session:null, orders:[], attempts:{}, scenario, sequence:0 }; save()
}
export async function initialize() { try { const stored = JSON.parse(localStorage.getItem(KEY) || 'null'); if(stored?.schema === 1) db=stored; else await reset() } catch { await reset() } }
export function account() { if(db.session && db.session.expiresAt <= Date.now()) { db.session=null; save() } return db.accounts.find(a=>a.user.id===db.session?.userId) }
export const cart = () => account()?.cart ?? db.guest
export function quote(): Quote {
 const current=cart(); const issues:string[]=[]
 const items=current.items.map(item=>{ const nft=db.nfts.find(n=>n.id===item.nftId)!; const edition=nft.editions.find(e=>e.id===item.editionId)!; if(edition.stock<item.quantity) issues.push(`${nft.name}: disponibilidade insuficiente`); return { ...item, name:nft.name, image:nft.image, edition:edition.label, price:nft.price, total:eth(wei(nft.price)*BigInt(item.quantity)), nftVersion:nft.version, available:edition.stock } })
 const subtotal=items.reduce((sum,item)=>sum+wei(item.total),0n); const discount=current.coupon==='KURIO10' ? subtotal/10n:0n; const fee=items.length ? wei('0.016'):0n
 const fingerprint=JSON.stringify({items:items.map(i=>[i.nftId,i.editionId,i.quantity,i.price,i.nftVersion,i.available]),coupon:current.coupon,fee:eth(fee)})
 // The mock keeps a deterministic content token; a real backend would sign it.
 const id=Array.from(new TextEncoder().encode(fingerprint),b=>b.toString(16).padStart(2,'0')).join('')
 return { id, items, subtotal:eth(subtotal), discount:eth(discount), fee:eth(fee), total:eth(subtotal-discount+fee), coupon:current.coupon, expiresAt:Date.now()+60000, valid:items.length>0&&!issues.length, issues }
}
type EventName = 'nft.updated' | 'order.updated'
let publish: (name:EventName,event:ResourceEvent)=>void = () => {}
export const setPublisher = (callback:typeof publish) => { publish=callback }
export function emit(name:EventName,resourceId:string,version:number,userId?:string) { const event={ id:`event-${++db.sequence}`, resourceId,version,userId }; publish(name,event); save(); return event }
export function updateNft(id:string,soldOut=false) { const nft=db.nfts.find(n=>n.id===id); if(!nft)return; nft.version++; if(soldOut)nft.editions.forEach(e=>e.stock=0); else nft.price=eth(wei(nft.price)+wei('0.1')); save(); return emit('nft.updated',id,nft.version) }
export function settle(order:Order) {
 if(order.status!=='pending'||Date.now()<order.settleAt)return
 const owner=db.accounts.find(a=>a.user.id===order.userId)!
 const available=order.quote.items.every(i=>(db.nfts.find(n=>n.id===i.nftId)?.editions.find(e=>e.id===i.editionId)?.stock??0)>=i.quantity)
 order.status=available?order.outcome:'declined'; order.version++
 if(order.status==='confirmed') {
  for(const item of order.quote.items) { const nft=db.nfts.find(n=>n.id===item.nftId)!; nft.editions.find(e=>e.id===item.editionId)!.stock-=item.quantity; nft.version++; const existing=owner.cart.items.find(i=>i.nftId===item.nftId&&i.editionId===item.editionId); if(existing)existing.quantity=Math.max(0,existing.quantity-item.quantity); emit('nft.updated',nft.id,nft.version) }
  owner.cart.items=owner.cart.items.filter(i=>i.quantity>0); owner.cart.version++; if(!owner.cart.items.length)owner.cart.coupon=''
 }
 save(); emit('order.updated',order.id,order.version,order.userId)
}
export function schedule(order:Order) { setTimeout(()=>settle(order),Math.max(0,order.settleAt-Date.now())+10) }
