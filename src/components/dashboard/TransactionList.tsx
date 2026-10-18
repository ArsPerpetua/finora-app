import { accountLabel, categoryFor, dateLabel, rupiah, summarize, type FinancialState, type Transaction } from '../../lib/finance'
import { Icon, type IconName } from './Icon'

export function TransactionList({ transactions, state }: { transactions: Transaction[]; state: FinancialState }) {
  const dates = [...new Set(transactions.map(tx => tx.tx_date))]
  return <div className="dash-transactions">
    {dates.map(date => {
      const rows = transactions.filter(tx => tx.tx_date === date)
      const net = summarize(rows).net
      return <section key={date} aria-label={dateLabel(date)} className="dash-day">
        <div className="dash-day-heading"><h3><time dateTime={date}>{dateLabel(date)}</time></h3><span className="dash-muted">{net > 0 ? '+' : ''}{rupiah(net)}</span></div>
        <ul className="dash-transaction-list">
          {rows.map(tx => {
            const category = categoryFor(tx, state)
            const icon: IconName = tx.type === 'transfer' ? 'transfer' : tx.type === 'income' ? 'income' : tx.cat_id === 'food' ? 'food' : 'tag'
            return <li key={tx.id} className="dash-transaction">
              <span className="dash-category-icon" style={{ color: category.color, backgroundColor: category.color + '18' }}><Icon name={icon} /></span>
              <div className="dash-transaction-info"><strong>{tx.title || category.name}</strong><span>{category.name} <span aria-hidden="true">·</span> {accountLabel(tx, state)}</span>{tx.note && <small>{tx.note}</small>}</div>
              <div className="dash-transaction-amount"><strong className={tx.type === 'income' ? 'dash-positive' : tx.type === 'expense' ? 'dash-negative' : ''}>{tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{rupiah(Number(tx.amount))}</strong><span>{tx.source === 'telegram' ? 'Telegram' : 'Web'}{tx.type === 'transfer' ? ' · Transfer' : ''}</span></div>
            </li>
          })}
        </ul>
      </section>
    })}
  </div>
}
