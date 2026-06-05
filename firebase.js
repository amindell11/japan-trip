(function () {
  const CFG = window.FIREBASE_CONFIG;
  const configured =
    CFG && CFG.apiKey && !String(CFG.apiKey).startsWith("YOUR_");

  let auth, db, currentUser = null;
  const listeners = [];

  function init() {
    if (!configured) {
      console.warn(
        "[Trip] Firebase not configured — sign-in, ratings, and comments disabled. See FIREBASE_SETUP.md."
      );
      return;
    }
    firebase.initializeApp(CFG);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.onAuthStateChanged((u) => {
      currentUser = u;
      for (const fn of listeners) fn(u);
    });
  }

  function on(fn) {
    listeners.push(fn);
    fn(currentUser);
  }

  async function signIn() {
    const p = new firebase.auth.GoogleAuthProvider();
    await auth.signInWithPopup(p);
  }

  async function signOut() {
    await auth.signOut();
  }

  async function submitRating(slug, rating) {
    if (!currentUser) throw new Error("Not signed in");
    const ratingRef = db.doc(`places/${slug}/ratings/${currentUser.uid}`);
    const placeRef = db.doc(`places/${slug}`);
    await db.runTransaction(async (tx) => {
      const [rSnap, pSnap] = await Promise.all([
        tx.get(ratingRef),
        tx.get(placeRef),
      ]);
      const prev = rSnap.exists ? rSnap.data().rating : 0;
      const prevPlace = pSnap.exists ? pSnap.data() : {};
      const sum = (prevPlace.ratingSum || 0) - prev + rating;
      const count = (prevPlace.ratingCount || 0) + (rSnap.exists ? 0 : 1);
      tx.set(placeRef, { ratingSum: sum, ratingCount: count }, { merge: true });
      tx.set(ratingRef, {
        rating,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
  }

  async function getUserRating(slug) {
    if (!configured || !currentUser) return null;
    const doc = await db.doc(`places/${slug}/ratings/${currentUser.uid}`).get();
    return doc.exists ? doc.data().rating : null;
  }

  async function getAllStats() {
    if (!configured) return {};
    const snap = await db.collection("places").get();
    const out = {};
    snap.forEach((d) => (out[d.id] = d.data()));
    return out;
  }

  async function getStats(slug) {
    if (!configured) return null;
    const doc = await db.doc(`places/${slug}`).get();
    return doc.exists
      ? doc.data()
      : { ratingSum: 0, ratingCount: 0, commentCount: 0 };
  }

  async function getComments(slug) {
    if (!configured) return [];
    const snap = await db
      .collection(`places/${slug}/comments`)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function addComment(slug, text) {
    if (!currentUser) throw new Error("Not signed in");
    const trimmed = (text || "").trim().slice(0, 2000);
    if (!trimmed) return;
    const placeRef = db.doc(`places/${slug}`);
    const commentRef = db.collection(`places/${slug}/comments`).doc();
    await db.runTransaction(async (tx) => {
      const pSnap = await tx.get(placeRef);
      const count = ((pSnap.data() || {}).commentCount || 0) + 1;
      tx.set(placeRef, { commentCount: count }, { merge: true });
      tx.set(commentRef, {
        uid: currentUser.uid,
        name: currentUser.displayName || "Anon",
        photo: currentUser.photoURL || null,
        text: trimmed,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
  }

  async function deleteComment(slug, commentId) {
    if (!currentUser) throw new Error("Not signed in");
    const placeRef = db.doc(`places/${slug}`);
    const commentRef = db.doc(`places/${slug}/comments/${commentId}`);
    await db.runTransaction(async (tx) => {
      const [pSnap, cSnap] = await Promise.all([
        tx.get(placeRef),
        tx.get(commentRef),
      ]);
      if (!cSnap.exists) return;
      if (cSnap.data().uid !== currentUser.uid) throw new Error("Not allowed");
      const count = Math.max(
        0,
        ((pSnap.data() || {}).commentCount || 0) - 1
      );
      tx.set(placeRef, { commentCount: count }, { merge: true });
      tx.delete(commentRef);
    });
  }

  function subscribeItinerary(cb) {
    if (!configured) {
      cb([]);
      return () => {};
    }
    return db
      .collection("itinerary")
      .onSnapshot(
        (snap) => {
          const out = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          cb(out);
        },
        (err) => {
          console.warn("[Trip] itinerary subscribe failed", err);
          cb([]);
        }
      );
  }

  async function addItineraryEntry(data) {
    if (!currentUser) throw new Error("Not signed in");
    const ts = firebase.firestore.FieldValue.serverTimestamp();
    const ref = await db.collection("itinerary").add({
      ...data,
      createdBy: {
        uid: currentUser.uid,
        name: currentUser.displayName || "Anon",
        photo: currentUser.photoURL || null,
      },
      createdAt: ts,
      updatedAt: ts,
    });
    return ref.id;
  }

  async function updateItineraryEntry(id, patch) {
    if (!currentUser) throw new Error("Not signed in");
    await db.doc(`itinerary/${id}`).set(
      {
        ...patch,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function deleteItineraryEntry(id) {
    if (!currentUser) throw new Error("Not signed in");
    await db.doc(`itinerary/${id}`).delete();
  }

  function subscribeDayTitles(cb) {
    if (!configured) {
      cb({});
      return () => {};
    }
    return db.doc("itinerary_meta/days").onSnapshot(
      (doc) => {
        const data = doc.exists ? doc.data() : {};
        cb(data.titles || {});
      },
      (err) => {
        console.warn("[Trip] day-titles subscribe failed", err);
        cb({});
      }
    );
  }

  async function setDayTitle(dayNum, title) {
    if (!currentUser) throw new Error("Not signed in");
    const patch = { titles: { [String(dayNum)]: title || "" } };
    await db.doc("itinerary_meta/days").set(patch, { merge: true });
  }

  function subscribeArchived(cb) {
    if (!configured) {
      cb({});
      return () => {};
    }
    return db.doc("itinerary_meta/archived").onSnapshot(
      (doc) => {
        const data = doc.exists ? doc.data() : {};
        cb(data.slugs || {});
      },
      (err) => {
        console.warn("[Trip] archived subscribe failed", err);
        cb({});
      }
    );
  }

  async function setPlaceArchived(slug, archived) {
    if (!currentUser) throw new Error("Not signed in");
    const patch = {
      slugs: {
        [slug]: archived ? true : firebase.firestore.FieldValue.delete(),
      },
    };
    await db.doc("itinerary_meta/archived").set(patch, { merge: true });
  }

  function mountAuthSlot() {
    const slot = document.getElementById("auth-slot");
    if (!slot) return;
    if (!configured) {
      slot.innerHTML =
        '<span class="auth-disabled" title="Add your Firebase config to firebase-config.js">sign-in off</span>';
      return;
    }
    function render() {
      slot.innerHTML = "";
      if (currentUser) {
        if (currentUser.photoURL) {
          const img = document.createElement("img");
          img.src = currentUser.photoURL;
          img.alt = "";
          img.className = "auth-avatar";
          slot.appendChild(img);
        }
        const name = document.createElement("span");
        name.className = "auth-name";
        name.textContent =
          currentUser.displayName || currentUser.email || "User";
        const btn = document.createElement("button");
        btn.className = "auth-btn";
        btn.textContent = "Sign out";
        btn.addEventListener("click", () => signOut());
        slot.append(name, btn);
      } else {
        const btn = document.createElement("button");
        btn.className = "auth-btn primary";
        btn.textContent = "Sign in";
        btn.addEventListener("click", () =>
          signIn().catch((e) => alert(e.message))
        );
        slot.appendChild(btn);
      }
    }
    on(render);
  }

  window.Trip = {
    configured,
    init,
    on,
    signIn,
    signOut,
    submitRating,
    getUserRating,
    getAllStats,
    getStats,
    getComments,
    addComment,
    deleteComment,
    subscribeItinerary,
    addItineraryEntry,
    updateItineraryEntry,
    deleteItineraryEntry,
    subscribeDayTitles,
    setDayTitle,
    subscribeArchived,
    setPlaceArchived,
    mountAuthSlot,
    get currentUser() {
      return currentUser;
    },
  };

  init();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAuthSlot);
  } else {
    mountAuthSlot();
  }
})();
