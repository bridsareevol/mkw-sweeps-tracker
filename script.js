const teamMembers = [
  'Alyssa Rocha',
  'Amanpreet Anand',
  'Andreea Ichim',
  'Angel Saka',
  'Arooj Awan',
  'Astra Sreeja Selvaraj',
  'Brevan Dias',
  'Joel Douma',
  'Kezia Adebola',
  'Emitis Pasandideh Gholamali',
  'Erin Frank',
  'Japnaam Kamboj',
  'Mili Shah Shah',
  'Richelle Antonythasan',
  'Tazeen Hemraj',
  'Tiffany Nkonge',
  'Tvisha Patel',
  'Zaina Shaikh',
  'Zariah Lennon'
];

const BUILDINGS = {
  Keyes: {
    basementRooms: ['Piano Room B116']
  },
  Matthews: {
    basementRooms: [
      'Study Room B143/A',
      'Study Room B144',
      'Study Room B145',
      'Study Room B106',
      'Games Room B131'
    ],
    storageRooms: ['B113', 'B114', 'B110', 'B122', 'B133', 'B140']
  },
  Wallingford: {
    basementRooms: [
      'Multi-Purpose Room B102',
      'TV Lounge B104',
      'Study Room B103/A',
      'Study Room B103/B',
      'Study Room B108',
      'Study Room B109'
    ]
  }
};

const BUILDING_LABELS = {
  Keyes: 'Mary E. Keyes',
  Matthews: 'Matthews',
  Wallingford: 'Wallingford'
};

function getBuildingLabel(building) {
  return BUILDING_LABELS[building] || building;
}

let globalFloorPanels = [];
let globalFloorIndex = 0;
let selectedBuildingSections = [];
let selectedBuildingIndex = 0;

function populateCADropdown(id) {
  const dropdown = document.getElementById(id);
  const menu = dropdown.querySelector('.dropdown-menu');
  teamMembers.forEach(member => {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = member;
    checkbox.addEventListener('change', () => handleCASelection(checkbox));
    label.append(checkbox, document.createTextNode(member));
    menu.appendChild(label);
  });
}

function populateCASelectors() {
  ['leadCA', 'supportCAs'].forEach(populateCADropdown);
}

function toggleCADropdown(button) {
  const dropdown = button.closest('.ca-dropdown');
  const isOpen = dropdown.classList.toggle('open');
  button.setAttribute('aria-expanded', isOpen);
}

function handleCASelection(checkbox) {
  const dropdown = checkbox.closest('.ca-dropdown');
  const selected = dropdown.querySelectorAll('input:checked');
  const max = Number(dropdown.dataset.max);

  if (max && selected.length > max) {
    checkbox.checked = false;
    alert(`You can select up to ${max} support CAs.`);
  }

  if (dropdown.id === 'leadCA' && checkbox.checked) {
    dropdown.querySelectorAll('input:not(:checked)').forEach(input => {
      input.checked = false;
    });
  }

  const selectedNames = [...dropdown.querySelectorAll('input:checked')]
    .map(input => input.value);
  const button = dropdown.querySelector('.dropdown-toggle');
  button.textContent = selectedNames.length
    ? selectedNames.join(', ')
    : dropdown.dataset.placeholder;
}

populateCASelectors();

function populateBuildingChoices() {
  const choices = document.getElementById('buildingChoices');
  Object.keys(BUILDINGS).forEach(building => {
    const label = document.createElement('label');
    label.className = 'building-choice';
    label.innerHTML = `<input type="checkbox" value="${building}"> <span>${getBuildingLabel(building)}</span>`;
    choices.appendChild(label);
  });
}

populateBuildingChoices();

// Auto-fill today's date
document.getElementById('reportDate').valueAsDate = new Date();

