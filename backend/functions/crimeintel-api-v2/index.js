const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({ limits: { fileSize: 25 * 1024 * 1024 }, parseNested: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'crimeintel-hackathon-demo-2026';

const DEMO_USERS = [
  { user_id: 'u1', email: 'admin@crimeintel.ai', password: 'admin123', display_name: 'Admin User', role: 'admin' },
  { user_id: 'u2', email: 'officer@crimeintel.ai', password: 'officer123', display_name: 'Demo Officer', role: 'officer' }
];

app.use((req, res, next) => {
  try { req.catalystApp = catalyst.initialize(req); }
  catch { req.catalystApp = null; }
  next();
});

const TP = process.env.DATA_STORE_TABLE_PREFIX || 'ci_';
const memDB = { users: [], cases: [], evidence: [], reports: [], crimaHistory: [] };

function tn(name) { return TP + name; }

async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-jwt-token'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.catalystUser = decoded;
      next(); return;
    } catch {}
  }
  try {
    if (req.catalystApp) {
      const user = await req.catalystApp.userManagement().getCurrentUser();
      if (user) { req.catalystUser = user; next(); return; }
    }
  } catch {}
  res.status(401).json({ detail: 'Unauthorized', code: 'UNAUTHORIZED' });
}

function paginate(arr, page, limit) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const start = (p - 1) * l;
  return { data: arr.slice(start, start + l), total: arr.length, page: p, pages: Math.ceil(arr.length / l) || 1, message: 'ok' };
}

function getUser(id) {
  const u = DEMO_USERS.find(d => d.user_id === id);
  return u ? { user_id: u.user_id, display_name: u.display_name } : null;
}

