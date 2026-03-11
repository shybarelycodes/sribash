import {
  collection,
  getDocs,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import { db } from "./firebase-config.js";

let allPhotos = [];
let filteredPhotos = [];
let currentIndex = 0;

const gallery = document.getElementById("gallery");
const emptyState = document.getElementById("emptyState");
const photoCount = document.getElementById("photoCount");
const searchInput = document.getElementById("searchInput");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxTitle = document.getElementById("lightboxTitle");
const lightboxCaption = document.getElementById("lightboxCaption");
const closeLightbox = document.getElementById("closeLightbox");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

document.getElementById("year").textContent = new Date().getFullYear();

async function loadGallery() {
  try {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    allPhotos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    filteredPhotos = [...allPhotos];
    renderGallery(filteredPhotos);
  } catch (error) {
    console.error(error);
    photoCount.textContent = "Could not load photos.";
    gallery.innerHTML = `
      <div class="empty">
        <h3>Gallery failed to load</h3>
        <p>Check your Firebase config, Firestore rules, and photo collection.</p>
      </div>
    `;
  }
}

function renderGallery(photos) {
  gallery.innerHTML = "";

  if (!Array.isArray(photos) || photos.length === 0) {
    photoCount.textContent = "0 photos";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  photoCount.textContent = `${photos.length} photo${photos.length === 1 ? "" : "s"}`;

  photos.forEach((photo, index) => {
    const article = document.createElement("article");
    article.className = "card";
    article.tabIndex = 0;
    article.setAttribute("role", "button");
    article.setAttribute("aria-label", `Open image: ${photo.title || "Untitled"}`);

    article.innerHTML = `
      <div class="card__image-wrap">
        <img
          class="card__image"
          src="${escapeHtml(photo.imageUrl)}"
          alt="${escapeHtml(photo.title || "Untitled")}"
          loading="lazy"
        />
      </div>
      <div class="card__body">
        <h3 class="card__title">${escapeHtml(photo.title || "Untitled")}</h3>
        <p class="card__caption">${escapeHtml(photo.caption || "")}</p>
      </div>
    `;

    article.addEventListener("click", () => openLightbox(index));
    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openLightbox(index);
      }
    });

    gallery.appendChild(article);
  });
}

function openLightbox(index) {
  currentIndex = index;
  updateLightbox();
  lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeViewer() {
  lightbox.classList.add("hidden");
  document.body.style.overflow = "";
}

function updateLightbox() {
  if (!filteredPhotos[currentIndex]) return;

  const photo = filteredPhotos[currentIndex];
  lightboxImage.src = photo.imageUrl;
  lightboxImage.alt = photo.title || "Untitled";
  lightboxTitle.textContent = photo.title || "Untitled";
  lightboxCaption.textContent = photo.caption || "";
}

function showNext() {
  currentIndex = (currentIndex + 1) % filteredPhotos.length;
  updateLightbox();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
  updateLightbox();
}

function filterPhotos(searchTerm) {
  const normalized = searchTerm.trim().toLowerCase();

  filteredPhotos = allPhotos.filter((photo) => {
    const haystack = `${photo.title || ""} ${photo.caption || ""}`.toLowerCase();
    return haystack.includes(normalized);
  });

  renderGallery(filteredPhotos);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", (event) => {
  filterPhotos(event.target.value);
});

closeLightbox.addEventListener("click", closeViewer);
nextBtn.addEventListener("click", showNext);
prevBtn.addEventListener("click", showPrev);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeViewer();
});

document.addEventListener("keydown", (event) => {
  if (lightbox.classList.contains("hidden")) return;
  if (event.key === "Escape") closeViewer();
  if (event.key === "ArrowRight") showNext();
  if (event.key === "ArrowLeft") showPrev();
});

loadGallery();