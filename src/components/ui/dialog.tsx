import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
export function Dialog({ open, onOpenChange, title, children }: { open:boolean; onOpenChange:(v:boolean)=>void; title:string; children:ReactNode }) {
 return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/75"/><DialogPrimitive.Content aria-describedby={undefined} className="dialog-content"><DialogPrimitive.Title className="text-xl font-bold mb-6">{title}</DialogPrimitive.Title>{children}<DialogPrimitive.Close className="absolute right-4 top-4 p-2" aria-label="Fechar"><X size={20}/></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>
}
