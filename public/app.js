const statsGrid = document.getElementById('stats-grid');
const officerTableBody = document.getElementById('officer-table-body');
const promotionTableBody = document.getElementById('promotion-table-body');
const officerSelect = document.getElementById('officer-select');

const statusMap = {
  active: 'نشط',
  ready: 'جاهز',
  review: 'مراجعة',
  pending: 'معلق',
  promoted: 'مُرقّي'
};

const decisionMap = {
  approved: 'موافق',
  pending: 'قيد الانتظار',
  review: 'مراجعة',
  rejected: 'مرفوض'
};

const safeText = (value) => value ?? 'غير محدد';

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'حدث خطأ' }));
    throw new Error(err.message || 'حدث خطأ غير متوقع');
  }

  return response.json();
}

function renderStats(data) {
  const cards = [
    { label: 'إجمالي الضباط', value: data.total || 0, sub: 'مفهرون في النظام' },
    { label: 'جاهزون للترقية', value: data.ready || 0, sub: 'بناءً على الأداء' },
    { label: 'طلبات معلقة', value: data.pending || 0, sub: 'تحتاج مراجعة' },
    { label: 'متوسط الأداء', value: `${data.averageScore || 0}`, sub: 'من 100' }
  ];

  statsGrid.innerHTML = cards.map((card) => `
    <article class="card">
      <span class="card-label">${card.label}</span>
      <div class="card-value">${card.value}</div>
      <div class="card-sub">${card.sub}</div>
    </article>
  `).join('');
}

function renderOfficers(officers) {
  officerTableBody.innerHTML = officers.map((officer) => `
    <tr>
      <td>${safeText(officer.name)}</td>
      <td>${safeText(officer.rank)}</td>
      <td>${safeText(officer.unit)}</td>
      <td>${safeText(officer.specialty)}</td>
      <td>${safeText(officer.years_of_service)}</td>
      <td>${safeText(officer.performance_score)}</td>
      <td><span class="badge ${officer.status || 'active'}">${statusMap[officer.status] || 'نشط'}</span></td>
      <td>
        <div class="inline-actions">
          <button class="secondary" type="button" data-action="update-officer" data-id="${officer.id}">تحديث</button>
          <button class="danger" type="button" data-action="delete-officer" data-id="${officer.id}">حذف</button>
        </div>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-action="delete-officer"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      await fetchJson(`/api/officers/${id}`, { method: 'DELETE' });
      await loadData();
    });
  });

  document.querySelectorAll('[data-action="update-officer"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      const officer = officers.find((item) => String(item.id) === String(id));
      if (!officer) return;

      const payload = {
        ...officer,
        years_of_service: Number(officer.years_of_service || 0),
        performance_score: Number(officer.performance_score || 0)
      };

      const form = document.getElementById('officer-form');
      form.name.value = payload.name || '';
      form.rank.value = payload.rank || '';
      form.unit.value = payload.unit || '';
      form.specialty.value = payload.specialty || '';
      form.years_of_service.value = payload.years_of_service || 0;
      form.status.value = payload.status || 'active';
      form.performance_score.value = payload.performance_score || 0;
      form.last_promotion.value = payload.last_promotion || '';

      form.dataset.editId = String(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderPromotions(promotions) {
  promotionTableBody.innerHTML = promotions.map((request) => `
    <tr>
      <td>${safeText(request.officer_name)}</td>
      <td>${safeText(request.officer_rank)}</td>
      <td>${safeText(request.proposed_rank)}</td>
      <td>${safeText(request.requested_by)}</td>
      <td>${safeText(request.score)}</td>
      <td><span class="badge ${request.status || 'pending'}">${decisionMap[request.status] || 'قيد الانتظار'}</span></td>
      <td>
        <div class="inline-actions">
          <button class="secondary" type="button" data-action="approve" data-id="${request.id}">موافق</button>
          <button class="danger" type="button" data-action="reject" data-id="${request.id}">رفض</button>
        </div>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('[data-action="approve"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      await fetchJson(`/api/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ decision: 'approved', status: 'approved' })
      });
      await loadData();
    });
  });

  document.querySelectorAll('[data-action="reject"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      await fetchJson(`/api/promotions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ decision: 'rejected', status: 'rejected' })
      });
      await loadData();
    });
  });
}

function populateOfficerSelect(officers) {
  officerSelect.innerHTML = ['<option value="">اختر الضابط</option>']
    .concat(officers.map((officer) => `<option value="${officer.id}">${officer.name} (${officer.rank})</option>`))
    .join('');
}

async function loadData() {
  try {
    const [dashboard, officers, promotions] = await Promise.all([
      fetchJson('/api/dashboard'),
      fetchJson('/api/officers'),
      fetchJson('/api/promotions')
    ]);

    renderStats(dashboard);
    renderOfficers(officers);
    renderPromotions(promotions);
    populateOfficerSelect(officers);
  } catch (error) {
    console.error(error);
    alert(error.message || 'حدث خطأ أثناء تحميل البيانات');
  }
}

document.getElementById('officer-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const payload = {
    name: form.name.value,
    rank: form.rank.value,
    unit: form.unit.value,
    specialty: form.specialty.value,
    years_of_service: Number(form.years_of_service.value || 0),
    status: form.status.value,
    performance_score: Number(form.performance_score.value || 0),
    last_promotion: form.last_promotion.value
  };

  try {
    if (form.dataset.editId) {
      await fetchJson(`/api/officers/${form.dataset.editId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      await fetchJson('/api/officers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }

    form.reset();
    delete form.dataset.editId;
    await loadData();
  } catch (error) {
    alert(error.message || 'حدث خطأ أثناء حفظ الضابط');
  }
});

document.getElementById('promotion-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const payload = {
    officer_id: form.officer_id.value,
    proposed_rank: form.proposed_rank.value,
    requested_by: form.requested_by.value,
    reason: form.reason.value,
    score: Number(form.score.value || 0),
    decision: 'pending',
    status: 'pending'
  };

  try {
    await fetchJson('/api/promotions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    form.reset();
    await loadData();
  } catch (error) {
    alert(error.message || 'حدث خطأ أثناء إرسال الطلب');
  }
});

loadData();
