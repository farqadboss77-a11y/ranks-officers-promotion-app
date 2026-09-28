const statsGrid = document.getElementById('stats-grid');
const officerTableBody = document.getElementById('officer-table-body');
const promotionTableBody = document.getElementById('promotion-table-body');
const officerSelect = document.getElementById('officer-select');

const statusMap = {
  active: 'نشط',
  ready: 'جاهز للترقية',
  review: 'قيد المراجعة',
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
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'حدث خطأ' }));
      throw new Error(err.message || 'حدث خطأ غير متوقع');
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

function renderStats(data) {
  const cards = [
    {
      label: 'إجمالي الضباط',
      value: data.total || 0,
      sub: 'مفهرسون في النظام'
    },
    {
      label: 'جاهزون للتر��ية',
      value: data.ready || 0,
      sub: 'بناءً على الأداء والسنوات'
    },
    {
      label: 'طلبات معلقة',
      value: data.pending || 0,
      sub: 'تحتاج إلى مراجعة'
    },
    {
      label: 'متوسط الأداء',
      value: `${data.averageScore || 0}%`,
      sub: 'من أصل 100'
    }
  ];

  statsGrid.innerHTML = cards
    .map(
      (card) => `
    <article class="card">
      <span class="card-label">${card.label}</span>
      <div class="card-value">${card.value}</div>
      <div class="card-sub">${card.sub}</div>
    </article>
  `
    )
    .join('');
}

function renderOfficers(officers) {
  if (!officers || officers.length === 0) {
    officerTableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--muted);">
          لا توجد بيانات ضباط حالياً
        </td>
      </tr>
    `;
    return;
  }

  officerTableBody.innerHTML = officers
    .map(
      (officer) => `
    <tr>
      <td>${safeText(officer.name)}</td>
      <td>${safeText(officer.rank)}</td>
      <td>${safeText(officer.unit)}</td>
      <td>${safeText(officer.specialty)}</td>
      <td>${safeText(officer.years_of_service)}</td>
      <td>${safeText(officer.performance_score)}</td>
      <td><span class="badge ${officer.status || 'active'}">${
        statusMap[officer.status] || 'نشط'
      }</span></td>
      <td>
        <div class="inline-actions">
          <button class="secondary" type="button" data-action="update-officer" data-id="${
            officer.id
          }">تحديث</button>
          <button class="danger" type="button" data-action="delete-officer" data-id="${
            officer.id
          }">حذف</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  attachOfficerEvents(officers);
}

function attachOfficerEvents(officers) {
  document.querySelectorAll('[data-action="delete-officer"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      if (confirm('هل أنت متأكد من حذف هذا الضابط؟')) {
        try {
          await fetchJson(`/api/officers/${id}`, { method: 'DELETE' });
          showNotification('تم حذف الضابط بنجاح', 'success');
          await loadData();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
  });

  document.querySelectorAll('[data-action="update-officer"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      const officer = officers.find((item) => String(item.id) === String(id));
      if (!officer) return;

      const form = document.getElementById('officer-form');
      form.name.value = officer.name || '';
      form.rank.value = officer.rank || '';
      form.unit.value = officer.unit || '';
      form.specialty.value = officer.specialty || '';
      form.years_of_service.value = officer.years_of_service || 0;
      form.status.value = officer.status || 'active';
      form.performance_score.value = officer.performance_score || 0;
      form.last_promotion.value = officer.last_promotion || '';

      form.dataset.editId = String(id);
      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.textContent = 'تحديث الضابط';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function renderPromotions(promotions) {
  if (!promotions || promotions.length === 0) {
    promotionTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--muted);">
          لا توجد طلبات ترقية حالياً
        </td>
      </tr>
    `;
    return;
  }

  promotionTableBody.innerHTML = promotions
    .map(
      (request) => `
    <tr>
      <td>${safeText(request.officer_name)}</td>
      <td>${safeText(request.officer_rank)}</td>
      <td>${safeText(request.proposed_rank)}</td>
      <td>${safeText(request.requested_by)}</td>
      <td>${safeText(request.score)}</td>
      <td><span class="badge ${request.status || 'pending'}">${
        decisionMap[request.status] || 'قيد الانتظار'
      }</span></td>
      <td>
        <div class="inline-actions">
          <button class="secondary" type="button" data-action="approve" data-id="${request.id}">موافق</button>
          <button class="danger" type="button" data-action="reject" data-id="${request.id}">رفض</button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');

  attachPromotionEvents();
}

function attachPromotionEvents() {
  document.querySelectorAll('[data-action="approve"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      try {
        await fetchJson(`/api/promotions/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ decision: 'approved', status: 'approved' })
        });
        showNotification('تم الموافقة على الطلب بنجاح', 'success');
        await loadData();
      } catch (error) {
        showNotification(error.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="reject"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id;
      if (confirm('هل أنت متأكد من رفض هذا الطلب؟')) {
        try {
          await fetchJson(`/api/promotions/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ decision: 'rejected', status: 'rejected' })
          });
          showNotification('تم رفض الطلب', 'error');
          await loadData();
        } catch (error) {
          showNotification(error.message, 'error');
        }
      }
    });
  });
}

