// src/lib/format.ts

/**
 * 格式化数字为简洁显示
 * 10 → "10"
 * 1500 → "1.5k"
 * 15000 → "15k"
 * 1500000 → "1.5m"
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString()
  }
  
  if (num < 1000000) {
    const k = num / 1000
    return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`
  }
  
  const m = num / 1000000
  return m % 1 === 0 ? `${m}m` : `${m.toFixed(1)}m`
}