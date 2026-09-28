const express = require('express');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const port = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'app.db'));

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS officers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rank TEXT NOT NULL,
      unit TEXT DEFAULT 'غير محدد',
      specialty TEXT DEFAULT 'غير محدد',
      years_of_service INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      performance_score INTEGER DEFAULT 0,
      last_promotion TEXT DEFAULT 'غير محدد',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promotion_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      officer_id INTEGER NOT NULL,
      proposed_rank TEXT NOT NULL,
      requested_by TEXT DEFAULT 'رئيس اللجنة',
      reason TEXT DEFAULT '',
      score INTEGER DEFAULT 0,
      decision TEXT DEFAULT 'pending',
      status TEXT DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (officer_id) REFERENCES officers(id) ON DELETE CASCADE
    );
  `);

  const officerCount = db.prepare('SELECT COUNT(*) AS count FROM officers').get();

  if (officerCount.count === 0) {
    const now = new Date().toISOString();

    const seedOfficers = [
      ['العميد أحمد سالم', 'عميد', 'قيادة المنطقة', 'إدارة العمليات', 18, 'ready', 92, '2024-01-15'],
      ['الكابتن سارة محمد', 'رائد', 'لواء المراقبة', 'المخابرات', 12, 'active', 87, '2023-06-10'],
      ['المقدم يوسف خالد', 'مقدم', 'القيادة العامة', 'المدفعية', 15, 'review', 80, '2022-11-20'],
      ['النقيب لينا حسن', 'نقيب', 'لواء القيادة', 'الاتصالات', 9, 'ready', 91, '2024-03-01'],
      ['الرائد نايف طارق', 'رائد', 'مركز التدريب', 'التدريب', 14, 'pending', 76, '2021-09-12']
    ];

    const officerInsert = db.prepare(`
      INSERT INTO officers (
        name, rank, unit, specialty, years_of_service, status, performance_score, last_promotion, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seedOfficers.forEach((officer) => {
      officerInsert.run([...officer, now]);
    });

    const requestInsert = db.prepare(`
      INSERT INTO promotion_requests (
        officer_id, proposed_rank, requested_by, reason, score, decision, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const reqList = [
      [1, 'لواء', 'رئيس شعبة التقييم', 'مستوى أداء عالٍ ومؤهلات قيادية', 92, 'approved', 'approved', now],
      [4, 'رائد', 'رئيس اللجنة', 'نجاح في مهام الحماية والقيادة', 91, 'pending', 'pending', now],
      [3, 'رائد', 'رئيس شعبة التقييم', 'مراجعة ملف الترقية ��لمعايير السنوية', 80, 'review', 'review', now]
    ];

    reqList.forEach((record) => requestInsert.run(record));
  }
};

initDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const getOfficerSummary = (officer) => ({
  ...officer,
  statusLabel: {
    active: 'نشط',
    ready: 'جاهز للترقية',
    review: 'قيد المراجعة',
    pending: 'معلق',
    promoted: 'مُرقّي'
  }[officer.status] || officer.status
});

app.get('/api/dashboard', (req, res) => {
  const totalOfficers = db.prepare('SELECT COUNT(*) AS total FROM officers').get();
  const readyCount = db.prepare("SELECT COUNT(*) AS total FROM officers WHERE status IN ('ready', 'active')").get();
  const pendingCount = db.prepare("SELECT COUNT(*) AS total FROM promotion_requests WHERE status IN ('pending', 'review')").get();
  const averageScore = db.prepare('SELECT ROUND(AVG(performance_score), 1) AS value FROM officers').get();
  const rankDistribution = db.prepare(`
    SELECT rank, COUNT(*) AS total
    FROM officers
    GROUP BY rank
    ORDER BY total DESC
  `).all();

  res.json({
    total: totalOfficers.total,
    ready: readyCount.total,
    pending: pendingCount.total,
    averageScore: averageScore.value || 0,
    rankDistribution
  });
});

app.get('/api/officers', (req, res) => {
  const officers = db.prepare('SELECT * FROM officers ORDER BY created_at DESC').all();
  res.json(officers.map(getOfficerSummary));
});

app.post('/api/officers', (req, res) => {
  const { name, rank, unit, specialty, years_of_service, status, performance_score, last_promotion } = req.body;

  if (!name || !rank) {
    return res.status(400).json({ message: 'اسم الضابط والرتبة مطلوبان.' });
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO officers (name, rank, unit, specialty, years_of_service, status, performance_score, last_promotion, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    rank,
    unit || 'غير محدد',
    specialty || 'غير محدد',
    Number(years_of_service || 0),
    status || 'active',
    Number(performance_score || 0),
    last_promotion || 'غير محدد',
    now
  );

  const officer = db.prepare('SELECT * FROM officers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(getOfficerSummary(officer));
});

app.put('/api/officers/:id', (req, res) => {
  const { id } = req.params;
  const { name, rank, unit, specialty, years_of_service, status, performance_score, last_promotion } = req.body;

  const existing = db.prepare('SELECT * FROM officers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'الضابط غير موجود.' });
  }

  db.prepare(`
    UPDATE officers
    SET name = ?, rank = ?, unit = ?, specialty = ?, years_of_service = ?, status = ?, performance_score = ?, last_promotion = ?
    WHERE id = ?
  `).run(
    name || existing.name,
    rank || existing.rank,
    unit || existing.unit,
    specialty || existing.specialty,
    Number(years_of_service || existing.years_of_service),
    status || existing.status,
    Number(performance_score || existing.performance_score),
    last_promotion || existing.last_promotion,
    id
  );

  const officer = db.prepare('SELECT * FROM officers WHERE id = ?').get(id);
  res.json(getOfficerSummary(officer));
});

app.delete('/api/officers/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM officers WHERE id = ?').run(id);

  if (result.changes === 0) {
    return res.status(404).json({ message: 'الضابط غير موجود.' });
  }

  db.prepare('DELETE FROM promotion_requests WHERE officer_id = ?').run(id);
  res.json({ success: true });
});

app.get('/api/promotions', (req, res) => {
  const requests = db.prepare(`
    SELECT p.*, o.name AS officer_name, o.rank AS officer_rank
    FROM promotion_requests p
    LEFT JOIN officers o ON o.id = p.officer_id
    ORDER BY p.created_at DESC
  `).all();

  res.json(requests.map((request) => ({
    ...request,
    decisionLabel: {
      approved: 'موافق',
      pending: 'قيد الانتظار',
      review: 'مراجعة',
      rejected: 'مرفوض'
    }[request.decision] || request.decision,
    statusLabel: {
      approved: 'موافق',
      pending: 'قيد الانتظار',
      review: 'مراجعة',
      rejected: 'مرفوض'
    }[request.status] || request.status
  })));
});

app.post('/api/promotions', (req, res) => {
  const { officer_id, proposed_rank, requested_by, reason, score, decision, status } = req.body;

  if (!officer_id || !proposed_rank) {
    return res.status(400).json({ message: 'يرجى تحديد الضابط والرتبة المقترحة.' });
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO promotion_requests (
      officer_id, proposed_rank, requested_by, reason, score, decision, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    officer_id,
    proposed_rank,
    requested_by || 'رئيس اللجنة',
    reason || '',
    Number(score || 0),
    decision || 'pending',
    status || 'pending',
    now
  );

  const request = db.prepare(`
    SELECT p.*, o.name AS officer_name, o.rank AS officer_rank
    FROM promotion_requests p
    LEFT JOIN officers o ON o.id = p.officer_id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(request);
});

app.put('/api/promotions/:id', (req, res) => {
  const { id } = req.params;
  const { decision, status } = req.body;

  const existing = db.prepare('SELECT * FROM promotion_requests WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ message: 'طلب الترقية غير موجود.' });
  }

  db.prepare(`
    UPDATE promotion_requests
    SET decision = ?, status = ?
    WHERE id = ?
  `).run(decision || existing.decision, status || existing.status, id);

  const updated = db.prepare(`
    SELECT p.*, o.name AS officer_name, o.rank AS officer_rank
    FROM promotion_requests p
    LEFT JOIN officers o ON o.id = p.officer_id
    WHERE p.id = ?
  `).get(id);

  res.json(updated);
});

app.get('/api/reports', (req, res) => {
  const distribution = db.prepare(`
    SELECT rank, COUNT(*) AS total, ROUND(AVG(performance_score), 1) AS average_score
    FROM officers
    GROUP BY rank
    ORDER BY total DESC
  `).all();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) AS total
    FROM officers
    GROUP BY status
  `).all();

  res.json({ distribution, byStatus });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`تطبيق ترقية المراتب والضباط يعمل على http://localhost:${port}`);
});