function populateOfficerSelect(officers) {
  if (!officers || officers.length === 0) {
    officerSelect.innerHTML = '<option value="">لا توجد ضباط</option>';
    return;
  }

  officerSelect.innerHTML = [
    '<option value="">اختر الضابط</option>',
    ...officers.map(
      (officer) =>
        `<option value="${officer.id}">${officer.name} (${officer.rank})</option>`
    )
  ].join('');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: auto;
    padding: 14px 18px;
    border-radius: 12px;
    background: ${
      type === 'success' ? 'rgba(91, 227, 154, 0.12)' : 'rgba(248, 113, 113, 0.12)'
    };
    color: ${type === 'success' ? '#b2f7d0' : '#ffd2d2'};
    border: 1px solid ${
      type === 'success' ? 'rgba(91, 227, 154, 0.22)' : 'rgba(248, 113, 113, 0.18)'
    };
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

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
    showNotification('فشل تحميل البيانات: ' + error.message, 'error');
  }
}

document.getElementById('officer-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitBtn = form.querySelector('[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري الحفظ...';

  const payload = {
    name: form.name.value.trim(),
    rank: form.rank.value,
    unit: form.unit.value.trim(),
    specialty: form.specialty.value.trim(),
    years_of_service: Number(form.years_of_service.value || 0),
    status: form.status.value,
    performance_score: Number(form.performance_score.value || 0),
    last_promotion: form.last_promotion.value.trim()
  };

  if (!payload.name || !payload.rank) {
    showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    return;
  }

  try {
    if (form.dataset.editId) {
      await fetchJson(`/api/officers/${form.dataset.editId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showNotification('تم تحديث الضابط بنجاح', 'success');
    } else {
      await fetchJson('/api/officers', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showNotification('تم إضافة الضابط بنجاح', 'success');
    }

    form.reset();
    delete form.dataset.editId;
    submitBtn.textContent = 'حفظ الضابط';
    await loadData();
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

document.getElementById('promotion-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const submitBtn = form.querySelector('[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري الإرسال...';

  const payload = {
    officer_id: form.officer_id.value,
    proposed_rank: form.proposed_rank.value,
    requested_by: form.requested_by.value.trim(),
    reason: form.reason.value.trim(),
    score: Number(form.score.value || 0),
    decision: 'pending',
    status: 'pending'
  };

  if (!payload.officer_id || !payload.proposed_rank) {
    showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    return;
  }

  try {
    await fetchJson('/api/promotions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showNotification('تم إرسال طلب الترقية بنجاح', 'success');
    form.reset();
    await loadData();
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Initial load
loadData();

// Auto-refresh every 30 seconds
setInterval(() => {
  loadData().catch(console.error);
}, 30000);