// Formats a YYYY-MM-DD date into "Month Day, Year"
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  // Fixing timezone offset issue by appending time
  const date = new Date(dateString + 'T12:00:00'); 
  return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
  if (!timeString) {
    return '';
  }

  const [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function changeStepper(button, amount) {
  const input = button.parentElement.querySelector('input[type="number"]');
  input.value = Math.max(0, Number(input.value) + amount);
}

function buildStepper(roomName) {
  return `
    <div class="room-stepper">
      <span>${roomName}</span>
      <button type="button" onclick="changeStepper(this, -1)" aria-label="Decrease ${roomName} count">-</button>
      <input type="number" min="0" value="0" data-room="${roomName}" aria-label="${roomName} count">
      <button type="button" onclick="changeStepper(this, 1)" aria-label="Increase ${roomName} count">+</button>
    </div>`;
}

function formatRoomStatus(input) {
  return Number(input.value) > 0
    ? `Met ${input.value} students in the ${input.dataset.room}.`
    : `${input.dataset.room}: Quiet`;
}

function noteField(location) {
  const label = location === 'basement' ? 'Basement Notes' : `Floor ${location.replace('floor', '')} Notes`;
  return `<label>${label}</label><input type="text" name="${location}Note" placeholder="Optional notes if not quiet standards">`;
}

function getLocationNote(section, location) {
  const note = section.querySelector(`[name="${location}Note"]`).value.trim();
  return note ? ` Note: ${note}` : '';
}

function changeFloor(button, direction) {
  navigateFloor(button.closest('.floor-carousel'), direction);
}

function navigateFloor(carousel, direction) {
  const panels = [...carousel.querySelectorAll('.floor-panel')];
  const currentIndex = panels.findIndex(panel => !panel.hidden);
  const nextIndex = (currentIndex + direction + panels.length) % panels.length;

  panels.forEach((panel, index) => {
    panel.hidden = index !== nextIndex;
  });
  carousel.querySelector('.floor-position').textContent =
    `${panels[nextIndex].dataset.floor} of ${panels.length}`;
}

function addFloorSwipeListeners(carousel) {
  let startX = 0;
  let currentX = 0;

  carousel.addEventListener('touchstart', event => {
    startX = event.touches[0].clientX;
    currentX = startX;
  }, { passive: true });

  carousel.addEventListener('touchmove', event => {
    currentX = event.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchend', () => {
    if (globalFloorPanels.length) {
      return;
    }

    const horizontalDistance = currentX - startX;
    const swipeThreshold = 50;

    if (Math.abs(horizontalDistance) >= swipeThreshold) {
      const direction = horizontalDistance < 0 ? 1 : -1;
      navigateFloor(carousel, direction);
    }
  }, { passive: true });
}

function addGlobalFloorSwipeListeners(carousel) {
  let startX = 0;

  carousel.addEventListener('touchstart', event => {
    startX = event.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchend', event => {
    const horizontalDistance = event.changedTouches[0].clientX - startX;
    const swipeThreshold = 50;

    if (Math.abs(horizontalDistance) >= swipeThreshold) {
      navigateGlobalFloor(horizontalDistance < 0 ? 1 : -1);
    }
  }, { passive: true });
}

function initializeFloorCarousel(fieldsContainer) {
  const children = [...fieldsContainer.children];
  const floorStarts = children.filter(child =>
    child.tagName === 'LABEL' && /^(Floor \d+|Basement)$/.test(child.textContent.trim())
  );

  if (!floorStarts.length) {
    return;
  }

  const carousel = document.createElement('div');
  carousel.className = 'floor-carousel';
  const panels = floorStarts.map((start, index) => {
    const panel = document.createElement('div');
    panel.className = 'floor-panel';
    panel.dataset.floor = start.textContent.trim();
    panel.hidden = index !== 0;
    const startIndex = children.indexOf(start);
    const endIndex = index + 1 < floorStarts.length
      ? children.indexOf(floorStarts[index + 1])
      : children.length;
    children.slice(startIndex, endIndex).forEach(child => panel.appendChild(child));
    carousel.appendChild(panel);
    return panel;
  });

  const controls = document.createElement('div');
  controls.className = 'floor-controls';
  controls.innerHTML = `
    <button type="button" onclick="changeFloor(this, -1)">Previous</button>
    <span class="floor-position">${panels[0].dataset.floor} of ${panels.length}</span>
    <button type="button" onclick="changeFloor(this, 1)">Next</button>`;

  const preservedChildren = children.filter(child => !floorStarts.some(start => {
    const startIndex = children.indexOf(start);
    const nextStart = floorStarts[floorStarts.indexOf(start) + 1];
    const endIndex = nextStart ? children.indexOf(nextStart) : children.length;
    return children.indexOf(child) >= startIndex && children.indexOf(child) < endIndex;
  }));
  fieldsContainer.replaceChildren(...preservedChildren, carousel, controls);
  addFloorSwipeListeners(carousel);
}

function renderGenericBuildingFields(fieldsContainer) {
  fieldsContainer.innerHTML = `
    ${[1, 2, 3, 4, 5, 6].map(floor => `
      <label>Floor ${floor}</label>
      <input type="text" name="floor${floor}" value="Quiet">
      ${noteField(`floor${floor}`)}
    `).join('')}
    <label>Basement</label>
    <input type="text" name="basement" value="Quiet, all doors locked.">
    ${noteField('basement')}`;
}

function renderKeyesBuildingFields(fieldsContainer) {
  const stepper = (floor, roomNames) => `
    <label>Floor ${floor}</label>
    <div class="room-steppers">
      ${roomNames.map(buildStepper).join('')}
    </div>
    ${noteField(`floor${floor}`)}`;

  fieldsContainer.innerHTML = `
    <p class="building-note">Mary E. Keyes-specific room checks</p>
    ${stepper(6, ['Study Room'])}
    ${stepper(5, ['Study Room'])}
    ${stepper(4, ['Study Room'])}
    ${stepper(3, ['Study Room'])}
    ${stepper(2, ['Meeting Room', 'Study Room', 'Games Room', 'Laundry Room'])}
    ${stepper(1, ['Affinity Group Meeting Room'])}
    <label>Basement</label>
    <div class="room-steppers keyes-basement-rooms">
      ${BUILDINGS.Keyes.basementRooms.map(buildStepper).join('')}
    </div>
    ${noteField('basement')}`;
}

function renderMatthewsBuildingFields(fieldsContainer) {
  fieldsContainer.innerHTML = `
    <label>Floor 4</label>
    <input type="text" name="floor4" value="Quiet. Roof access locked.">
    <label>Floor 3</label>
    <input type="text" name="floor3" value="Quiet">
    <label>Floor 2</label>
    <input type="text" name="floor2" value="Quiet">
    <label>Floor 1</label>
    <input type="text" name="floor1" value="Quiet">
    <label>Common Rooms</label>
    <p class="helper-text">Matthews towers: North, Center, East, South, and West. Common rooms are in North, Center, and East.</p>
    <div class="room-steppers matthews-common-rooms">
      ${['North Common Room', 'Center Common Room', 'East Common Room'].map(buildStepper).join('')}
    </div>
    <label>Basement</label>
    <div class="room-steppers matthews-basement-rooms">
      ${BUILDINGS.Matthews.basementRooms.map(buildStepper).join('')}
    </div>
    ${noteField('basement')}
    <label class="toggle-row">
      <input type="checkbox" name="storageUnlocked">
      Storage rooms found unlocked
    </label>
    <p class="helper-text">Storage rooms: ${BUILDINGS.Matthews.storageRooms.join(', ')}</p>`;
}

function renderWallingfordBuildingFields(fieldsContainer) {
  const steppers = BUILDINGS.Wallingford.basementRooms.map(buildStepper).join('');

  fieldsContainer.innerHTML = `
    <label>Floor 3</label>
    <input type="text" name="floor3" value="Quiet">
    <label>Floor 2</label>
    <input type="text" name="floor2" value="Quiet">
    <label>Floor 1</label>
    <div class="room-steppers">
      <div class="room-stepper">
        <span>Tea Room</span>
        <button type="button" onclick="changeStepper(this, -1)" aria-label="Decrease Tea Room count">-</button>
        <input type="number" min="0" value="0" data-room="Tea Room" aria-label="Tea Room count">
        <button type="button" onclick="changeStepper(this, 1)" aria-label="Increase Tea Room count">+</button>
      </div>
    </div>
    <label>Basement</label>
    <div class="room-steppers wallingford-basement-rooms">${steppers}</div>`;
}

function renderBuildingFields(section) {
  const fieldsContainer = section.querySelector('.building-fields');
  const building = section.querySelector('[name="building"]').value;

  if (building === 'Keyes') {
    renderKeyesBuildingFields(fieldsContainer);
  } else if (building === 'Matthews') {
    renderMatthewsBuildingFields(fieldsContainer);
  } else if (building === 'Wallingford') {
    renderWallingfordBuildingFields(fieldsContainer);
  } else {
    renderGenericBuildingFields(fieldsContainer);
  }

}

document.querySelectorAll('.building-section').forEach(renderBuildingFields);

function showView(viewId) {
  document.querySelectorAll('.app-view').forEach(view => {
    const isActive = view.id === viewId;
    view.classList.toggle('active', isActive);
    view.hidden = !isActive;
  });
}

function startAgain() {
  window.location.reload();
}

function goToBuildings() {
  showView('view-buildings');
}

function startSweep() {
  const selectedBuildings = [...document.querySelectorAll('#buildingChoices input:checked')]
    .map(input => input.value);
  if (!selectedBuildings.length) {
    alert('Select at least one building before starting the sweep.');
    return;
  }

  const floorViewContent = document.getElementById('floorViewContent');
  floorViewContent.innerHTML = '';
  const sweepSection = document.createElement('div');
  sweepSection.id = 'sweep1Section';
  sweepSection.className = 'section-card';
  sweepSection.innerHTML = `<h2>Start Sweep</h2><p class="helper-text">Started at ${formatTime(document.getElementById('startTime').value)}.</p><div id="sweep1Buildings"></div>`;
  floorViewContent.appendChild(sweepSection);

  selectedBuildingSections = selectedBuildings.map(building => {
    const section = document.createElement('div');
    section.className = 'building-section';
    section.dataset.sweep = '1';
    section.innerHTML = `<h3>${building}</h3><input type="hidden" name="building" value="${building}"><div class="building-fields"></div>`;
    document.getElementById('sweep1Buildings').appendChild(section);
    renderBuildingFields(section);
    return section;
  });
  selectedBuildingIndex = 0;
  showBuildingInProgress(0);
  showView('view-floor');
}

function toggleSweep2() {
  const enabled = document.getElementById('sweep2Enabled').checked;
  const section = document.getElementById('sweep2Section');
  section.hidden = !enabled;
}

function initializeGlobalFloorCarousel() {
  globalFloorPanels = [...document.querySelectorAll('#floorViewContent .floor-panel')];
  globalFloorIndex = 0;
  globalFloorPanels.forEach(panel => {
    const buildingSection = panel.closest('.building-section');
    const sweepSection = panel.closest('.section-card');
    panel.dataset.building = buildingSection.querySelector('[name="building"]').value;
    panel.dataset.buildingLabel = getBuildingLabel(panel.dataset.building);
    panel.dataset.sweep = sweepSection.id;
    panel.hidden = true;
  });
  if (globalFloorPanels.length) {
    showGlobalFloorPanel(0);
  }
}

function showBuildingInProgress(index) {
  selectedBuildingIndex = index;
  selectedBuildingSections.forEach((section, sectionIndex) => {
    section.hidden = sectionIndex !== index;
  });
  const building = selectedBuildingSections[index].querySelector('[name="building"]').value;
  document.getElementById('globalFloorPosition').textContent =
    `${getBuildingLabel(building)} (${index + 1} of ${selectedBuildingSections.length})`;
  document.querySelector('#view-floor .primary-action').textContent =
    index === selectedBuildingSections.length - 1 ? 'Next: Summary' : 'Next: Building';
}

function showGlobalFloorPanel(index) {
  globalFloorIndex = index;
  const activePanel = globalFloorPanels[globalFloorIndex];
  const activeBuildingSection = activePanel.closest('.building-section');
  const activeSweepSection = activePanel.closest('.section-card');

  document.querySelectorAll('#floorViewContent > .section-card').forEach(section => {
    section.hidden = section !== activeSweepSection;
  });
  document.querySelectorAll('#floorViewContent .building-section').forEach(section => {
    section.hidden = section !== activeBuildingSection;
  });
  globalFloorPanels.forEach(panel => {
    panel.hidden = panel !== activePanel;
  });
  updateGlobalFloorPosition();
}

function navigateGlobalFloor(direction) {
  if (!globalFloorPanels.length) {
    return;
  }

  const nextIndex = (globalFloorIndex + direction + globalFloorPanels.length) % globalFloorPanels.length;
  showGlobalFloorPanel(nextIndex);
}

function updateGlobalFloorPosition() {
  const panel = globalFloorPanels[globalFloorIndex];
  document.getElementById('globalFloorPosition').textContent =
    `${panel.dataset.buildingLabel} - ${panel.dataset.floor} (${globalFloorIndex + 1} of ${globalFloorPanels.length})`;
}

function finishSweep() {
  if (selectedBuildingIndex < selectedBuildingSections.length - 1) {
    showBuildingInProgress(selectedBuildingIndex + 1);
    return;
  }
  renderSweepSummaryFields();
  showView('view-summary');
}

function getEnabledSweepNumbers() {
  return [1];
}

function renderSweepSummaryFields() {
  const container = document.getElementById('sweepSummaryFields');
  container.innerHTML = '';

  getEnabledSweepNumbers().forEach(sweepNumber => {
    const section = document.createElement('div');
    section.className = 'section-card';
    section.innerHTML = `
      <h2>Sweep Summary</h2>
      <label for="s${sweepNumber}Vibe">Shift Vibe & Trends</label>
      <textarea id="s${sweepNumber}Vibe" placeholder="The shift was quiet OR The shift was busy with..."></textarea>

      <label for="s${sweepNumber}EndTime">End Time</label>
      <input type="time" id="s${sweepNumber}EndTime">

      <label for="s${sweepNumber}Calls">Calls Received</label>
      <input type="number" id="s${sweepNumber}Calls" value="0" min="0">

      <label for="s${sweepNumber}IRs">IRs Submitted</label>
      <input type="number" id="s${sweepNumber}IRs" value="0" min="0" oninput="updateIdFields('ir', ${sweepNumber})">
      <div id="s${sweepNumber}IrIdFields" class="id-fields"></div>

      <label for="s${sweepNumber}SOCs">SOCs Submitted</label>
      <input type="number" id="s${sweepNumber}SOCs" value="0" min="0" oninput="updateIdFields('soc', ${sweepNumber})">
      <div id="s${sweepNumber}SocIdFields" class="id-fields"></div>

      <label for="s${sweepNumber}WorkOrders">Work Orders Submitted</label>
      <input type="number" id="s${sweepNumber}WorkOrders" value="0" min="0" oninput="updateIdFields('workOrder', ${sweepNumber})">
      <div id="s${sweepNumber}WorkOrderIdFields" class="id-fields"></div>`;
    container.appendChild(section);
  });
}

function addSweep(sweepNumber) {
  if (document.getElementById(`sweep${sweepNumber}Section`)) {
    return;
  }

  const sweepSection = document.createElement('div');
  sweepSection.id = `sweep${sweepNumber}Section`;
  sweepSection.className = 'section-card';
  sweepSection.innerHTML = `
    <h2>Sweep</h2>
    <label for="s${sweepNumber}StartTime">Start Time</label>
    <input type="time" id="s${sweepNumber}StartTime" value="01:00">
    <label for="s${sweepNumber}EndTime">End Time</label>
    <input type="time" id="s${sweepNumber}EndTime" value="01:30">
    <label for="s${sweepNumber}CAs">CAs on Sweep</label>
    <div class="ca-dropdown" id="s${sweepNumber}CAs" data-placeholder="Select Sweep CAs">
      <button type="button" class="dropdown-toggle" onclick="toggleCADropdown(this)" aria-expanded="false">Select Sweep CAs</button>
      <div class="dropdown-menu" role="group" aria-label="Sweep CA choices"></div>
    </div>
    <div id="sweep${sweepNumber}Buildings">
      <div class="building-section" data-sweep="${sweepNumber}">
        <label>Building</label>
        <select name="building" onchange="renderBuildingFields(this.closest('.building-section'))">
          <option value="Keyes">Mary E. Keyes</option>
          <option value="Matthews">Matthews</option>
          <option value="Wallingford">Wallingford</option>
        </select>
        <div class="building-fields"></div>
      </div>
    </div>
    <button type="button" class="add-building-button" onclick="addBuilding(${sweepNumber})">Add Building</button>
    <button type="button" class="copy-sweep-button" onclick="copySweep(${sweepNumber})">Copy Sweep</button>`;

  document.getElementById('sweep3Container').appendChild(sweepSection);
  document.getElementById('addSweep3Button').hidden = true;
  populateCADropdown(`s${sweepNumber}CAs`);
  renderBuildingFields(sweepSection.querySelector('.building-section'));
}

function addBuilding(sweepNumber) {
  const buildingSection = document.createElement('div');
  buildingSection.className = 'building-section';
  buildingSection.dataset.sweep = sweepNumber;
  buildingSection.innerHTML = `
    <label>Building</label>
    <select name="building" onchange="renderBuildingFields(this.closest('.building-section'))">
      <option value="Keyes">Mary E. Keyes</option>
      <option value="Matthews">Matthews</option>
      <option value="Wallingford">Wallingford</option>
    </select>
    <div class="building-fields"></div>`;

  document.getElementById(`sweep${sweepNumber}Buildings`).appendChild(buildingSection);
  renderBuildingFields(buildingSection);
  if (document.getElementById('view-floor').classList.contains('active')) {
    initializeGlobalFloorCarousel();
  }
}

function getBuildingReports(sweepNumber) {
  const buildingSections = [...document.querySelectorAll(`#sweep${sweepNumber}Buildings .building-section`)];

  return buildingSections
    .map(section => {
      const building = section.querySelector('[name="building"]').value;
      if (building === 'Keyes') {
        return getKeyesBuildingReport(section);
      }
      if (building === 'Matthews') {
        return getMatthewsBuildingReport(section);
      }
      if (building === 'Wallingford') {
        return getWallingfordBuildingReport(section);
      }
      const basement = section.querySelector('[name="basement"]').value;
      const floorsWithNotes = [6, 5, 4, 3, 2, 1]
        .map(floor => `Floor ${floor}: ${section.querySelector(`[name="floor${floor}"]`).value}${getLocationNote(section, `floor${floor}`)}`)
        .join('\n');
      return `Building: ${building}\n${floorsWithNotes}\nBasement: ${basement}${getLocationNote(section, 'basement')}`;
    })
    .join('\n\n');
}

function getSweepReport(sweepNumber) {
  const leadCA = getSelectedLastNames('leadCA');
  const supportCAs = getSelectedLastNames('supportCAs');
  const cas = [leadCA, supportCAs].filter(Boolean).join(', ');
  const buildings = getBuildingReports(sweepNumber);
  return buildings.replace(/^(Building:[^\n]*)/gm, `$1\nCAs on Sweeps: ${cas}`);
}

function copySweep(sweepNumber) {
  if (sweepNumber === 2 && !document.getElementById('sweep2Enabled').checked) {
    return;
  }

  const sweepReport = getSweepReport(sweepNumber);
  navigator.clipboard.writeText(sweepReport).then(() => {
    alert('Sweep copied to clipboard!');
  }).catch(err => {
    alert("Failed to copy text. Check console for errors.");
    console.error("Clipboard error:", err);
  });
}

function getKeyesBuildingReport(section) {
  const floorRoomSteppers = [...section.querySelectorAll('.room-steppers:not(.keyes-basement-rooms)')];
  const floors = [6, 5, 4, 3, 2, 1].map(floor => {
    const roomSteppers = floorRoomSteppers[6 - floor];
    const roomStatuses = [...roomSteppers.querySelectorAll('input[data-room]')]
      .map(formatRoomStatus);
    return `Floor ${floor}: ${roomStatuses.join(' ')}${getLocationNote(section, `floor${floor}`)}`;
  }).join('\n');
  const floor6Stepper = floorRoomSteppers[0].querySelector('input[data-room]');
  const floor6 = Number(floor6Stepper.value) > 0
    ? `Met ${floor6Stepper.value} students in the Study Room. Roof access locked.`
    : 'Quiet. Roof access locked.';
  const basement = [...section.querySelectorAll('.keyes-basement-rooms input[data-room]')]
    .map(formatRoomStatus)
    .join(' ');
  return `Building: Mary E. Keyes\n${floors}\nFloor 6: ${floor6}${getLocationNote(section, 'floor6')}\nBasement: ${basement}${getLocationNote(section, 'basement')}`;
}

function getMatthewsBuildingReport(section) {
  const floors = [4, 3, 2, 1].map(floor =>
    `Floor ${floor}: ${section.querySelector(`[name="floor${floor}"]`).value}`
  ).join('\n');
  const commonRooms = [...section.querySelectorAll('.matthews-common-rooms input[data-room]')]
    .map(formatRoomStatus)
    .join(' ');
  const basement = [...section.querySelectorAll('.matthews-basement-rooms input[data-room]')]
    .map(formatRoomStatus)
    .join(' ');
  const storage = section.querySelector('[name="storageUnlocked"]').checked
    ? 'Storage rooms found unlocked.'
    : 'All storage rooms were locked.';
  return `Building: Matthews\n${floors}\nCommon Rooms: ${commonRooms}\nBasement: ${basement}${getLocationNote(section, 'basement')}\n${storage}`;
}

function getWallingfordBuildingReport(section) {
  const teaRoom = section.querySelector('input[data-room="Tea Room"]');
  const floor1 = formatRoomStatus(teaRoom);
  const basement = [...section.querySelectorAll('.wallingford-basement-rooms input[data-room]')]
    .map(formatRoomStatus)
    .join(' ');
  const floors = `Floor 3: ${section.querySelector('[name="floor3"]').value}\nFloor 2: ${section.querySelector('[name="floor2"]').value}\nFloor 1: ${floor1}`;
  return `Building: Wallingford\n${floors}\nBasement: ${basement}`;
}

function updateIdFields(type, sweepNumber) {
  const countInputIds = {
    ir: `s${sweepNumber}IRs`,
    soc: `s${sweepNumber}SOCs`,
    workOrder: `s${sweepNumber}WorkOrders`
  };
  const idLabels = {
    ir: 'Incident ID',
    soc: 'Concern ID',
    workOrder: 'Room Space ID'
  };
  const countInput = document.getElementById(countInputIds[type]);
  const fieldsContainer = document.getElementById(`s${sweepNumber}${type === 'ir' ? 'Ir' : type === 'soc' ? 'Soc' : 'WorkOrder'}IdFields`);
  const count = Math.max(0, Number.parseInt(countInput.value, 10) || 0);
  const idLabel = idLabels[type];

  fieldsContainer.innerHTML = '';
  fieldsContainer.hidden = count === 0;

  for (let index = 1; index <= count; index += 1) {
    const label = document.createElement('label');
    label.textContent = `${idLabel} ${index}`;
    const input = document.createElement('input');
    input.type = 'text';
    input.name = `${type}Id`;
    input.placeholder = `Enter ${idLabel.toLowerCase()}`;
    fieldsContainer.append(label, input);
  }
}

function getSubmittedIds(type, sweepNumber) {
  const containerId = `s${sweepNumber}${type === 'ir' ? 'Ir' : type === 'soc' ? 'Soc' : 'WorkOrder'}IdFields`;
  return [...document.querySelectorAll(`#${containerId} input`)]
    .map(input => input.value.trim())
    .join(', ');
}

function getSelectedNames(id) {
  return [...document.getElementById(id).querySelectorAll('input:checked')]
    .map(input => input.value)
    .join(', ');
}

function getSelectedLastNames(id) {
  return [...document.getElementById(id).querySelectorAll('input:checked')]
    .map(input => input.value.trim().split(/\s+/).pop().toUpperCase())
    .join(', ');
}

function formatSubmittedItems(count, singularName, idLabel, ids) {
  const itemName = Number(count) === 1 ? singularName : `${singularName}s`;
  const idDetails = Number(count) > 0 ? ` (${idLabel}: ${ids})` : '';
  return `${count} ${itemName} submitted${idDetails}`;
}

function getSweepSummary(sweepNumber) {
  const vibe = document.getElementById(`s${sweepNumber}Vibe`).value;
  const calls = document.getElementById(`s${sweepNumber}Calls`).value;
  const irs = document.getElementById(`s${sweepNumber}IRs`).value;
  const socs = document.getElementById(`s${sweepNumber}SOCs`).value;
  const workOrders = document.getElementById(`s${sweepNumber}WorkOrders`).value;
  const irIds = getSubmittedIds('ir', sweepNumber);
  const socIds = getSubmittedIds('soc', sweepNumber);
  const workOrderIds = getSubmittedIds('workOrder', sweepNumber);

  return `\nCoverage Summary:\n${vibe}\n${formatSubmittedItems(irs, 'IR', 'IncidentID', irIds)}\n${formatSubmittedItems(socs, 'SOC', 'ConcernID', socIds)}\n${formatSubmittedItems(workOrders, 'Work Order', 'WorkOrderID', workOrderIds)}\n${calls} call(s) were received`;
}

function buildReport() {
  const sweepReports = getEnabledSweepNumbers()
    .map(sweepNumber => `${getSweepReport(sweepNumber)}\n${getSweepSummary(sweepNumber)}`)
    .join('\n\n');

  const onTime = document.getElementById('onTimeCheck').checked ? "All CAs were on time for coverage and sweeps." : "Not all CAs were on time.";

  return `${sweepReports}

${onTime}`;
}

function generateReport() {
  const finalReport = buildReport();
  document.getElementById('reportPreview').value = finalReport;
  const startTime = formatTime(document.getElementById('startTime').value);
  const endTime = formatTime(document.getElementById('s1EndTime').value);
  document.getElementById('timeReference').textContent =
    `Time Reference:\nStart Time: ${startTime}\nEnd Time: ${endTime}`;
  showView('view-preview');
}

function copyReport() {
  const finalReport = document.getElementById('reportPreview').value;
  navigator.clipboard.writeText(finalReport).then(() => {
    alert("Report copied to clipboard! Ready to paste into the portal.");
  }).catch(err => {
    alert("Failed to copy text. Check console for errors.");
    console.error("Clipboard error:", err);
  });
}