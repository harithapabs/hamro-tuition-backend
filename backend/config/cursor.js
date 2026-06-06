function sortByKey(arr, sortSpec) {
  if (!sortSpec) return arr;
  const keys = Object.keys(sortSpec);
  return [...arr].sort((a, b) => {
    for (const key of keys) {
      const dir = sortSpec[key];
      const av = a[key];
      const bv = b[key];
      if (av === bv) continue;
      if (av === undefined || av === null) return dir === -1 ? 1 : -1;
      if (bv === undefined || bv === null) return dir === -1 ? -1 : 1;
      if (av < bv) return dir === -1 ? 1 : -1;
      if (av > bv) return dir === -1 ? -1 : 1;
    }
    return 0;
  });
}

class Cursor {
  constructor(executor) {
    this._sortSpec = null;
    this._limitN = null;
    this._skipN = null;
    this._executor = executor;
  }
  sort(spec) { this._sortSpec = spec; return this; }
  limit(n) { this._limitN = n; return this; }
  skip(n) { this._skipN = n; return this; }
  then(onFulfilled, onRejected) {
    return this._executor().then((docs) => {
      let out = sortByKey(docs, this._sortSpec);
      if (this._skipN) out = out.slice(this._skipN);
      if (this._limitN !== null && this._limitN !== undefined) out = out.slice(0, this._limitN);
      return out;
    }).then(onFulfilled, onRejected);
  }
  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
  finally(onFinally) {
    return this.then((v) => Promise.resolve(v).finally(onFinally), (e) => Promise.reject(e).finally(onFinally));
  }
}

module.exports = { Cursor };