function seedData() {
  if (memDB.cases.length > 0) return;
  memDB.cases.push(
    {
      case_id: 'c1', case_number: 'CI-2024-001', title: 'Suspicious Activity Report',
      description: 'Unusual transaction patterns detected in downtown financial district involving multiple accounts.',
      crime_type: 'Fraud', status: 'open', priority: 'high',
      district: 'Central', location: 'Downtown Financial District',
      date_filed: '2024-01-15T10:30:00.000Z', date_updated: '2024-01-20T14:00:00.000Z',
      assigned_officer: { user_id: 'u1', display_name: 'Admin User' },
      filing_officer: { user_id: 'u1', display_name: 'Admin User' },
      victim_count: 3, suspect_count: 1,
      witnesses: [
        { witness_id: 'w1', name: 'Rajesh Kumar', statement: 'Observed repeated cash withdrawals from different accounts at the same counter.', credibility: 'high', contact: '+91-9876543210' },
        { witness_id: 'w2', name: 'Priya Sharma', statement: 'Noticed the individual taking photos of customer ID cards.', credibility: 'low', contact: '+91-9876543211' }
      ],
      timeline: [
        { event_id: 't1', event_type: 'case_created', title: 'Case Filed', description: 'Case registered after suspicious transaction report from bank', date: '2024-01-15T10:30:00.000Z', created_by: 'Admin User' },
        { event_id: 't2', event_type: 'evidence_collected', title: 'CCTV Footage Collected', description: 'Retrieved security footage from the bank covering the incident period', date: '2024-01-16T09:00:00.000Z', created_by: 'Admin User' },
        { event_id: 't3', event_type: 'witness_interview', title: 'Witness Statement Recorded', description: 'Recorded statement from bank teller who observed the suspicious activity', date: '2024-01-17T11:00:00.000Z', created_by: 'Admin User' }
      ]
    },
    {
      case_id: 'c2', case_number: 'CI-2024-002', title: 'Missing Person Investigation',
      description: 'Last seen near Central Park on March 15. Family reported the individual missing after 48 hours.',
      crime_type: 'Missing Person', status: 'under_investigation', priority: 'critical',
      district: 'North', location: 'Central Park Area',
      date_filed: '2024-03-17T08:00:00.000Z', date_updated: '2024-03-20T16:30:00.000Z',
      assigned_officer: { user_id: 'u2', display_name: 'Demo Officer' },
      filing_officer: { user_id: 'u2', display_name: 'Demo Officer' },
      victim_count: 1, suspect_count: 0,
      witnesses: [
        { witness_id: 'w3', name: 'Anita Desai', statement: 'Saw the person walking towards the lake area around 6 PM.', credibility: 'medium', contact: '+91-9876543212' }
      ],
      timeline: [
        { event_id: 't4', event_type: 'case_created', title: 'Missing Person Report Filed', description: 'Case opened after family filed missing person report', date: '2024-03-17T08:00:00.000Z', created_by: 'Demo Officer' },
        { event_id: 't5', event_type: 'search_operation', title: 'Search Operation Launched', description: 'Search teams deployed in Central Park and surrounding areas', date: '2024-03-17T14:00:00.000Z', created_by: 'Demo Officer' }
      ]
    }
  );
  memDB.evidence.push(
    {
      evidence_id: 'e1', case_id: 'c1', file_name: 'transaction_logs_Q1_2024.pdf',
      file_type: 'application/pdf', file_size: 245760, file_url: '/files/transaction_logs_Q1_2024.pdf',
      description: 'Suspicious bank transaction records for Q1 2024', sensitive: true,
      uploaded_by: { user_id: 'u1', display_name: 'Admin User' },
      uploaded_at: '2024-01-16T10:00:00.000Z'
    },
    {
      evidence_id: 'e2', case_id: 'c1', file_name: 'cctv_footage_15jan.mp4',
      file_type: 'video/mp4', file_size: 15728640, file_url: '/files/cctv_footage_15jan.mp4',
      description: 'CCTV footage from bank lobby - Jan 15, 2024', sensitive: false,
      uploaded_by: { user_id: 'u1', display_name: 'Admin User' },
      uploaded_at: '2024-01-16T14:30:00.000Z'
    },
    {
      evidence_id: 'e3', case_id: 'c2', file_name: 'missing_person_photo.jpg',
      file_type: 'image/jpeg', file_size: 512000, file_url: '/files/missing_person_photo.jpg',
      description: 'Recent photo of missing individual provided by family', sensitive: false,
      uploaded_by: { user_id: 'u2', display_name: 'Demo Officer' },
      uploaded_at: '2024-03-17T09:00:00.000Z'
    }
  );
  memDB.reports.push(
    {
      report_id: 'r1', case_id: 'c1', title: 'Preliminary Analysis Report',
      content: 'Financial records indicate pattern consistent with known fraud schemes. Recommended further investigation of flagged accounts.',
      report_type: 'analysis', created_by: { user_id: 'u1', display_name: 'Admin User' }, created_time: '2024-01-18T11:00:00.000Z'
    }
  );
}

async function dsGetAll(app, name) {
  try { return await app.datastore().table(tn(name)).getRows(); }
  catch { return null; }
}
async function dsGetById(app, name, id) {
  try { return await app.datastore().table(tn(name)).getRow(id); }
  catch { return null; }
}
async function dsInsert(app, name, data) {
  try { return await app.datastore().table(tn(name)).insertRow(data); }
  catch { return null; }
}
async function dsUpdate(app, name, data) {
  try { return await app.datastore().table(tn(name)).updateRows(data); }
  catch { return null; }
}
async function dsDelete(app, name, id) {
  try { await app.datastore().table(tn(name)).deleteRow(id); return true; }
  catch { return false; }
}

async function readJSONBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return req.body;
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      if (!raw) { resolve({}); return; }
      const ct = req.headers['content-type'] || '';
      if (ct.includes('x-www-form-urlencoded')) {
        const qs = require('querystring');
        resolve(qs.parse(raw));
        return;
      }
      let r = tryParseJSON(raw);
      if (r) { resolve(r); return; }
      const kq = raw.replace(/([{,])([a-zA-Z_]\w*)\s*:/g, (m, p1, p2) => p1 + '"' + p2 + '":');
      r = tryParseJSON(kq);
      if (r) { resolve(r); return; }
      const aq = kq.replace(/:\s*([a-zA-Z_]\w*)\s*([,}])/g, ':"$1"$2').replace(/:\s*([^"][^,}]*?)\s*([,}])/g, ':"$1"$2');
      r = tryParseJSON(aq);
      if (r) { resolve(r); return; }
      resolve({});
    });
  });
}
function tryParseJSON(s) {
  try { return JSON.parse(s); }
  catch { return null; }
}

