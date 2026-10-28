/**
 * Minimal in-memory stand-in for the slice of the Firestore Admin API used by the order service.
 * It exists so transactional business logic (idempotency, stock commits) can be unit-tested without
 * the emulator. It is NOT a general Firestore implementation. Rules are tested separately (see firebase/rules-tests).
 */
type Data = Record<string, unknown>;
const INC = "__inc";
const TS = "__serverTs";

export const FakeFieldValue = {
  increment: (n: number) => ({ [INC]: n }),
  serverTimestamp: () => ({ [TS]: true }),
};

const isObj = (v: unknown): v is Data => !!v && typeof v === "object" && !Array.isArray(v);

function apply(target: Data, patch: Data, merge: boolean): Data {
  const out: Data = merge ? { ...target } : {};
  for (const [k, v] of Object.entries(patch)) {
    if (isObj(v) && INC in v) out[k] = ((out[k] as number) ?? 0) + (v[INC] as number);
    else if (isObj(v) && TS in v) out[k] = Date.now();
    else if (isObj(v) && merge && isObj(out[k])) out[k] = apply(out[k] as Data, v, true);
    else if (isObj(v)) out[k] = apply({}, v, false);
    else out[k] = v;
  }
  return out;
}

export class FakeDb {
  store = new Map<string, Data>();

  collection(name: string) {
    return new FakeCollection(this, name);
  }
  async getAll(...refs: FakeRef[]) {
    return Promise.all(refs.map((r) => r.get()));
  }
  async runTransaction<T>(fn: (tx: FakeTx) => Promise<T>): Promise<T> {
    // Serial execution is sufficient for unit tests; real Firestore retries on contention.
    return fn(new FakeTx(this));
  }
  seed(path: string, data: Data) {
    this.store.set(path, structuredClone(data));
  }
  read<T = Data>(path: string): T | undefined {
    return this.store.get(path) as T | undefined;
  }
}

class FakeSnap {
  constructor(public ref: FakeRef, private d: Data | undefined) {}
  get id() { return this.ref.id; }
  get exists() { return this.d !== undefined; }
  data() { return this.d ? structuredClone(this.d) : undefined; }
}

export class FakeRef {
  constructor(public db: FakeDb, public path: string) {}
  get id() { return this.path.split("/").pop()!; }
  async get() { return new FakeSnap(this, this.db.store.get(this.path)); }
  async set(data: Data, opts?: { merge?: boolean }) {
    this.db.store.set(this.path, apply(this.db.store.get(this.path) ?? {}, data, !!opts?.merge));
  }
  async create(data: Data) {
    if (this.db.store.has(this.path)) throw new Error("ALREADY_EXISTS");
    this.db.store.set(this.path, apply({}, data, false));
  }
  async update(data: Data) {
    if (!this.db.store.has(this.path)) throw new Error("NOT_FOUND");
    this.db.store.set(this.path, apply(this.db.store.get(this.path)!, data, true));
  }
  async delete() { this.db.store.delete(this.path); }
  collection(name: string) { return new FakeCollection(this.db, `${this.path}/${name}`); }
}

class FakeCollection {
  private filters: ((d: Data) => boolean)[] = [];
  private max = Infinity;
  constructor(public db: FakeDb, public path: string) {}
  doc(id?: string) { return new FakeRef(this.db, `${this.path}/${id ?? Math.random().toString(36).slice(2)}`); }
  async add(data: Data) { const r = this.doc(); await r.set(data); return r; }
  where(field: string, op: string, value: unknown) {
    const c = new FakeCollection(this.db, this.path);
    c.filters = [...this.filters, (d) => (op === "==" ? d[field] === value : op === "<" ? (d[field] as number) < (value as number) : false)];
    c.max = this.max;
    return c;
  }
  limit(n: number) { const c = new FakeCollection(this.db, this.path); c.filters = this.filters; c.max = n; return c; }
  async get() {
    const prefix = `${this.path}/`;
    const docs = [...this.db.store.entries()]
      .filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes("/"))
      .filter(([, d]) => this.filters.every((f) => f(d)))
      .slice(0, this.max)
      .map(([p, d]) => new FakeSnap(new FakeRef(this.db, p), d));
    return { docs, empty: docs.length === 0 };
  }
}

class FakeTx {
  constructor(private db: FakeDb) {}
  async get(x: FakeRef | FakeCollection) { return x.get(); }
  async getAll(...refs: FakeRef[]) { return this.db.getAll(...refs); }
  set(ref: FakeRef, data: Data, opts?: { merge?: boolean }) { void ref.set(data, opts); }
  update(ref: FakeRef, data: Data) { void ref.update(data); }
}
