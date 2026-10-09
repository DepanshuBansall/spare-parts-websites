/**
 * TurbineTek Plant Fleet Manager
 * Allows power station operators to register machines and inspect matching spare parts
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadTurbineOptions();
  await loadFleetList();
  setupAddFleetForm();
});

async function loadTurbineOptions() {
  const typeSelect = document.getElementById('fleetTypeSelect');
  const mfrSelect = document.getElementById('fleetMfrSelect');
  const modelSelect = document.getElementById('fleetModelSelect');

  if (!typeSelect || !mfrSelect || !modelSelect) return;

  try {
    const res = await API.getTurbines();
    if (!res.success) return;
    const turbines = res.data;

    const types = [...new Set(turbines.map(t => t.type))];
    typeSelect.innerHTML = '<option value="">-- Select Type --</option>' +
      types.map(t => `<option value="${t}">${t}</option>`).join('');

    typeSelect.addEventListener('change', () => {
      const selectedType = typeSelect.value;
      if (!selectedType) {
        mfrSelect.innerHTML = '<option value="">-- First Select Type --</option>';
        modelSelect.innerHTML = '<option value="">-- First Select Manufacturer --</option>';
        return;
      }
      const mfrs = turbines.filter(t => t.type === selectedType);
      mfrSelect.innerHTML = '<option value="">-- Select Manufacturer --</option>' +
        mfrs.map(m => `<option value="${m.manufacturer}">${m.manufacturer}</option>`).join('');
      modelSelect.innerHTML = '<option value="">-- First Select Manufacturer --</option>';
    });

    mfrSelect.addEventListener('change', () => {
      const selectedType = typeSelect.value;
      const selectedMfr = mfrSelect.value;
      if (!selectedMfr) {
        modelSelect.innerHTML = '<option value="">-- First Select Manufacturer --</option>';
        return;
      }
      const match = turbines.find(t => t.type === selectedType && t.manufacturer === selectedMfr);
      if (match && match.models) {
        modelSelect.innerHTML = '<option value="">-- Select Model --</option>' +
          match.models.map(m => `<option value="${m}">${m}</option>`).join('');
      }
    });

  } catch (err) {
    console.error('Error loading turbine options:', err);
  }
}

async function loadFleetList() {
  const container = document.getElementById('fleetCardsGrid');
  if (!container) return;

  try {
    const res = await API.getFleet();
    if (!res.success || res.data.length === 0) {
      container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No equipment registered in your fleet yet. Use the form above to add your first power plant turbine.</div>';
      return;
    }

    container.innerHTML = res.data.map(item => `
      <div class="product-card" style="padding: 24px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <span class="badge-oem" style="font-size: 0.75rem;">${item.turbineType}</span>
            <button onclick="deleteFleet('${item.fleetId}')" style="background: transparent; border: none; color: var(--accent-red); cursor: pointer; font-size: 0.85rem;" title="Remove machine">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

          <h3 style="font-size: 1.25rem; margin-bottom: 4px;">${item.plantName}</h3>
          <div style="font-family: var(--font-mono); font-size: 0.88rem; color: var(--accent-cyan); font-weight: 600; margin-bottom: 14px;">
            ${item.manufacturer} • ${item.model}
          </div>

          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); border-radius: var(--radius-sm); padding: 12px; font-size: 0.82rem; display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
            <div>Serial Number: <strong class="mono" style="color: #fff;">${item.serialNumber}</strong></div>
            <div>Operating Hours: <strong class="mono" style="color: var(--accent-amber);">${(item.operatingHours || 0).toLocaleString()} hrs</strong></div>
            <div>Commission Year: <strong>${item.commissionYear}</strong></div>
            <div>Scheduled Overhaul: <strong style="color: #34D399;">${item.nextOverhaul}</strong></div>
          </div>
        </div>

        <div>
          <a href="/catalog.html?turbineModel=${encodeURIComponent(item.model)}" class="btn btn-primary" style="width: 100%; font-size: 0.85rem;">
            <i class="fa-solid fa-screwdriver-wrench"></i> View Verified Spare Parts
          </a>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Error loading fleet:', err);
  }
}

function setupAddFleetForm() {
  const form = document.getElementById('addFleetForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);

    const payload = {
      plantName: formData.get('plantName'),
      turbineType: formData.get('turbineType'),
      manufacturer: formData.get('manufacturer'),
      model: formData.get('model'),
      serialNumber: formData.get('serialNumber'),
      operatingHours: formData.get('operatingHours'),
      commissionYear: formData.get('commissionYear'),
      nextOverhaul: formData.get('nextOverhaul')
    };

    try {
      const res = await API.addFleetItem(payload);
      if (!res.success) throw new Error(res.message);

      form.reset();
      Cart.showToast(`Registered "${payload.plantName}" to your Plant Fleet!`);
      await loadFleetList();

    } catch (err) {
      alert('Error registering machine: ' + err.message);
    }
  });
}

window.deleteFleet = async function(id) {
  if (!confirm('Are you sure you want to remove this equipment from your plant fleet?')) return;
  try {
    const res = await API.deleteFleetItem(id);
    if (!res.success) throw new Error(res.message);
    Cart.showToast('Equipment removed from fleet', 'info');
    await loadFleetList();
  } catch (err) {
    alert('Error deleting item: ' + err.message);
  }
};
