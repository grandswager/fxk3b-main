/**
 * Gallery page logic.
 * - Fetches photo data from data/photos.json
 * - Displays newest first, but frame numbers (No. 001, 002...) are
 *   assigned in chronological/oldest-first order, so they stay stable
 *   like a roll of film shot in sequence even though the newest photo
 *   shows up at the top of the grid
 * - Renders a card per photo into #gallery-grid
 * - Opens a detail modal with EXIF-style info on click
 */

const GALLERY_GRID = document.getElementById("gallery-grid");
const GALLERY_STATUS = document.getElementById("gallery-status");
const MODAL_OVERLAY = document.getElementById("photo-modal");
const MODAL_CONTENT = document.getElementById("modal-content");

let photos = [];

function formatDate(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function frameLabel(photo) {
  return "No. " + String(photo.frameNumber).padStart(3, "0");
}

function renderGrid() {
  GALLERY_GRID.innerHTML = "";

  photos.forEach((photo, index) => {
    const card = document.createElement("button");
    card.className = "photo-card";
    card.type = "button";
    card.setAttribute("aria-haspopup", "dialog");
    card.dataset.index = String(index);

    card.innerHTML = `
      <div class="frame">
        <span class="frame-number">${frameLabel(photo)}</span>
        <img src="${photo.thumbnail}" alt="${photo.title}, ${photo.location}" loading="lazy" decoding="async" />
      </div>
      <div class="card-body">
        <h3>${photo.title}</h3>
        <div class="card-meta">
          <span>${photo.location}</span>
          <span>${formatDate(photo.date)}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openModal(index));
    GALLERY_GRID.appendChild(card);
  });
}

function openModal(index) {
  const photo = photos[index];
  if (!photo) return;

  MODAL_CONTENT.innerHTML = `
    <div class="modal-image">
      <img src="${photo.full}" alt="${photo.title}, ${photo.location}" decoding="async" />
    </div>
    <div class="modal-details">
      <button type="button" class="modal-close" data-close>Close ✕</button>
      <div class="modal-frame-number">${frameLabel(photo)}</div>
      <h3>${photo.title}</h3>
      <div class="modal-location">${photo.location} — ${formatDate(photo.date)}</div>
      <table class="exif-table">
        <tbody>
          <tr><td>Camera</td><td>${photo.camera}</td></tr>
          <tr><td>Lens</td><td>${photo.lens}</td></tr>
          <tr><td>Settings</td><td>${photo.settings}</td></tr>
        </tbody>
      </table>
      <p class="modal-description">${photo.description}</p>
    </div>
  `;

  MODAL_OVERLAY.classList.add("open");
  MODAL_OVERLAY.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  const closeBtn = MODAL_CONTENT.querySelector("[data-close]");
  closeBtn.focus();
  closeBtn.addEventListener("click", closeModal);
}

function closeModal() {
  MODAL_OVERLAY.classList.remove("open");
  MODAL_OVERLAY.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

MODAL_OVERLAY.addEventListener("click", (event) => {
  if (event.target === MODAL_OVERLAY) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

async function loadPhotos() {
  try {
    const response = await fetch("data/photos.json");
    if (!response.ok) throw new Error("Request failed with " + response.status);
    const data = await response.json();

    // Frame numbers follow chronological (oldest-first) order, like a
    // roll of film shot in sequence — independent of display order.
    // Same-day photos are tie-broken by id.
    const byDateThenId = (a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    };

    const chronological = data.slice().sort(byDateThenId);
    chronological.forEach((photo, index) => {
      photo.frameNumber = index + 1;
    });

    // Display order is newest first (same tiebreaker, reversed).
    photos = chronological.slice().sort((a, b) => byDateThenId(b, a));

    if (photos.length === 0) {
      GALLERY_STATUS.textContent = "No photos yet — check back soon.";
      return;
    }

    GALLERY_STATUS.textContent = photos.length + " photos · newest to oldest";
    renderGrid();
  } catch (err) {
    GALLERY_GRID.innerHTML = "";
    GALLERY_STATUS.textContent = "";
    const errorEl = document.createElement("p");
    errorEl.className = "gallery-error";
    errorEl.textContent =
      "Couldn't load the gallery data (" + err.message + "). If you're viewing this file directly from disk, run it through a local server instead — browsers block fetch() on file:// URLs.";
    GALLERY_GRID.appendChild(errorEl);
  }
}

loadPhotos();