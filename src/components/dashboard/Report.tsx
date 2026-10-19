import { cashFlow, categoryComparison, monthLabel, rupiah, shiftMonth, summarize, type FinancialState, type Transaction } from '../../lib/finance'
import { CashFlowChart } from './CashFlowChart'
import { EmptyState } from './Dashboard'
import { Icon, type IconName } from './Icon'

function rateLabel(rate: number | null): string {
  return rate === null ? '–' : `${Math.round(rate * 100)}%`
}

function changeLabel(change: number | null): string {
  if (change === null) return 'Baru'
  return `${change > 0 ? '+' : ''}${change}%`
}

function Stat({ icon, label, value, tone, delta, deltaGoodWhen = 'up' }: {
  icon: IconName; label: string; value: string; tone?: string; delta?: number | null; deltaGoodWhen?: 'up' | 'down'
}) {
  const good = delta != null && (deltaGoodWhen === 'up' ? delta >= 0 : delta <= 0)
  return <section className="dash-stat">
    <span className="dash-stat-icon"><Icon name={icon} /></span>
    <div><h2>{label}</h2><strong className={tone}>{value}</strong>
      {delta != null && <p className={good ? 'dash-positive' : 'dash-negative'}>{delta > 0 ? '+' : ''}{delta}% dari bulan lalu</p>}
    </div>
  </section>
}

export function ReportScreen({ transactions, state, month }: { transactions: Transaction[]; state: FinancialState; month: string }) {
  const previousMonth = shiftMonth(month, -1)
  const selected = transactions.filter(tx => tx.tx_date.startsWith(month + '-'))
  const previousSelected = transactions.filter(tx => tx.tx_date.startsWith(previousMonth + '-'))
  const current = summarize(selected)
  const previous = summarize(previousSelected)
  const flow = cashFlow(transactions, month)
  const categories = categoryComparison(selected, previousSelected, state)
  const incomeDelta = previous.income > 0 ? Math.round((current.income - previous.income) / previous.income * 100) : null
  const expenseDelta = previous.expense > 0 ? Math.round((current.expense - previous.expense) / previous.expense * 100) : null

  return <div className="dash-grid">
    <div className="dash-stats dash-span-12">
      <Stat icon="income" label="Pemasukan" value={rupiah(current.income)} delta={incomeDelta} deltaGoodWhen="up" />
      <Stat icon="expense" label="Pengeluaran" value={rupiah(current.expense)} delta={expenseDelta} deltaGoodWhen="down" />
      <Stat icon="transfer" label="Arus kas bersih" value={rupiah(current.net)} tone={current.net >= 0 ? 'dash-positive' : 'dash-negative'} />
      <Stat icon="chart" label="Savings rate" value={rateLabel(current.rate)} />
    </div>

    <section className="dash-card dash-span-12" aria-labelledby="report-flow-title">
      <div className="dash-card-heading"><h2 id="report-flow-title">Pemasukan vs pengeluaran, 6 bulan</h2>
        <div className="dash-chart-legend"><span><i className="is-income" />Pemasukan</span><span><i className="is-expense" />Pengeluaran</span></div>
      </div>
      {flow.some(point => point.income || point.expense) ? <CashFlowChart flow={flow} /> : <EmptyState title="Belum ada data">Grafik akan terisi setelah ada transaksi pada beberapa bulan terakhir.</EmptyState>}
    </section>

    <section className="dash-card dash-span-12" aria-labelledby="report-cat-title">
      <div className="dash-card-heading"><h2 id="report-cat-title">Kategori pengeluaran {monthLabel(month)}</h2></div>
      {categories.length
        ? <div className="dash-table-scroll"><table>
          <thead><tr><th scope="col">Kategori</th><th scope="col">Jumlah</th><th scope="col">Porsi</th><th scope="col">Bulan lalu</th><th scope="col">Perubahan</th></tr></thead>
          <tbody>{categories.map(item => <tr key={item.id}>
            <th scope="row"><span className="dash-color-dot" style={{ background: item.color, marginRight: 8 }} />{item.name}</th>
            <td>{rupiah(item.amount)}</td>
            <td>{Math.round(item.share * 100)}%</td>
            <td>{rupiah(item.previousAmount)}</td>
            <td className={item.changePercent === null ? '' : item.changePercent > 0 ? 'dash-negative' : 'dash-positive'}>{changeLabel(item.changePercent)}</td>
          </tr>)}</tbody>
        </table></div>
        : <EmptyState title="Belum ada pengeluaran">Kategori pengeluaran akan tampil di sini setelah ada transaksi pada bulan ini.</EmptyState>}
    </section>

    <section className="dash-card dash-span-12" aria-labelledby="report-months-title">
      <div className="dash-card-heading"><h2 id="report-months-title">Perbandingan 6 bulan</h2></div>
      <div className="dash-table-scroll"><table>
        <thead><tr><th scope="col">Bulan</th><th scope="col">Pemasukan</th><th scope="col">Pengeluaran</th><th scope="col">Bersih</th><th scope="col">Savings rate</th></tr></thead>
        <tbody>{[...flow].reverse().map(point => <tr key={point.month}>
          <th scope="row">{monthLabel(point.month)}</th>
          <td>{rupiah(point.income)}</td>
          <td>{rupiah(point.expense)}</td>
          <td className={point.net >= 0 ? 'dash-positive' : 'dash-negative'}>{rupiah(point.net)}</td>
          <td>{rateLabel(point.rate)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </div>
}
