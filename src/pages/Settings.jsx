// src/pages/Settings.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings2, Sheet, Key, User, CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLibrary } from '@/context/LibraryContext'
import { api } from '@/api/client'
import Button from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white border border-fog-dark rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-fog-dark bg-mist flex items-center gap-2">
        <Icon size={16} className="text-bamboo" />
        <h2 className="font-display text-lg text-ink">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { user, checkMe, isAdmin, saveSheetConfig } = useAuth()
  const { fetchBooks } = useLibrary()
  const [seeding, setSeeding] = useState(false)
  const [sheetStatus, setSheetStatus] = useState(null)
  const [sheetForm, setSheetForm] = useState({ sheet_id: '', credentials: '' })
  const [connecting, setConnecting] = useState(false)
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' })
  const [changingPass, setChangingPass] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    api.sheetStatus()
      .then(d => setSheetStatus(d))
      .catch(() => {})
  }, [])

  const handleConnectSheet = async () => {
    if (!sheetForm.sheet_id.trim()) { toast.error('Spreadsheet ID required'); return }
    if (!sheetForm.credentials.trim()) { toast.error('Service account credentials required'); return }
    let creds
    try { creds = JSON.parse(sheetForm.credentials) }
    catch { toast.error('Invalid JSON in credentials field'); return }

    setConnecting(true)
    try {
      await api.connectSheet({ sheet_id: sheetForm.sheet_id.trim(), credentials: creds })
      toast.success('Google Sheet connected! All tabs created.')
      // Save to localStorage so it survives server restarts
      saveSheetConfig(sheetForm.sheet_id.trim(), creds)
      const status = await api.sheetStatus()
      setSheetStatus(status)
      await checkMe()
      fetchBooks()  // load books immediately after connecting
    } catch (e) {
      toast.error(e.message)
    } finally { setConnecting(false) }
  }

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const data = await api.seedBooks()
      toast.success(data.message)
      if (data.seeded > 0) fetchBooks()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSeeding(false)
    }
  }

  const handleChangePass = async () => {
    if (!passForm.current) { toast.error('Enter current password'); return }
    if (passForm.next.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (passForm.next !== passForm.confirm) { toast.error('Passwords do not match'); return }
    setChangingPass(true)
    try {
      await api.changePass({ current: passForm.current, next: passForm.next })
      toast.success('Password changed successfully')
      setPassForm({ current: '', next: '', confirm: '' })
    } catch (e) {
      toast.error(e.message)
    } finally { setChangingPass(false) }
  }

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(label)
    setTimeout(() => setCopied(''), 2000)
  }

  const SHEET_HEADERS = [
    'Books: id, title, author, genre, type, year, nation, description, is_base, is_sikkim, cover_url, rating, status, review, review_date, total_pages, current_page, date_started, date_finished, added_by, added_at',
    'Quotes: id, book_id, text, page_ref, added_by, added_at',
    'Wishlist: id, title, author, genre, priority, note, added_by, added_at',
    'Goals: id, name, description, target_date, status, book_ids, owner, created_at, updated_at',
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-ink mb-1 flex items-center gap-3">
          <Settings2 className="text-bamboo" size={28} /> Settings
        </h1>
        <p className="text-sm text-stone">Configure your library, Google Sheets, and account</p>
      </div>

      {/* Google Sheets */}
      <Section title="Google Sheets Database" icon={Sheet}>
        {/* Connection status */}
        <div className={`flex items-center gap-2 mb-5 px-4 py-3 rounded-xl border ${
          sheetStatus?.connected
            ? 'bg-bamboo/5 border-bamboo/20 text-bamboo'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {sheetStatus?.connected
            ? <><CheckCircle size={14} /> <span className="text-sm font-medium">Connected to Google Sheet</span></>
            : <><AlertCircle size={14} /> <span className="text-sm font-medium">Not connected — data cannot be saved</span></>
          }
        </div>

        <div className="space-y-4">
          <Input
            label="Spreadsheet ID"
            value={sheetForm.sheet_id}
            onChange={e => setSheetForm(f => ({ ...f, sheet_id: e.target.value }))}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
            hint="From your Sheet URL: …/spreadsheets/d/THIS_PART/edit"
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium tracking-widest uppercase text-stone">
              Service Account Credentials (JSON)
            </label>
            <textarea
              value={sheetForm.credentials}
              onChange={e => setSheetForm(f => ({ ...f, credentials: e.target.value }))}
              placeholder={'{\n  "type": "service_account",\n  "client_email": "...",\n  "private_key": "..."\n}'}
              rows={6}
              className="w-full px-3 py-2.5 text-xs font-mono border border-fog-dark rounded-lg text-ink focus:outline-none focus:border-bamboo focus:ring-2 focus:ring-bamboo/20 resize-y"
            />
            <p className="text-xs text-stone">
              Create a service account at{' '}
              <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-bamboo underline inline-flex items-center gap-0.5">
                Google Cloud Console <ExternalLink size={10} />
              </a>
              {' '}→ APIs &amp; Services → Credentials → Service Account → create key (JSON)
            </p>
          </div>

          <Button loading={connecting} onClick={handleConnectSheet} className="w-full">
            <Sheet size={13} /> Connect Google Sheet
          </Button>

          {sheetStatus?.connected && (
            <div className="bg-mist rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Import Base Catalogue</p>
                <p className="text-xs text-stone mt-0.5">Write all 233 curated books to your Google Sheet</p>
              </div>
              <Button size="sm" loading={seeding} onClick={handleSeed} variant="secondary">
                Import Books
              </Button>
            </div>
          )}
        </div>

        {/* Setup guide */}
        <div className="mt-6 bg-mist rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-ink tracking-widest uppercase">Setup Guide</p>
          <ol className="text-xs text-stone space-y-2 list-none">
            {[
              ['1', 'Create a Google Sheet at sheets.new'],
              ['2', 'Share the sheet with your service account email (Editor access)'],
              ['3', 'Enable the Google Sheets API in Google Cloud Console'],
              ['4', 'Create a Service Account → generate a JSON key → paste it above'],
              ['5', 'Paste your Spreadsheet ID → click Connect'],
            ].map(([n, text]) => (
              <li key={n} className="flex gap-2">
                <span className="font-medium text-bamboo shrink-0">{n}.</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>

          <div className="mt-3 space-y-2">
            <p className="text-xs text-stone font-medium">Required sheet tabs (auto-created on connect):</p>
            {SHEET_HEADERS.map((h, i) => (
              <div key={i} className="flex items-start gap-2 group">
                <code className="text-[10px] bg-white border border-fog-dark rounded px-2 py-1 flex-1 text-bamboo leading-relaxed">{h}</code>
                <button
                  onClick={() => copyText(h.split(': ')[1], `header-${i}`)}
                  className="shrink-0 text-stone/50 hover:text-stone transition-colors mt-1"
                  title="Copy headers"
                >
                  {copied === `header-${i}` ? <CheckCircle size={12} className="text-bamboo" /> : <Copy size={12} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Change Password" icon={Key}>
        <div className="space-y-4">
          <Input label="Current Password" type="password" value={passForm.current}
            onChange={e => setPassForm(f => ({ ...f, current: e.target.value }))}
            placeholder="••••••••" autoComplete="current-password" />
          <Input label="New Password" type="password" value={passForm.next}
            onChange={e => setPassForm(f => ({ ...f, next: e.target.value }))}
            placeholder="Min. 8 characters" autoComplete="new-password" />
          <Input label="Confirm New Password" type="password" value={passForm.confirm}
            onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
            placeholder="Repeat new password" autoComplete="new-password" />
          <Button loading={changingPass} onClick={handleChangePass}>
            <Key size={13} /> Update Password
          </Button>
        </div>
        <p className="text-xs text-stone mt-3">
          Default credentials: <code className="bg-mist px-1 rounded">admin / changeme123</code> — change immediately.
        </p>
      </Section>

      {/* Account info */}
      <Section title="Account" icon={User}>
        <div className="space-y-2 text-sm">
          {[
            ['Username', user?.username],
            ['Display Name', user?.display_name],
            ['Role', user?.role],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between py-2 border-b border-fog-dark last:border-0">
              <span className="text-stone text-xs tracking-widest uppercase">{label}</span>
              <span className="font-medium text-ink">{val || '—'}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Anthropic API */}
      <Section title="AI Settings" icon={Settings2}>
        <p className="text-sm text-stone mb-3">
          The AI book scanner and lookup uses Claude. Add your API key to <code className="bg-mist px-1 rounded text-bamboo">.env</code>:
        </p>
        <div className="bg-ink rounded-xl p-4 font-mono text-xs text-green-300 space-y-1">
          <div>ANTHROPIC_API_KEY=sk-ant-api03-...</div>
          <div className="text-green-300/50"># Get free at console.anthropic.com</div>
        </div>
        <p className="text-xs text-stone mt-3">
          Restart the server after adding the key.
        </p>
      </Section>
    </div>
  )
}
