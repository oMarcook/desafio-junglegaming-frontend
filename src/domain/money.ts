import type { Eth } from './types'
const SCALE = 10n ** 18n
export function wei(value: Eth): bigint {
  if (!/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('Valor ETH inválido')
  const [whole, decimal = ''] = value.split('.')
  return BigInt(whole) * SCALE + BigInt(decimal.padEnd(18, '0'))
}
export function eth(value: bigint): Eth {
  const fraction = (value % SCALE).toString().padStart(18, '0').replace(/0+$/, '')
  return `${value / SCALE}${fraction ? `.${fraction}` : ''}`
}
export const formatEth = (value: Eth) => `${value} ETH`