function ok(data, msg) { return { data, message: msg || 'ok' }; }
function paged(arr, page, limit) { return paginate(arr, page, limit); }

app.get('/api/v1/health', async (req, res) => {
  let dsOk = false;
  try { if (req.catalystApp) { await req.catalystApp.datastore(); dsOk = true; } } catch {}
  res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: process.env.CATALYST_ENVIRONMENT || 'development', data_store: dsOk ? 'connected' : 'unavailable', memory_seeded: memDB.cases.length > 0 });
});

app.get('/api/v1/auth/me', requireAuth, (req, res) => {
  const u = req.catalystUser;
  res.json(ok({
    user_id: u.user_id || u.id,
    display_name: u.display_name || u.name || ((u.first_name || '') + ' ' + (u.last_name || '')).trim() || u.email,
    email: u.email, role: u.role || 'officer',
    badge_number: u.badge_number || undefined,
    phone: u.phone || undefined,
    photo_url: u.photo_url || undefined,
    status: 'active',
    permissions: [],
    created_at: new Date().toISOString()
  }));
});

app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const body = await readJSONBody(req);
    const { email, password } = body;
    if (!email || !password) { res.status(400).json({ detail: 'Email and password required' }); return; }
    const demoUser = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (!demoUser) { res.status(401).json({ detail: 'Invalid credentials' }); return; }
    const payload = { user_id: demoUser.user_id, email: demoUser.email, display_name: demoUser.display_name, role: demoUser.role };
    const access_token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      access_token, token_type: 'Bearer', expires_in: 86400,
      user: { ...payload, badge_number: undefined, phone: undefined, photo_url: undefined, status: 'active', permissions: [], created_at: new Date().toISOString() }
    });
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.post('/api/v1/auth/logout', (req, res) => { res.json(ok(null, 'Logged out')); });

