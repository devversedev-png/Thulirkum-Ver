import { Link } from 'react-router-dom'
import { useStore } from '../context/StoreContext'
import BookCard from '../components/BookCard'

export default function ShortlistPage() {
  const { books, account } = useStore()
  const list = books.filter(book => account?.shortlist?.includes(book.id))

  return (
    <section className="page-width section min-page">
      <div className="page-title-row">
        <div><span className="eyebrow">Compare and decide</span><h1>My Shortlist</h1><p>{list.length} shortlisted books</p></div>
      </div>
      {list.length ? (
        <div className="book-grid">{list.map(book => <BookCard key={book.id} book={book} />)}</div>
      ) : (
        <div className="empty-state"><h3>No shortlisted books yet</h3><p>Use the shortlist button when you want to compare a few books before ordering.</p><Link className="primary-btn inline-btn" to="/shop">Find Books</Link></div>
      )}
    </section>
  )
}
