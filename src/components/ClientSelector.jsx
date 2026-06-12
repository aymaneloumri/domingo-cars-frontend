import { useState, useEffect, useRef } from 'react'
import { API_BASE } from '../utils/config'

export default function ClientSelector({ onSelect, token, placeholder, value }) {
  const [search, setSearch] = useState(value || '')
  const [clients, setClients] = useState([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchClients = async () => {
      if (search.length < 1) { setClients([]); setOpen(false); return }
      try {
        const res = await fetch(
          `${API_BASE}/api/clients?search=${encodeURIComponent(search)}`,
          { headers: { 'x-admin-token': token } }
        )
        const data = await res.json()
        setClients(data)
        setOpen(true)
      } catch (err) {
        console.error('ClientSelector error:', err)
      }
    }
    const timer = setTimeout(fetchClients, 300)
    return () => clearTimeout(timer)
  }, [search, token])

  const handleSelect = (client) => {
    if (client.blacklisted) {
      const ok = window.confirm(
        `⚠️ ATTENTION: Client BLACKLISTÉ!\n\nRaison: ${client.blacklist_reason || 'Non spécifiée'}\n\nContinuer quand même?`
      )
      if (!ok) return
    }
    setSelected(client)
    setSearch(client.nom_prenom)
    setOpen(false)
    setClients([])
    onSelect(client)
  }

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <input
        value={search}
        onChange={(e) => { setSearch(e.target.value); setSelected(null) }}
        placeholder={placeholder || '🔍 Rechercher un client (nom, CIN, téléphone...)'}
        style={{
          width: '100%',
          background: '#0d0b08',
          border: `0.5px solid ${selected ? '#FF6B00' : '#2a2010'}`,
          color: '#c9a87c',
          padding: '10px 14px',
          borderRadius: '4px',
          fontFamily: 'DM Sans',
          fontSize: '13px',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />
      {open && clients.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#111', border: '0.5px solid #2a2010',
          borderRadius: '4px', zIndex: 9999,
          maxHeight: '220px', overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {clients.map(client => (
            <div key={client.id} onClick={() => handleSelect(client)}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid #1a1a1a', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1a1508'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ color: client.blacklisted ? '#e24b4a' : '#fff', fontSize: '13px', fontFamily: 'DM Sans', fontWeight: 500 }}>
                {client.blacklisted ? '🚫 ' : ''}{client.nom_prenom}
              </div>
              <div style={{ color: '#5a4a2a', fontSize: '11px', fontFamily: 'DM Sans', marginTop: '2px' }}>
                {client.cin_passport && `CIN: ${client.cin_passport}`}
                {client.cin_passport && client.telephone && ' — '}
                {client.telephone && `📞 ${client.telephone}`}
              </div>
            </div>
          ))}
        </div>
      )}
      {open && clients.length === 0 && search.length > 1 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#111', border: '0.5px solid #2a2010',
          borderRadius: '4px', padding: '12px 14px', zIndex: 9999,
        }}>
          <span style={{ color: '#5a4a2a', fontSize: '12px', fontFamily: 'DM Sans' }}>
            Aucun client trouvé —{' '}
          </span>
          <span style={{ color: '#FF6B00', fontSize: '12px', cursor: 'pointer', fontFamily: 'DM Sans' }}
            onClick={() => setOpen(false)}>
            Saisir manuellement
          </span>
        </div>
      )}
    </div>
  )
}
