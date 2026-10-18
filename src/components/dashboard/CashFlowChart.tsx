import { useId } from 'react'
import { monthLabel, rupiah, type cashFlow } from '../../lib/finance'

type Flow = ReturnType<typeof cashFlow>

export function CashFlowChart({ flow }: { flow: Flow }) {
  const id = useId()
  const width = 640, height = 235, left = 62, right = 26, top = 16, bottom = 35
  const maximum = Math.max(1, ...flow.flatMap(point => [point.income, point.expense])) * 1.15
  const x = (index: number) => left + index * (width - left - right) / 5
  const y = (amount: number) => top + (1 - amount / maximum) * (height - top - bottom)
  const path = (key: 'income' | 'expense') => flow.map((point, index) => `${index ? 'L' : 'M'} ${x(index)} ${y(point[key])}`).join(' ')
  const compact = (amount: number) => new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
  return <>
    <svg viewBox={`0 0 ${width} ${height}`} className="dash-chart" role="img" aria-labelledby={id}>
      <title id={id}>Pemasukan dan pengeluaran selama enam bulan. Rincian nominal tersedia di bawah grafik.</title>
      <defs><linearGradient id={id + '-fill'} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ok)" stopOpacity=".16" /><stop offset="100%" stopColor="var(--ok)" stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3].map(index => {
        const amount = maximum * index / 3
        return <g key={index}><line x1={left} x2={width - right} y1={y(amount)} y2={y(amount)} className="dash-chart-grid" /><text x={left - 10} y={y(amount) + 4} textAnchor="end" className="dash-chart-label">{compact(amount)}</text></g>
      })}
      <path d={`${path('income')} L ${x(5)} ${y(0)} L ${x(0)} ${y(0)} Z`} fill={`url(#${id}-fill)`} />
      <path d={path('income')} className="dash-chart-line dash-positive" />
      <path d={path('expense')} className="dash-chart-line dash-negative" strokeDasharray="5 4" />
      {flow.map((point, index) => <g key={point.month}><circle cx={x(index)} cy={y(point.income)} r="3.5" fill="var(--ok)"><title>{monthLabel(point.month)}: pemasukan {rupiah(point.income)}</title></circle><circle cx={x(index)} cy={y(point.expense)} r="3.5" fill="var(--err)"><title>{monthLabel(point.month)}: pengeluaran {rupiah(point.expense)}</title></circle><text x={x(index)} y={height - 9} textAnchor="middle" className="dash-chart-label">{monthLabel(point.month, true)}</text></g>)}
    </svg>
    <details className="dash-chart-details"><summary>Lihat rincian arus kas</summary><div className="dash-table-scroll"><table><caption className="sr-only">Rincian arus kas enam bulan dalam rupiah</caption><thead><tr><th scope="col">Bulan</th><th scope="col">Pemasukan</th><th scope="col">Pengeluaran</th></tr></thead><tbody>{flow.map(point => <tr key={point.month}><th scope="row">{monthLabel(point.month)}</th><td>{rupiah(point.income)}</td><td>{rupiah(point.expense)}</td></tr>)}</tbody></table></div></details>
  </>
}
