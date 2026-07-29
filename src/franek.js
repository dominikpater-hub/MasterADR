// Moduł Franka — bufor localStorage + synchronizacja /api/feedback (z V4).
/* Franek sync — bufor lokalny + wysylka na serwer.
   Zapis lokalny jest zrodlem prawdy: dziala offline (kierowca w trasie),
   a serwer dostaje kopie gdy tylko jest siec. */
(function () {
  var K = "masteradr.feedback.v1";
  var EP = "/api/feedback";
  var BUILD = "v4-2026-07-24";
  var syncing = false;

  function read() {
    try { var r = localStorage.getItem(K); return r ? JSON.parse(r) : []; }
    catch (e) { return []; }
  }
  function write(a) {
    try { localStorage.setItem(K, JSON.stringify(a)); } catch (e) {}
  }
  function cid(it) {
    return (it.factId || "x") + ":" + (it.ts || 0);
  }

  // Dodaje wpis do bufora i probuje wyslac.
  function add(entry) {
    var arr = read();
    entry.cid = cid(entry);
    entry.build = BUILD;
    entry.sent = false;
    arr.push(entry);
    write(arr);
    sync();
  }

  // Wysyla wszystko, co jeszcze nie poszlo. Bezpieczne przy wielokrotnym wywolaniu.
  function sync() {
    if (syncing || !navigator.onLine) return;
    var arr = read();
    var pending = arr.filter(function (x) { return !x.sent; });
    if (!pending.length) return;

    syncing = true;
    var batch = pending.slice(0, 50);

    fetch(EP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: batch.map(function (x) {
          return {
            cid: x.cid, factId: x.factId, topic: x.topic,
            cat: x.cat, msg: x.msg, ts: x.ts, build: x.build
          };
        })
      })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.ok && j.accepted) {
          var ok = {};
          j.accepted.forEach(function (c) { ok[c] = 1; });
          var cur = read();
          cur.forEach(function (x) { if (ok[x.cid]) x.sent = true; });
          write(cur);
        }
      })
      .catch(function () { /* brak sieci — zostaje w buforze, sprobujemy pozniej */ })
      .then(function () {
        syncing = false;
        var still = read().filter(function (x) { return !x.sent; });
        if (still.length && batch.length === 50) sync(); // kolejna partia
      });
  }

  window.__franek = { add: add, sync: sync };

  window.addEventListener("online", sync);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) sync();
  });
  setTimeout(sync, 3000); // dosle to, co zebrano zanim byl backend
})();
