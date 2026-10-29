import { io } from 'socket.io-client'
import type { QueryClient } from '@tanstack/react-query'
import type { ResourceEvent } from '../domain/types'
export function connectRealtime(client:QueryClient,userId:string|undefined,notify:(message:string)=>void,onStatus:(online:boolean)=>void) {
 const socket=io('https://realtime.kurio.test',{transports:['websocket'],reconnectionDelay:500});const versions=new Map<string,number>();let active=true
 function reconcile(){if(!active)return;onStatus(true);for(const key of ['catalog','nft','cart','quote','order'])void client.invalidateQueries({queryKey:[key],refetchType:'active'})}
 function receive(type:'nft'|'order',event:ResourceEvent){if(!active||event.userId&&event.userId!==userId)return;const key=`${type}:${event.resourceId}`;if(event.version<=(versions.get(key)||0))return;versions.set(key,event.version);if(type==='nft'){for(const prefix of ['catalog','nft','cart','quote'])void client.invalidateQueries({queryKey:[prefix]});notify('Preço ou disponibilidade atualizado. Revise seu carrinho antes de comprar.')}else{void client.invalidateQueries({queryKey:['order',userId,event.resourceId]});void client.invalidateQueries({queryKey:['orders',userId]});void client.invalidateQueries({queryKey:['cart']});void client.invalidateQueries({queryKey:['quote']})}}
 socket.on('connect',reconcile);socket.on('disconnect',()=>onStatus(false));socket.on('connect_error',()=>onStatus(false));socket.on('nft.updated',event=>receive('nft',event));socket.on('order.updated',event=>receive('order',event))
 return {disconnect:()=>socket.disconnect(),reconnect:()=>socket.connect(),dispose:()=>{active=false;socket.removeAllListeners();socket.disconnect()}}
}
