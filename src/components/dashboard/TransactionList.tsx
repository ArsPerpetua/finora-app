import { accountLabel, categoryFor, dateLabel, rupiah, summarize, transferFee, type FinancialState, type Transaction } from '../../lib/finance'
import { Icon, type IconName } from './Icon'

export function TransactionList({ transactions, state, onEdit, onDelete }: {
  transactions: Transaction[]; state: FinancialState; onEdit?: (tx: Transaction) => void; onDelete?: (tx: Transaction) => void
}) {
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
            const fee = transferFee(tx)
            const label = tx.title || category.name
            return <li key={tx.id} className="dash-transaction">
              <span className="dash-category-icon" style={{ color: category.color, backgroundColor: category.color + '18' }}><Icon name={category.icon as IconName} /></span>
              <div className="dash-transaction-info"><strong>{label}</strong><span>{category.name} <span aria-hidden="true">·</span> {accountLabel(tx, state)}{fee > 0 ? ` · biaya ${rupiah(fee)}` : ''}</span>{tx.note && <small>{tx.note}</small>}</div>
              <div className="dash-transaction-amount"><strong className={tx.type === 'income' ? 'dash-positive' : tx.type === 'expense' ? 'dash-negative' : ''}>{tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}{rupiah(Number(tx.amount))}</strong><span>{tx.source === 'telegram' ? 'Telegram' : 'Web'}{tx.type === 'transfer' ? ' · Transfer' : ''}</span></div>
              {(onEdit || onDelete) && <div className="dash-row-actions">
                {onEdit && <button type="button" aria-label={`Ubah transaksi ${label}`} onClick={() => onEdit(tx)}><Icon name="edit" size={15} /></button>}
                {onDelete && <button type="button" aria-label={`Hapus transaksi ${label}`} onClick={() => onDelete(tx)}><Icon name="trash" size={15} /></button>}
              </div>}
            </li>
          })}
        </ul>
      </section>
    })}
  </div>
}