app.put('/api/v1/auth/change-password', requireAuth, async (req, res) => {
  try {
    const body = await readJSONBody(req);
    const { current_password, new_password, confirm_password } = body;
    if (!current_password || !new_password || !confirm_password) { res.status(400).json({ detail: 'All password fields required' }); return; }
    if (new_password !== confirm_password) { res.status(400).json({ detail: 'Passwords do not match' }); return; }
    if (new_password.length < 6) { res.status(400).json({ detail: 'Password must be at least 6 characters' }); return; }
    res.json(ok(null, 'Password changed'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/cases', requireAuth, async (req, res) => {
  try {
    let rows = null;
    if (req.catalystApp) rows = await dsGetAll(req.catalystApp, 'cases');
    if (!rows || !rows.length) rows = memDB.cases;
    let filtered = [...rows];
    const q = (req.query.q || '').toLowerCase();
    if (q) filtered = filtered.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.case_number || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.crime_type || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q) ||
      (c.location || '').toLowerCase().includes(q)
    );
    if (req.query.crime_type) filtered = filtered.filter(c => c.crime_type === req.query.crime_type);
    if (req.query.status) filtered = filtered.filter(c => c.status === req.query.status);
    if (req.query.district) filtered = filtered.filter(c => c.district === req.query.district);
    if (req.query.date_from) filtered = filtered.filter(c => c.date_filed >= req.query.date_from);
    if (req.query.date_to) filtered = filtered.filter(c => c.date_filed <= req.query.date_to);
    res.json(paged(filtered, req.query.page, req.query.limit));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/cases/search', requireAuth, async (req, res) => {
  try {
    let rows = null;
    if (req.catalystApp) rows = await dsGetAll(req.catalystApp, 'cases');
    if (!rows || !rows.length) rows = memDB.cases;
    const q = (req.query.q || '').toLowerCase();
    if (q) rows = rows.filter(c =>
      (c.title || '').toLowerCase().includes(q) ||
      (c.case_number || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q) ||
      (c.crime_type || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q)
    );
    res.json(paged(rows, req.query.page, req.query.limit));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.post('/api/v1/cases', requireAuth, async (req, res) => {
  try {
    const body = await readJSONBody(req);
    const { title, description, crime_type, priority, location, district, assigned_officer_id } = body;
    if (!title || !crime_type || !district || !location) { res.status(400).json({ detail: 'title, crime_type, district, location required' }); return; }
    const allCases = await dsGetAll(req.catalystApp, 'cases') || memDB.cases;
    const case_id = 'c' + (allCases.length + 1).toString();
    const now = new Date().toISOString();
    const officer = assigned_officer_id ? getUser(assigned_officer_id) : getUser(req.catalystUser.user_id);
    const row = {
      case_id, case_number: 'CI-' + new Date().getFullYear() + '-' + String(allCases.length + 1).padStart(3, '0'),
      title, description: description || '', crime_type: crime_type || 'Other',
      status: 'open', priority: priority || 'medium',
      district, location, date_filed: now, date_updated: now,
      assigned_officer: officer, filing_officer: getUser(req.catalystUser.user_id),
      victim_count: 0, suspect_count: 0, witnesses: [], timeline: []
    };
    memDB.cases.push(row);
    res.status(201).json(ok(row, 'Case created'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/cases/:id', requireAuth, async (req, res) => {
  try {
    let item = null;
    if (req.catalystApp) item = await dsGetById(req.catalystApp, 'cases', req.params.id);
    if (!item) item = memDB.cases.find(c => c.case_id === req.params.id);
    if (!item) { res.status(404).json({ detail: 'Case not found' }); return; }
    res.json(ok(item));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.put('/api/v1/cases/:id', requireAuth, async (req, res) => {
  try {
    const body = await readJSONBody(req);
    const idx = memDB.cases.findIndex(c => c.case_id === req.params.id);
    if (idx === -1) { res.status(404).json({ detail: 'Case not found' }); return; }
    Object.assign(memDB.cases[idx], body, { date_updated: new Date().toISOString() });
    res.json(ok(memDB.cases[idx], 'Case updated'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.delete('/api/v1/cases/:id', requireAuth, async (req, res) => {
  try {
    const idx = memDB.cases.findIndex(c => c.case_id === req.params.id);
    if (idx === -1) { res.status(404).json({ detail: 'Case not found' }); return; }
    memDB.cases.splice(idx, 1);
    res.json(ok(null, 'Case deleted'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/cases/:id/timeline', requireAuth, async (req, res) => {
  try {
    const c = memDB.cases.find(c => c.case_id === req.params.id);
    if (!c) { res.status(404).json({ detail: 'Case not found' }); return; }
    res.json(ok(c.timeline || []));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/cases/:id/related', requireAuth, async (req, res) => {
  try {
    const c = memDB.cases.find(c => c.case_id === req.params.id);
    if (!c) { res.status(404).json({ detail: 'Case not found' }); return; }
    const related = memDB.cases.filter(x => x.case_id !== req.params.id && (x.crime_type === c.crime_type || x.district === c.district));
    const slim = related.map(x => ({
      case_id: x.case_id, case_number: x.case_number, title: x.title,
      crime_type: x.crime_type, status: x.status, priority: x.priority,
      district: x.district, location: x.location, date_filed: x.date_filed,
      date_updated: x.date_updated, assigned_officer: x.assigned_officer,
      victim_count: x.victim_count, suspect_count: x.suspect_count
    }));
    res.json(ok(slim));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/evidence', requireAuth, async (req, res) => {
  try {
    let rows = null;
    if (req.catalystApp) rows = await dsGetAll(req.catalystApp, 'evidence');
    if (!rows || !rows.length) rows = memDB.evidence;
    if (req.query.case_id) rows = rows.filter(e => e.case_id === req.query.case_id);
    res.json(paged(rows, req.query.page, req.query.limit));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/evidence/case/:caseId', requireAuth, async (req, res) => {
  try {
    let rows = null;
    if (req.catalystApp) rows = await dsGetAll(req.catalystApp, 'evidence');
    if (!rows || !rows.length) rows = memDB.evidence;
    rows = rows.filter(e => e.case_id === req.params.caseId);
    res.json(ok(rows));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.post('/api/v1/evidence', requireAuth, async (req, res) => {
  try {
    const userO = getUser(req.catalystUser.user_id);
    let evidence_id = 'e' + Date.now().toString(36);
    const now = new Date().toISOString();

    if (req.files && req.files.file) {
      const file = req.files.file;
      const case_id = req.body.case_id;
      if (!case_id) { res.status(400).json({ detail: 'case_id required' }); return; }
      const description = req.body.description || '';
      const sensitive = req.body.sensitive === 'true' || req.body.sensitive === true;
      const row = {
        evidence_id, case_id, file_name: file.name, file_type: file.mimetype,
        file_size: file.size, file_url: '/files/' + file.name,
        description, sensitive,
        uploaded_by: userO, uploaded_at: now
      };
      if (req.catalystApp) {
        try {
          const uploadResult = await req.catalystApp.filestore().folder('ci_evidence_files').uploadFile({
            code: file.name, fileStream: { data: file.data, name: file.name, mimetype: file.mimetype }
          });
          row.file_url = '/files/' + (uploadResult.name || file.name);
        } catch {}
      }
      memDB.evidence.push(row);
      res.status(201).json(ok(row, 'Evidence added'));
      return;
    }

    const body = await readJSONBody(req);
    const { case_id, title, description } = body;
    if (!case_id) { res.status(400).json({ detail: 'case_id required' }); return; }
    const row = {
      evidence_id, case_id, file_name: title || 'unnamed',
      file_type: body.evidence_type || 'document', file_size: 0,
      file_url: '', description: description || '', sensitive: false,
      uploaded_by: userO, uploaded_at: now
    };
    memDB.evidence.push(row);
    res.status(201).json(ok(row, 'Evidence added'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/evidence/:id', requireAuth, async (req, res) => {
  try {
    let item = null;
    if (req.catalystApp) item = await dsGetById(req.catalystApp, 'evidence', req.params.id);
    if (!item) item = memDB.evidence.find(e => e.evidence_id === req.params.id);
    if (!item) { res.status(404).json({ detail: 'Evidence not found' }); return; }
    res.json(ok(item));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.delete('/api/v1/evidence/:id', requireAuth, async (req, res) => {
  try {
    const idx = memDB.evidence.findIndex(e => e.evidence_id === req.params.id);
    if (idx === -1) { res.status(404).json({ detail: 'Evidence not found' }); return; }
    memDB.evidence.splice(idx, 1);
    res.json(ok(null, 'Evidence deleted'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/reports', requireAuth, async (req, res) => {
  try {
    let rows = null;
    if (req.catalystApp) rows = await dsGetAll(req.catalystApp, 'reports');
    if (!rows || !rows.length) rows = memDB.reports;
    if (req.query.case_id) rows = rows.filter(r => r.case_id === req.query.case_id);
    res.json(paged(rows, req.query.page, req.query.limit));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.post('/api/v1/reports', requireAuth, async (req, res) => {
  try {
    const body = await readJSONBody(req);
    const { case_id, title, content, report_type } = body;
    if (!case_id || !title) { res.status(400).json({ detail: 'case_id and title required' }); return; }
    const row = {
      report_id: 'r' + Date.now().toString(36), case_id, title,
      content: content || '', report_type: report_type || 'analysis',
      created_by: getUser(req.catalystUser.user_id),
      created_time: new Date().toISOString()
    };
    memDB.reports.push(row);
    res.status(201).json(ok(row, 'Report created'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/reports/:id', requireAuth, async (req, res) => {
  try {
    let item = null;
    if (req.catalystApp) item = await dsGetById(req.catalystApp, 'reports', req.params.id);
    if (!item) item = memDB.reports.find(r => r.report_id === req.params.id);
    if (!item) { res.status(404).json({ detail: 'Report not found' }); return; }
    res.json(ok(item));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/analytics/overview', requireAuth, async (req, res) => {
  try {
    const allCases = memDB.cases;
    const total_cases = allCases.length;
    const open_cases = allCases.filter(c => c.status === 'open' || c.status === 'active' || c.status === 'under_investigation').length;
    const closed_cases = allCases.filter(c => c.status === 'closed').length;
    const filed_cases = allCases.filter(c => c.status === 'open').length;
    const clearance_rate = total_cases > 0 ? Math.round((closed_cases / total_cases) * 100 * 10) / 10 : 0;
    const avg_resolution_days = 14;
    res.json(ok({ total_cases, open_cases, closed_cases, filed_cases, clearance_rate, avg_resolution_days }));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/analytics/distribution', requireAuth, async (req, res) => {
  try {
    const allCases = memDB.cases;
    const byType = {};
    allCases.forEach(c => { byType[c.crime_type] = (byType[c.crime_type] || 0) + 1; });
    const total = allCases.length || 1;
    res.json(ok(Object.entries(byType).map(([crime_type, count]) => ({ crime_type, count, percentage: Math.round(count / total * 100) }))));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/analytics/trends', requireAuth, async (req, res) => {
  try {
    const allCases = memDB.cases;
    const byMonth = {};
    allCases.forEach(c => {
      const m = (c.date_filed || new Date().toISOString()).substring(0, 7);
      if (!byMonth[m]) byMonth[m] = { month: m, total: 0, open: 0, closed: 0 };
      byMonth[m].total++;
      if (c.status === 'closed') byMonth[m].closed++;
      else byMonth[m].open++;
    });
    res.json(ok(Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/analytics/by-district', requireAuth, async (req, res) => {
  try {
    const allCases = memDB.cases;
    const byDistrict = {};
    allCases.forEach(c => {
      const d = c.district || 'Unknown';
      byDistrict[d] = (byDistrict[d] || 0) + 1;
    });
    res.json(ok(Object.entries(byDistrict).map(([district, count]) => ({ district, count }))));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/analytics/dashboard', requireAuth, async (req, res) => {
  try {
    const allCases = memDB.cases; const allEvidence = memDB.evidence; const allReports = memDB.reports;
    res.json({
      stats: {
        total_cases: allCases.length, open_cases: allCases.filter(c => c.status === 'open').length,
        active_cases: allCases.filter(c => c.status === 'active').length,
        closed_cases: allCases.filter(c => c.status === 'closed').length,
        critical_cases: allCases.filter(c => c.priority === 'critical').length,
        evidence_count: allEvidence.length, report_count: allReports.length
      }
    });
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.post('/api/v1/analytics/predict', requireAuth, async (req, res) => {
  const body = await readJSONBody(req);
  res.json(ok({
    predictions: [
      { type: 'crime_pattern', confidence: 0.87, prediction: 'Fraud pattern detected — matches known financial crime indicators' },
      { type: 'risk_score', confidence: 0.76, prediction: 'Risk Level: HIGH — requires immediate attention' },
      { type: 'resolution_time', confidence: 0.82, prediction: 'Estimated resolution time: 14-21 days based on similar cases' }
    ],
    case_id: body.case_id || null, model: 'crimeintel-ai-v1'
  }));
});

app.post('/api/v1/crima/query', requireAuth, async (req, res) => {
  try {
    const body = await readJSONBody(req);
    const text = body.text || body.query || '';
    const context = body.context || '';
    if (!text) { res.status(400).json({ detail: 'Query text required' }); return; }
    const q = text.toLowerCase();
    let response = '';
    let results = [];
    if (q.includes('fraud') || q.includes('financial') || q.includes('transaction')) {
      response = 'I found potential fraud indicators in the case data. Suspicious transaction patterns have been identified in the financial district. I recommend reviewing the transaction logs and CCTV footage for further evidence.';
      results = memDB.cases.filter(c => c.crime_type === 'Fraud').map(c => ({
        case_id: c.case_id, crime_type: c.crime_type, location: c.location,
        date_filed: c.date_filed, status: c.status, confidence: 0.85, summary: c.description.substring(0, 100)
      }));
    } else if (q.includes('missing') || q.includes('person') || q.includes('search')) {
      response = 'Based on missing person case data, the investigation is progressing. Search operations have been conducted and witness statements collected. I recommend coordinating with local law enforcement for expanded search efforts.';
      results = memDB.cases.filter(c => c.crime_type === 'Missing Person').map(c => ({
        case_id: c.case_id, crime_type: c.crime_type, location: c.location,
        date_filed: c.date_filed, status: c.status, confidence: 0.78, summary: c.description.substring(0, 100)
      }));
    } else if (q.includes('burglary') || q.includes('theft') || q.includes('robbery')) {
      response = 'Property crime analysis shows patterns in the reported cases. Check for geographic clustering and repeat offenders.';
      results = memDB.cases.filter(c =>
        c.crime_type === 'Burglary' || c.crime_type === 'Theft' || c.crime_type === 'Robbery'
      ).map(c => ({
        case_id: c.case_id, crime_type: c.crime_type, location: c.location,
        date_filed: c.date_filed, status: c.status, confidence: 0.72, summary: c.description.substring(0, 100)
      }));
    } else {
      response = 'Analysis of the available crime data suggests following standard investigation protocols. Review evidence, witness statements, and case files for leads.';
      results = memDB.cases.slice(0, 3).map(c => ({
        case_id: c.case_id, crime_type: c.crime_type, location: c.location,
        date_filed: c.date_filed, status: c.status, confidence: 0.65, summary: c.description.substring(0, 100)
      }));
    }
    const queryResponse = {
      response, results, intent: 'case_analysis', confidence_avg: 0.78,
      total_found: results.length, sources: ['Case Database', 'Evidence Records'],
      entities: { crime_types: [...new Set(results.map(r => r.crime_type))], locations: [...new Set(results.map(r => r.location))] }
    };
    const userMsg = { role: 'user', text, timestamp: new Date().toISOString() };
    const chatMsg = { role: 'assistant', text: response, results, timestamp: new Date().toISOString() };
    memDB.crimaHistory.push(userMsg, chatMsg);
    res.json(ok(queryResponse));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.get('/api/v1/crima/history', requireAuth, async (req, res) => {
  res.json(ok(memDB.crimaHistory));
});

app.delete('/api/v1/crima/history', requireAuth, async (req, res) => {
  memDB.crimaHistory = [];
  res.json(ok(null, 'History cleared'));
});

app.post('/api/v1/upload', requireAuth, async (req, res) => {
  try {
    if (!req.files || !req.files.file) { res.status(400).json({ detail: 'File attachment required' }); return; }
    const case_id = req.body.case_id;
    if (!case_id) { res.status(400).json({ detail: 'case_id required' }); return; }
    const file = req.files.file;
    const userO = getUser(req.catalystUser.user_id);
    const row = {
      evidence_id: 'e' + Date.now().toString(36), case_id,
      file_name: file.name, file_type: file.mimetype, file_size: file.size,
      file_url: '/files/' + file.name, description: req.body.description || '',
      sensitive: req.body.sensitive === 'true' || req.body.sensitive === true,
      uploaded_by: userO, uploaded_at: new Date().toISOString()
    };
    if (req.catalystApp) {
      try {
        const uploadResult = await req.catalystApp.filestore().folder('ci_evidence_files').uploadFile({
          code: file.name, fileStream: { data: file.data, name: file.name, mimetype: file.mimetype }
        });
        row.file_url = '/files/' + (uploadResult.name || file.name);
      } catch {}
    }
    memDB.evidence.push(row);
    res.status(201).json(ok(row, 'File uploaded'));
  } catch (err) { res.status(500).json({ detail: err.message }); }
});

app.post('/api/v1/zcql', requireAuth, async (req, res) => {
  try {
    if (!req.catalystApp) { res.status(503).json({ detail: 'ZCQL requires Catalyst runtime' }); return; }
    const body = await readJSONBody(req);
    if (!body || !body.query) { res.status(400).json({ detail: 'ZCQL query required' }); return; }
    const result = await req.catalystApp.zcql().executeZCQLQuery(body.query);
    res.json(ok(result));
  } catch (err) {
    const msg = typeof err === 'string' ? err : (err ? err.message : 'Unknown error');
    res.status(500).json({ detail: msg });
  }
});

app.use((req, res) => { res.status(404).json({ detail: 'Not found' }); });
app.use((err, req, res, next) => { res.status(500).json({ detail: err.message || 'Internal server error' }); });

seedData();

module.exports = function(req, res) { app(req, res); };