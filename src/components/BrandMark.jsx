import { Link } from 'react-router-dom'
import logoImg from '../assets/logo.png'
import wordmarkImg from '../assets/wordmark.png'

export default function BrandMark({ to = '/', light = false, className = '' }) {
  return (
    <Link to={to} className={`inline-flex w-fit items-center gap-2.5 ${className}`}>
      <img
        src={logoImg}
        alt="Logo JagaRoda"
        className="h-15 w-15 shrink-0 object-contain"
      />
      <img
        src={wordmarkImg}
        alt="JagaRoda"
        className={`h-5 sm:h-6 w-auto shrink-0 object-contain ${light ? '' : 'drop-shadow-[0_1px_2px_rgba(23,50,77,0.35)]'
          }`}
      />
    </Link>
  )
}

