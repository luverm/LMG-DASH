import { Link } from 'react-router'
import { Shape } from '@/components/shapes/Shape'

export function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <Shape kind="triangle" size={48} />
      <h1 style={{ margin: '1rem 0' }}>Page not found</h1>
      <Link to="/">Back to today</Link>
    </div>
  )
}
