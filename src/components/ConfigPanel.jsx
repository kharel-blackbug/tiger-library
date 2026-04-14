// src/components/ConfigPanel.jsx
import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useKeyPress, useLockScroll } from '@/hooks'
import { CONFIG } from '@/config'
import Button from './ui/Button'
import { Input } from './ui/Input'

export default function ConfigPanel({ open, onClose }) {
  const [cfg, setCfg] = useState({ sid: '', akey: '', gas: '' })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null) // null | 'ok' | 'error'
  const [testMsg, setTestMsg] = useState('')
  const [saved, setSaved] = useState(false)

  useLockScroll(open)
  useKeyPress('Escape', onClose)

  useEffect(() => {
    if (!open) return
    try {
      const stored = JSON.parse(localStorage.getItem(CONFIG.sheets.storageKey) || '{}')
      setCfg({ sid: stored.sid || '', akey: stored.akey || '', gas: stored.gas || '' })
    } catch {}
    setTestResult(null)
    setSaved(false)
  }, [open])

  if (!open) return null

  const handleSave = () => {
    localStorage.setItem(CONFIG.sheets.storageKey, JSON.stringify(cfg))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    if (!cfg.gas || !cfg.sid) { setTestResult('error'); setTestMsg('Enter both Spreadsheet ID and Apps Script URL first'); return }
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(cfg.gas, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'ping', sid: cfg.sid }),
      })
      const data = await res.json()
      if (data.ok) { setTestResult('ok'); setTestMsg(data.msg || 'Connected ✓') }
      else { setTestResult('error'); setTestMsg(data.error || 'Apps Script returned error') }
    } catch (e) {
      setTestResult('error')
      setTestMsg(e.message.includes('Failed to fetch')
        ? 'Could not reach Apps Script — check the URL and make sure "Anyone" has access'
        : e.message)
    } finally { setTesting(false) }
  }

  return (
    <>
      <div className="fixed inset-0 bg-ink/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-modal w-full max-w-xl pointer-events-auto animate-fade-up max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-fog-dark sticky top-0 bg-white rounded-t-xl">
            <div>
              <p className="text-[9px] tracking-widest uppercase text-stone">Data Storage</p>
              <h2 className="font-display text-xl text-ink">Google Sheets Connection</h2>
            </div>
            <button onClick={onClose} className="text-stone hover:text-ink transition-colors"><X size={18} /></button>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-stone leading-relaxed">
              Your ratings, reviews, quotes and added books save to <strong className="text-ink">your own Google Sheet</strong>.
              One-time setup, takes about 10 minutes.
            </p>

            <Input
              label="Spreadsheet ID *"
              value={cfg.sid}
              onChange={e => setCfg(c => ({ ...c, sid: e.target.value }))}
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
              hint="From your Sheet URL: …/spreadsheets/d/THIS_PART/edit"
            />
            <Input
              label="Anthropic API Key *"
              type="password"
              value={cfg.akey}
              onChange={e => setCfg(c => ({ ...c, akey: e.target.value }))}
              placeholder="sk-ant-api03-…"
              hint="For AI book lookup — free at console.anthropic.com"
            />
            <Input
              label="Apps Script URL *"
              value={cfg.gas}
              onChange={e => setCfg(c => ({ ...c, gas: e.target.value }))}
              placeholder="https://script.google.com/macros/s/…/exec"
              hint="Required for writing data — deploy GOOGLE_APPS_SCRIPT.js as a web app"
            />

            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSave} variant={saved ? 'secondary' : 'primary'}>
                {saved ? <><CheckCircle size={13} /> Saved!</> : 'Save Settings'}
              </Button>
              <Button variant="secondary" loading={testing} onClick={handleTest}>
                Test Connection
              </Button>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>

            {testResult && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${testResult === 'ok' ? 'bg-bamboo/10 text-bamboo-dark' : 'bg-red-50 text-red-600'}`}>
                {testResult === 'ok' ? <CheckCircle size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
                <span>{testMsg}</span>
              </div>
            )}

            {/* Setup guide */}
            <div className="bg-mist rounded-lg p-4 text-xs text-stone space-y-2 leading-relaxed">
              <p className="font-medium text-ink tracking-wide uppercase text-[10px]">Setup Guide</p>
              <p><strong className="text-ink">1.</strong> Go to <a href="https://sheets.new" target="_blank" className="text-bamboo underline">sheets.new</a> → rename the bottom tab to <code className="bg-white px-1 rounded text-bamboo">Library</code></p>
              <p><strong className="text-ink">2.</strong> Share → Anyone with the link → Editor</p>
              <p><strong className="text-ink">3.</strong> Copy the ID from the URL and paste above</p>
              <p><strong className="text-ink">4.</strong> In your Sheet → Extensions → Apps Script → paste <code className="bg-white px-1 rounded text-bamboo">GOOGLE_APPS_SCRIPT.js</code> → Deploy → New Deployment → Web app → Anyone → Deploy → copy URL</p>
              <p><strong className="text-ink">5.</strong> Get a free Anthropic API key at <a href="https://console.anthropic.com" target="_blank" className="text-bamboo underline">console.anthropic.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
