import { SignIn, UserButton, useAuth } from "@clerk/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AdvisoryEditor, ProductEditor } from "./Editors";
import type {
    Advisory,
    Api,
    History,
    PageInfo,
    Product,
    Report,
    ReportStatus,
} from "./types";

const statuses: ReportStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
];
export const label = (text: string) =>
  text
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
export const date = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Date filtering utilities
const dateFilters = { "7days": 7, "14days": 14, "30days": 30, all: 0 };
function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
function isWithinDays(dateStr: string, days: number): boolean {
  if (days === 0) return true;
  return new Date(dateStr) >= daysAgo(days);
}

// CSV export utility
function exportToCSV(
  filename: string,
  data: unknown[],
  columns: { key: keyof any; label: string }[],
) {
  const header = columns.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((row) =>
    columns
      .map((c) => {
        let val = row[c.key];
        if (val === null || val === undefined) val = "";
        if (typeof val === "string") val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useResource<T>(api: Api, path: string, refresh = 0) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ error: error.message, loading: false });
      });
    return () => controller.abort();
  }, [api, path, refresh]);
  return state;
}

export default function App() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const api = useCallback<Api>(
    async (path, options = {}) => {
      const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
      if (!base) throw new Error("Set VITE_API_URL in the admin environment.");
      const token = await getToken();
      if (!token || !userId) throw new ApiError(401, "Please sign in again.");
      const response = await fetch(`${base}/api/admin${path}`, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new ApiError(
          response.status,
          body.message || "Unable to reach Codify. Please retry.",
        );
      return body;
    },
    [getToken, userId],
  );
  if (!isLoaded)
    return <main className="auth-page">Loading your session…</main>;
  if (!isSignedIn)
    return (
      <main className="auth-page">
        <div className="brand-mark">C</div>
        <p className="eyebrow">CODIFY ADMIN</p>
        <h1>A clearer view of your catalog.</h1>
        <p className="muted">
          Sign in with your authorized administrator account.
        </p>
        <SignIn routing="hash" />
      </main>
    );
  return <AdminGate key={userId} api={api} />;
}
function AdminGate({ api }: { api: Api }) {
  const [retry, setRetry] = useState(0);
  const { loading, error } = useResource(api, "/session", retry);
  if (loading)
    return <main className="auth-page">Checking administrator access…</main>;
  if (error)
    return (
      <main className="auth-page">
        <div className="brand-mark">C</div>
        <h1>Administrator access</h1>
        <p role="alert">{error}</p>
        <p className="muted">
          An authorized project owner must assign your account the admin role.
        </p>
        <button onClick={() => setRetry((v) => v + 1)}>Retry</button>
        <UserButton />
      </main>
    );
  return <Dashboard api={api} />;
}
export function Dashboard({ api }: { api: Api }) {
  const [tab, setTab] = useState("reports");
  const [productId, setProductId] = useState<string | undefined>();
  const openProduct = (id: string) => {
    setProductId(id);
    setTab("products");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="wordmark" href="#">
          <span className="brand-mark">C</span>codify
          <span className="admin-tag">admin</span>
        </a>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Admin navigation">
          {[
            ["reports", "◉", "Product reports"],
            ["products", "▦", "Product catalog"],
            ["advisories", "◇", "FDA advisories"],
          ].map(([key, icon, title]) => (
            <button
              key={key}
              className={tab === key ? "nav-item active" : "nav-item"}
              onClick={() => {
                setProductId(undefined);
                setTab(key);
              }}
            >
              <span aria-hidden>{icon}</span>
              {title}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="online-dot" />
          Online workspace
          <p>Updates saved here are shared with the Codify mobile app.</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            Catalog operations <span className="divider">/</span> {label(tab)}
          </span>
          <div className="account">
            <span>Administrator</span>
            <UserButton />
          </div>
        </header>
        <main className="main-content">
          {tab === "reports" ? (
            <Reports api={api} openProduct={openProduct} />
          ) : tab === "products" ? (
            <Catalog api={api} initialId={productId} />
          ) : (
            <Advisories api={api} />
          )}
        </main>
      </div>
    </div>
  );
}
function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">CODIFY WORKSPACE</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Notice({
  error,
  loading,
  retry,
}: {
  error?: string;
  loading: boolean;
  retry: () => void;
}) {
  if (loading)
    return (
      <p className="state-box" role="status">
        Loading records…
      </p>
    );
  return error ? (
    <div className="error-box" role="alert">
      {error} <button onClick={retry}>Retry</button>
    </div>
  ) : null;
}
function Pager({
  info,
  setPage,
}: {
  info: PageInfo;
  setPage: (page: number) => void;
}) {
  return (
    <div className="pager">
      <span>
        {info.total} records · Page {info.page} of{" "}
        {Math.max(1, info.totalPages)}
      </span>
      <div>
        <button
          disabled={info.page <= 1}
          onClick={() => setPage(info.page - 1)}
        >
          Previous
        </button>
        <button
          disabled={info.page >= info.totalPages}
          onClick={() => setPage(info.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
function Search({
  placeholder,
  onSearch,
  children,
}: {
  placeholder: string;
  onSearch: (q: string) => void;
  children?: ReactNode;
}) {
  const [value, setValue] = useState("");
  return (
    <form
      className="toolbar"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(value);
      }}
    >
      <input
        aria-label={placeholder}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button>Search</button>
      {children}
    </form>
  );
}
export function Badge({ value }: { value: string }) {
  return <span className={`badge ${value.toLowerCase()}`}>{label(value)}</span>;
}
function Reports({
  api,
  openProduct,
}: {
  api: Api;
  openProduct: (id: string) => void;
}) {
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [version, refresh] = useState(0);
  const [selected, select] = useState<string>();
  const [dateFilter, setDateFilter] = useState<keyof typeof dateFilters>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "urgent">("newest");
  const [bulkSelected, setBulkSelected] = useState(new Set<string>());
  const [bulkStatus, setBulkStatus] = useState<ReportStatus | "">();
  const [bulkNote, setBulkNote] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const { data, error, loading } = useResource<{
    reports: Report[];
    counts: Record<string, number>;
    pagination: PageInfo;
  }>(
    api,
    `/reports?${new URLSearchParams({ q, page: String(page), ...(status ? { status } : {}) })}`,
    version,
  );

  const filteredReports =
    data?.reports.filter((r) =>
      isWithinDays(r.submittedAt, dateFilters[dateFilter]),
    ) ?? [];
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sort === "newest")
      return (
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );
    if (sort === "oldest")
      return (
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      );
    if (sort === "urgent" && a.status === "PENDING" && b.status !== "PENDING")
      return -1;
    if (sort === "urgent" && a.status !== "PENDING" && b.status === "PENDING")
      return 1;
    return (
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );
  });

  async function submitBulkUpdate() {
    if (bulkSelected.size === 0 || !bulkStatus) return;
    setBulkBusy(true);
    try {
      for (const id of Array.from(bulkSelected)) {
        const report = data?.reports.find((r) => r.id === id);
        if (report) {
          await api(`/reports/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
              status: bulkStatus,
              resolutionNote: bulkNote,
              updatedAt: report.updatedAt,
            }),
          });
        }
      }
      refresh((v) => v + 1);
      setBulkSelected(new Set());
      setBulkStatus("");
      setBulkNote("");
    } finally {
      setBulkBusy(false);
    }
  }

  const daysAgoText = (dateStr: string) => {
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 86400000,
    );
    return days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days}d ago`;
  };

  return (
    <>
      <PageHeader
        title="Product reports"
        description="Review concerns, follow up with users, and keep the catalog accurate."
      >
        <button onClick={() => refresh((v) => v + 1)}>↻ Refresh</button>
      </PageHeader>
      <div className="stats">
        {statuses.map((item) => (
          <button
            className={`stat-card ${status === item ? "selected" : ""}`}
            key={item}
            onClick={() => {
              setStatus(status === item ? "" : item);
              setPage(1);
            }}
          >
            <span>{label(item)}</span>
            <strong>{data ? (data.counts[item] ?? 0) : "—"}</strong>
            <span className={`stat-line ${item.toLowerCase()}`} />
          </button>
        ))}
      </div>
      <section className="panel">
        <div className="panel-title">
          <h2>Report inbox</h2>
          <span className="muted">All users</span>
        </div>
        <Search
          placeholder="Search product, brand, or barcode"
          onSearch={(value) => {
            setQ(value);
            setPage(1);
          }}
        >
          <select
            aria-label="Report status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </Search>
        <div className="filter-bar">
          <select
            value={dateFilter}
            onChange={(e) =>
              setDateFilter(e.target.value as keyof typeof dateFilters)
            }
          >
            <option value="all">All time</option>
            <option value="7days">Last 7 days</option>
            <option value="14days">Last 14 days</option>
            <option value="30days">Last 30 days</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="urgent">Urgent (pending oldest)</option>
          </select>
          <button
            onClick={() =>
              exportToCSV("reports.csv", sortedReports, [
                { key: "productName", label: "Product" },
                { key: "brand", label: "Brand" },
                { key: "reason", label: "Concern" },
                { key: "status", label: "Status" },
                { key: "submittedAt", label: "Submitted" },
              ])
            }
            title="Download current view as CSV"
          >
            ⬇ Export
          </button>
        </div>
        <Notice {...{ error, loading }} retry={() => refresh((v) => v + 1)} />
        {data && (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          bulkSelected.size === sortedReports.length &&
                          sortedReports.length > 0
                        }
                        onChange={() => {
                          if (bulkSelected.size === sortedReports.length) {
                            setBulkSelected(new Set());
                          } else {
                            setBulkSelected(
                              new Set(sortedReports.map((r) => r.id)),
                            );
                          }
                        }}
                        title="Select all visible reports"
                      />
                    </th>
                    <th>Product</th>
                    <th>Concern</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>
                      <span className="sr-only">Action</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReports.map((report) => (
                    <tr
                      key={report.id}
                      className={bulkSelected.has(report.id) ? "selected" : ""}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={bulkSelected.has(report.id)}
                          onChange={(e) => {
                            const s = new Set(bulkSelected);
                            if (e.target.checked) s.add(report.id);
                            else s.delete(report.id);
                            setBulkSelected(s);
                          }}
                        />
                      </td>
                      <td>
                        <strong>{report.productName}</strong>
                        <small>
                          {report.brand} · {report.barcode || "No barcode"}
                        </small>
                      </td>
                      <td>{report.reason}</td>
                      <td>
                        <Badge value={report.status} />
                      </td>
                      <td className="nowrap">
                        <span className="age-tag">
                          {daysAgoText(report.submittedAt)}
                        </span>
                        {date(report.submittedAt)}
                      </td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => select(report.id)}
                        >
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.reports.length === 0 && (
              <p className="state-box">
                No reports match this view. Try another status or search.
              </p>
            )}
            {bulkSelected.size > 0 && (
              <div className="bulk-actions">
                <span>
                  <strong>{bulkSelected.size}</strong> selected
                </span>
                <select
                  value={bulkStatus ?? ""}
                  onChange={(e) => setBulkStatus(e.target.value as any)}
                >
                  <option value="">Change status…</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
                {(bulkStatus === "RESOLVED" || bulkStatus === "REJECTED") && (
                  <textarea
                    maxLength={2000}
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                    placeholder="Response message for users"
                    rows={2}
                  />
                )}
                {bulkStatus && (
                  <button
                    className="primary"
                    disabled={bulkBusy}
                    onClick={submitBulkUpdate}
                  >
                    {bulkBusy ? "Applying…" : "Apply to selected"}
                  </button>
                )}
                <button
                  onClick={() => {
                    setBulkSelected(new Set());
                    setBulkStatus("");
                    setBulkNote("");
                  }}
                  disabled={bulkBusy}
                >
                  Cancel
                </button>
              </div>
            )}
            <Pager info={data.pagination} setPage={setPage} />
          </>
        )}
      </section>
      {selected && (
        <ReportEditor
          key={selected}
          api={api}
          id={selected}
          close={() => select(undefined)}
          saved={() => refresh((v) => v + 1)}
          openProduct={openProduct}
        />
      )}
    </>
  );
}
export function Drawer({
  title,
  children,
  close,
  busy = false,
  dirty = false,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
  busy?: boolean;
  dirty?: boolean;
}) {
  // Keep unsaved edits if navigation is requested accidentally.
  const dismiss = () => {
    if (!busy && (!dirty || window.confirm("Discard unsaved changes?")))
      close();
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = document.querySelector<HTMLDialogElement>("dialog.editor");
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  return (
    <dialog
      className="editor"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <header className="editor-header">
        <div>
          <p className="eyebrow">CODIFY ADMIN</p>
          <h2>{title}</h2>
        </div>
        <button
          type="button"
          aria-label="Close editor"
          disabled={busy}
          onClick={dismiss}
        >
          ✕
        </button>
      </header>
      {children}
    </dialog>
  );
}
function ReportEditor({
  api,
  id,
  close,
  saved,
  openProduct,
}: {
  api: Api;
  id: string;
  close: () => void;
  saved: () => void;
  openProduct: (id: string) => void;
}) {
  const [reload, setReload] = useState(0);
  const { data, loading, error } = useResource<{
    report: Report;
    history: History[];
  }>(api, `/reports/${id}`, reload);
  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    if (data) {
      setStatus(data.report.status);
      setNote(data.report.resolutionNote);
    }
  }, [data]);
  const dirty =
    !!data &&
    (status !== data.report.status || note !== data.report.resolutionNote);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!data || busy) return;
    setBusy(true);
    setSaveError("");
    try {
      await api(`/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          resolutionNote: note,
          updatedAt: data.report.updatedAt,
        }),
      });
      saved();
      close();
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer title="Review report" {...{ close, busy, dirty }}>
      <div className="editor-body">
        <Notice {...{ loading, error }} retry={() => setReload((v) => v + 1)} />
        {data && (
          <>
            <h3>{data.report.productName}</h3>
            <p className="muted">
              {data.report.brand} · {data.report.category}
            </p>
            <dl className="details">
              <dt>Barcode</dt>
              <dd>{data.report.barcode || "Not supplied"}</dd>
              <dt>Submitted</dt>
              <dd>{date(data.report.submittedAt)}</dd>
              <dt>Concern</dt>
              <dd>{data.report.reason}</dd>
            </dl>
            <div className="quote">
              <span className="eyebrow">USER NOTES</span>
              <p>{data.report.notes || "No additional notes supplied."}</p>
            </div>
            {data.report.productId && (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (
                    !dirty ||
                    window.confirm(
                      "Discard this unsaved review and open the product?",
                    )
                  )
                    openProduct(data.report.productId!);
                }}
              >
                Open linked product →
              </button>
            )}
            <form onSubmit={submit}>
              <h3>Review decision</h3>
              <label>
                Status
                <select
                  value={status}
                  disabled={busy}
                  onChange={(event) =>
                    setStatus(event.target.value as ReportStatus)
                  }
                >
                  {statuses.map((item) => (
                    <option value={item} key={item}>
                      {label(item)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Response to the user
                <textarea
                  rows={5}
                  maxLength={2000}
                  value={note}
                  disabled={busy}
                  required={status === "RESOLVED" || status === "REJECTED"}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Explain what you checked and any action taken."
                />
              </label>
              <p className="muted">
                This response appears in the user's reported products.
              </p>
              {saveError && (
                <div className="error-box" role="alert">
                  {saveError}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Reload the latest review and discard your draft?",
                        )
                      ) {
                        setReload((v) => v + 1);
                        setSaveError("");
                      }
                    }}
                  >
                    Reload latest review
                  </button>
                </div>
              )}
              <button className="primary" disabled={busy || !dirty}>
                {busy ? "Saving…" : "Save review"}
              </button>
            </form>
            <h3>Review history</h3>
            {data.history.length === 0 ? (
              <p className="muted">No reviews yet.</p>
            ) : (
              data.history.map((entry) => (
                <div className="history-entry" key={entry.id}>
                  <Badge value={entry.after.status} />
                  <small>
                    {date(entry.createdAt)} · Admin {entry.actorId.slice(-8)}
                  </small>
                  <p>{entry.after.resolutionNote || "Status updated."}</p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </Drawer>
  );
}
function Catalog({ api, initialId }: { api: Api; initialId?: string }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [version, refresh] = useState(0);
  const [selected, select] = useState(initialId);
  const [scoreFilter, setScoreFilter] = useState<
    "all" | "high" | "mid" | "low"
  >("all");

  const { data, loading, error } = useResource<{
    products: Product[];
    pagination: PageInfo;
  }>(
    api,
    `/products?${new URLSearchParams({ q, page: String(page) })}`,
    version,
  );

  const filteredByScore =
    data?.products.filter((p) => {
      if (scoreFilter === "all") return true;
      if (scoreFilter === "high")
        return p.healthScore !== null && p.healthScore >= 70;
      if (scoreFilter === "mid")
        return (
          p.healthScore !== null && p.healthScore >= 40 && p.healthScore < 70
        );
      if (scoreFilter === "low")
        return p.healthScore === null || p.healthScore < 40;
      return true;
    }) ?? [];

  return (
    <>
      <PageHeader
        title="Product catalog"
        description="Maintain the details users see after scanning a product."
      >
        <button className="primary" onClick={() => select("new")}>
          + Add product
        </button>
      </PageHeader>
      <section className="panel">
        <Search
          placeholder="Search product, brand, or barcode"
          onSearch={(value) => {
            setQ(value);
            setPage(1);
          }}
        >
          <button type="button" onClick={() => refresh((v) => v + 1)}>
            ↻ Refresh
          </button>
        </Search>
        <div className="filter-bar">
          <select
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as any)}
          >
            <option value="all">All health scores</option>
            <option value="high">High (70+)</option>
            <option value="mid">Medium (40-69)</option>
            <option value="low">Low (&lt;40 or unscored)</option>
          </select>
          <button
            onClick={() =>
              exportToCSV("products.csv", filteredByScore, [
                { key: "name", label: "Product" },
                { key: "brand", label: "Brand" },
                { key: "barcode", label: "Barcode" },
                { key: "status", label: "Status" },
                { key: "healthScore", label: "Health Score" },
                { key: "isArchived", label: "Archived" },
              ])
            }
            title="Download current view as CSV"
          >
            ⬇ Export
          </button>
        </div>
        <Notice {...{ loading, error }} retry={() => refresh((v) => v + 1)} />
        {data && (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Barcode</th>
                    <th>Status</th>
                    <th>Health</th>
                    <th>Visibility</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredByScore.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <strong>{product.name}</strong>
                        <small>{product.category}</small>
                      </td>
                      <td>{product.barcode}</td>
                      <td>
                        <Badge value={product.status} />
                      </td>
                      <td>
                        <div className="health-score">
                          <div
                            className={`health-bar ${
                              product.healthScore === null
                                ? "unscored"
                                : product.healthScore >= 70
                                  ? "good"
                                  : product.healthScore >= 40
                                    ? "fair"
                                    : "poor"
                            }`}
                            style={{
                              width:
                                product.healthScore !== null
                                  ? `${product.healthScore}%`
                                  : "100%",
                            }}
                            title={
                              product.healthScore !== null
                                ? `Score: ${product.healthScore}`
                                : "Not scored"
                            }
                          />
                          <span className="score-label">
                            {product.healthScore !== null
                              ? product.healthScore
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td>{product.isArchived ? "Archived" : "Published"}</td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => select(product.id)}
                        >
                          Edit →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.products.length && (
              <p className="state-box">
                No products found. Change your search or add a product.
              </p>
            )}
            <Pager info={data.pagination} setPage={setPage} />
          </>
        )}
      </section>
      {selected && (
        <ProductEditor
          key={selected}
          api={api}
          id={selected}
          close={() => select(undefined)}
          saved={() => refresh((v) => v + 1)}
        />
      )}
    </>
  );
}
function Advisories({ api }: { api: Api }) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [version, refresh] = useState(0);
  const [selected, select] = useState<Advisory | "new">();
  const { data, loading, error } = useResource<{
    advisories: Advisory[];
    pagination: PageInfo;
  }>(
    api,
    `/advisories?${new URLSearchParams({ q, page: String(page) })}`,
    version,
  );
  return (
    <>
      <PageHeader
        title="FDA advisories"
        description="Maintain published notices and their official source links."
      >
        <button className="primary" onClick={() => select("new")}>
          + Add advisory
        </button>
      </PageHeader>
      <section className="panel">
        <Search
          placeholder="Search advisory number or title"
          onSearch={(value) => {
            setQ(value);
            setPage(1);
          }}
        >
          <button type="button" onClick={() => refresh((v) => v + 1)}>
            ↻ Refresh
          </button>
        </Search>
        <Notice {...{ loading, error }} retry={() => refresh((v) => v + 1)} />
        {data && (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Advisory</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Published</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.advisories.map((advisory) => (
                    <tr key={advisory.id}>
                      <td>
                        <strong>{advisory.advisoryNumber}</strong>
                        <small className="advisory-title">
                          {advisory.title}
                        </small>
                      </td>
                      <td>{label(advisory.category)}</td>
                      <td>
                        <Badge value={advisory.status} />
                      </td>
                      <td className="nowrap">
                        {advisory.publishedAt.slice(0, 10)}
                      </td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => select(advisory)}
                        >
                          Edit →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!data.advisories.length && (
              <p className="state-box">No advisories match this search.</p>
            )}
            <Pager info={data.pagination} setPage={setPage} />
          </>
        )}
      </section>
      {selected && (
        <AdvisoryEditor
          api={api}
          initial={selected}
          close={() => select(undefined)}
          saved={() => refresh((v) => v + 1)}
        />
      )}
    </>
  );
}
