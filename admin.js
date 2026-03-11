import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

import { auth, db, storage } from "./firebase-config.js";

const loginStatus = document.getElementById("loginStatus");
const loginForm = document.getElementById("loginForm");
const authSection = document.getElementById("authSection");
const adminSection = document.getElementById("adminSection");
const signedInText = document.getElementById("signedInText");
const logoutBtn = document.getElementById("logoutBtn");

const uploadForm = document.getElementById("uploadForm");
const titleInput = document.getElementById("title");
const captionInput = document.getElementById("caption");
const photoFileInput = document.getElementById("photoFile");
const uploadProgress = document.getElementById("uploadProgress");
const statusText = document.getElementById("statusText");
const adminPhotoList = document.getElementById("adminPhotoList");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginStatus.textContent = "Signing in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginStatus.textContent = "";
    loginForm.reset();
  } catch (error) {
    console.error(error);
    loginStatus.textContent = humanizeError(error);
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
    statusText.textContent = "Could not sign out.";
  }
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = photoFileInput.files?.[0];
  const title = titleInput.value.trim();
  const caption = captionInput.value.trim();

  if (!file) {
    statusText.textContent = "Choose a file first.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    statusText.textContent = "Only image files are allowed.";
    return;
  }

  try {
    statusText.textContent = "Starting upload...";
    uploadProgress.value = 0;

    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const filePath = `photos/${Date.now()}-${safeName}`;
    const storageRef = ref(storage, filePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        uploadProgress.value = progress;
        statusText.textContent = `Uploading... ${Math.round(progress)}%`;
      },
      (error) => {
        console.error(error);
        statusText.textContent = humanizeError(error);
      },
      async () => {
        const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

        await addDoc(collection(db, "photos"), {
          title: title || "Untitled",
          caption,
          imageUrl,
          storagePath: filePath,
          createdAt: serverTimestamp()
        });

        uploadForm.reset();
        uploadProgress.value = 100;
        statusText.textContent = "Upload complete.";
        await renderAdminPhotos();
      }
    );
  } catch (error) {
    console.error(error);
    statusText.textContent = humanizeError(error);
  }
});

async function renderAdminPhotos() {
  adminPhotoList.innerHTML = "<p>Loading...</p>";

  try {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      adminPhotoList.innerHTML = "<p>No photos uploaded yet.</p>";
      return;
    }

    adminPhotoList.innerHTML = "";

    snapshot.docs.forEach((snapshotDoc) => {
      const photo = { id: snapshotDoc.id, ...snapshotDoc.data() };

      const row = document.createElement("div");
      row.className = "admin-row";

      row.innerHTML = `
        <img class="admin-thumb" src="${escapeHtml(photo.imageUrl)}" alt="${escapeHtml(photo.title || "Untitled")}" />
        <div class="admin-meta">
          <h3>${escapeHtml(photo.title || "Untitled")}</h3>
          <p>${escapeHtml(photo.caption || "")}</p>
        </div>
        <button class="delete-btn" type="button">Delete</button>
      `;

      const deleteBtn = row.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", async () => {
        const confirmed = window.confirm(`Delete "${photo.title || "Untitled"}"?`);
        if (!confirmed) return;

        try {
          deleteBtn.disabled = true;
          deleteBtn.textContent = "Deleting...";

          if (photo.storagePath) {
            await deleteObject(ref(storage, photo.storagePath));
          }

          await deleteDoc(doc(db, "photos", photo.id));
          await renderAdminPhotos();
          statusText.textContent = "Photo deleted.";
        } catch (error) {
          console.error(error);
          deleteBtn.disabled = false;
          deleteBtn.textContent = "Delete";
          statusText.textContent = humanizeError(error);
        }
      });

      adminPhotoList.appendChild(row);
    });
  } catch (error) {
    console.error(error);
    adminPhotoList.innerHTML = "<p>Could not load uploaded photos.</p>";
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    authSection.classList.add("hidden");
    adminSection.classList.remove("hidden");
    signedInText.textContent = `Signed in as ${user.email}`;
    statusText.textContent = "You can upload photos now.";
    await renderAdminPhotos();
  } else {
    authSection.classList.remove("hidden");
    adminSection.classList.add("hidden");
    signedInText.textContent = "";
    adminPhotoList.innerHTML = "";
    statusText.textContent = "Waiting for sign in.";
  }
});

function humanizeError(error) {
  const message = String(error?.message || "Something went wrong.");
  if (message.includes("auth/invalid-credential")) return "Wrong email or password.";
  if (message.includes("auth/invalid-email")) return "Invalid email address.";
  if (message.includes("storage/unauthorized")) return "This account is not allowed to upload.";
  return message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}