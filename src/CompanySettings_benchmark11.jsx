import React from 'react';

const SUPA_URL = 'https://qktkeanebozuhwbrxdlg.supabase.co';
const SUPA_KEY = 'sb_publishable_FjZb5TpEXHR1KY4w_nK0aA_CYRrcjSp';
const HDR = { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json' };

export default function CompanySettings() {
  const [settings, setSettings] = React.useState({
    company_name: 'Maharaja Engineers & Contractors',
    company_sub: 'Building Excellence Across Kerala, Tamil Nadu & Karnataka',
    address: '555 H1, Malayil Majesty, Thripunithura — 682306, Kerala',
    gstin: '32ABEFM8620R1ZU',
    phone: '',
    email: 'info@maharajaec.com',
    website: '',
    logo_url: '',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const fileRef = React.useRef(null);

  // Load settings from Supabase
  React.useEffect(() => {
    fetch(SUPA_URL + '/rest/v1/company_settings?id=eq.1', { headers: HDR })
      .then(r => r.json())
      .then(d => {
        if (d && d[0]) setSettings(d[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setMsg('');
    try {
      const r = await fetch(SUPA_URL + '/rest/v1/company_settings?id=eq.1', {
        method: 'PATCH',
        headers: { ...HDR, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ ...settings, updated_at: new Date().toISOString() })
      });
      if (r.ok) { setSaved(true); setMsg('Settings saved successfully!'); setTimeout(() => setSaved(false), 3000); }
      else { setMsg('Save failed. Please try again.'); }
    } catch { setMsg('Connection error.'); }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setMsg('');
    try {
      const ext = file.name.split('.').pop();
      const name = 'company_logo_' + Date.now() + '.' + ext;
      const r = await fetch(SUPA_URL + '/storage/v1/object/company-assets/' + name, {
        method: 'POST',
        headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY, 'Content-Type': file.type },
        body: file
      });
      if (r.ok) {
        const url = SUPA_URL + '/storage/v1/object/public/company-assets/' + name;
        setSettings(p => ({ ...p, logo_url: url }));
        setMsg('Logo uploaded! Click Save Settings to apply.');
      } else { setMsg('Logo upload failed.'); }
    } catch { setMsg('Upload error.'); }
    setUploading(false);
    e.target.value = '';
  };

  const C = {
    card: '#fff', border: '#e5e7eb', text: '#111', sub: '#6b7280',
    accent: '#dc2626', bg: '#f9fafb'
  };

  const [storage, setStorage] = React.useState(null);
  const STORAGE_LIMIT_BYTES = 500 * 1024 * 1024;
  const BUCKET_META = {
    'task-photos': { label: 'Photos', color: '#3b82f6' },
    'chat-images': { label: 'Chat', color: '#a855f7' },
    'po-attachments': { label: 'PO', color: '#f59e0b' },
    'signatures': { label: 'Signatures', color: '#10b981' },
    'company-assets': { label: 'Assets', color: '#ef4444' },
  };
  React.useEffect(() => {
    fetch(SUPA_URL + '/rest/v1/rpc/get_storage_usage', { method: 'POST', headers: HDR, body: JSON.stringify({}) })
      .then(r => r.ok ? r.json() : [])
      .then(d => setStorage(Array.isArray(d) ? d : []))
      .catch(() => setStorage([]));
  }, []);
  const totalBytes = storage ? storage.reduce((s, b) => s + (Number(b.total_bytes) || 0), 0) : 0;
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const freeMB = ((STORAGE_LIMIT_BYTES - totalBytes) / (1024 * 1024)).toFixed(1);
  const pct = ((totalBytes / STORAGE_LIMIT_BYTES) * 100).toFixed(1);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: C.sub }}>Loading settings...</div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 22, fontWeight: 700, color: C.text }}>
          Company Settings
        </div>
        <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
          These details appear on all Purchase Orders and official documents
        </div>
      </div>

      {/* Storage Usage */}
      <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: '14px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>Storage</div>
          <div style={{ fontSize: 11, color: C.sub }}>{storage === null ? 'Loading...' : `${usedMB} MB / 500 MB · ${pct}%`}</div>
        </div>
        <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: '#f0f0f0', marginBottom: 8 }}>
          {storage && storage.map(b => {
            const meta = BUCKET_META[b.bucket_id] || { label: b.bucket_id, color: '#9ca3af' };
            const widthPct = (Number(b.total_bytes) / STORAGE_LIMIT_BYTES) * 100;
            return <div key={b.bucket_id} title={`${meta.label}: ${(Number(b.total_bytes)/(1024*1024)).toFixed(1)} MB`} style={{ width: widthPct + '%', background: meta.color }} />;
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(BUCKET_META).map(([key, meta]) => (
            <div key={key} style={{ fontSize: 10.5, color: C.sub, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: meta.color, display: 'inline-block' }} />
              {meta.label}
            </div>
          ))}
        </div>
      </div>

      {/* Logo Section */}
      <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
          Company Logo
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Logo Preview */}
          <div style={{
            width: 120, height: 80, border: '2px dashed ' + C.border, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: C.bg, flexShrink: 0, overflow: 'hidden'
          }}>
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#ccc' }}>
                <div style={{ fontSize: 24 }}>🏢</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>No logo</div>
              </div>
            )}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              disabled={uploading}
              style={{ padding: '10px 20px', background: C.text, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}
            >
              {uploading ? 'Uploading...' : '📁 Upload New Logo'}
            </button>
            <div style={{ fontSize: 11, color: C.sub }}>PNG, JPG, SVG or WebP · Max 5MB</div>
            <div style={{ fontSize: 11, color: C.sub }}>Recommended: white/transparent background</div>
            {settings.logo_url && (
              <button
                onClick={() => setSettings(p => ({ ...p, logo_url: '' }))}
                style={{ marginTop: 6, padding: '4px 10px', background: 'none', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, cursor: 'pointer', fontSize: 11 }}
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div style={{ background: C.card, border: '1px solid ' + C.border, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
          Company Information
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            { label: 'Company Name', key: 'company_name', full: true, placeholder: 'e.g. Maharaja Engineers & Contractors' },
            { label: 'Sub Title / Tagline', key: 'company_sub', full: true, placeholder: 'e.g. Building Excellence Across Kerala' },
            { label: 'Head Office Address', key: 'address', full: true, placeholder: '555 H1, Malayil Majesty, Thripunithura...' },
            { label: 'GSTIN', key: 'gstin', placeholder: '32ABEFM8620R1ZU' },
            { label: 'Phone Number', key: 'phone', placeholder: '+91 484 XXX XXXX' },
            { label: 'Email Address', key: 'email', placeholder: 'info@maharajaec.com' },
            { label: 'Website (Optional)', key: 'website', placeholder: 'www.maharajaec.com' },
          ].map(({ label, key, full, placeholder }) => (
            <div key={key} style={{ gridColumn: full ? '1 / -1' : 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</div>
              {key === 'address' ? (
                <textarea
                  value={settings[key] || ''}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid ' + C.border, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', color: C.text }}
                />
              ) : (
                <input
                  type="text"
                  value={settings[key] || ''}
                  onChange={e => handleChange(key, e.target.value)}
                  placeholder={placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid ' + C.border, borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none', color: C.text }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview Strip */}
      <div style={{ background: '#111', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        {settings.logo_url && (
          <img src={settings.logo_url} alt="Logo" style={{ height: 40, objectFit: 'contain', background: '#fff', padding: 4, borderRadius: 4 }} />
        )}
        <div>
          <div style={{ fontFamily: 'Georgia', fontSize: 15, fontWeight: 700, color: '#fff' }}>{settings.company_name || 'Company Name'}</div>
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{settings.address || 'Address'}</div>
          <div style={{ fontSize: 10, color: '#9ca3af' }}>
            GSTIN: {settings.gstin || '—'} · {settings.phone || '—'} · {settings.email || '—'}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: '#6b7280', textAlign: 'right' }}>
          Preview on<br />Purchase Order
        </div>
      </div>

      {/* Save Button */}
      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13, fontWeight: 500, background: saved ? '#f0fdf4' : '#fff1f2', color: saved ? '#16a34a' : '#dc2626', border: '1px solid ' + (saved ? '#d1fae5' : '#fca5a5') }}>
          {msg}
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', padding: '13px', background: saving ? '#9ca3af' : C.accent, color: '#fff', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Rajdhani',sans-serif", fontSize: 16, fontWeight: 700, letterSpacing: 0.5 }}
      >
        {saving ? 'Saving...' : '💾 Save Settings'}
      </button>
    </div>
  );
}
