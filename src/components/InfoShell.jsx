import { Link, NavLink } from 'react-router-dom'
import { INFO_LINKS, SITE } from '../data/siteInfo'
import '../pages/InfoPages.css'

export default function InfoShell({ eyebrow, title, intro, children, updated = false }) {
  return (
    <section className="info-page min-page">
      <div className="info-hero">
        <div className="page-width info-hero-inner">
          <div>
            <div className="breadcrumbs">
              <Link to="/home">Home</Link> &nbsp;›&nbsp; {title}
            </div>
            {eyebrow && <span className="info-eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {intro && <p>{intro}</p>}
          </div>
          <blockquote>“A reader lives a<br />thousand lives.”</blockquote>
        </div>
      </div>

      <div className="page-width info-layout">
        <aside className="info-side">
          <h4>Help &amp; Information</h4>
          <nav>
            {INFO_LINKS.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="info-side-card">
            <strong>Need a hand?</strong>
            <p>Our team replies within one working day.</p>
            <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a>
          </div>
        </aside>

        <article className="info-content">
          {children}
          {updated && <p className="info-updated">Last updated: {SITE.lastUpdated}</p>}
        </article>
      </div>
    </section>
  )
}

export function InfoCard({ icon, title, children }) {
  return (
    <div className="info-card">
      {icon && <span className="info-card-icon">{icon}</span>}
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  )
}

export function InfoSection({ title, children }) {
  return (
    <section className="info-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function InfoCta({ title, text, to, label }) {
  return (
    <div className="info-cta">
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      <Link className="primary-btn" to={to}>{label}</Link>
    </div>
  )
}
