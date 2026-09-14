import { useEffect, useState, type FormEvent } from "react";
import { Drawer, label, Notice, useResource } from "./App";
import { nutritionKeys, type Advisory, type Api, type Product } from "./types";

const emptyProduct: Product = {
  slug: "",
  barcode: "",
  name: "",
  brand: "",
  category: "",
  status: "UNVERIFIED",
  fdaStatusLabel: "FDA Verification Pending",
  registrationNumber: "Not verified",
  healthScore: null,
  servingSize: "",
  warningMessage: "",
  imageUrl: null,
  verificationUrl: "https://verification.fda.gov.ph/",
  isArchived: false,
  nutrition: Object.fromEntries(
    nutritionKeys.map((key) => [key, "N/A"]),
  ) as NonNullable<Product["nutrition"]>,
  ingredients: [],
  allergens: [],
  alternatives: [],
};
const names = (values: (string | { name: string })[]) =>
  values
    .map((item) => (typeof item === "string" ? item : item.name))
    .join("\n");
const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
function normalizeProduct(product: Product): Product {
  const fields = Object.fromEntries(
    Object.keys(emptyProduct).map((key) => [
      key,
      product[key as keyof Product],
    ]),
  ) as Product;
  return {
    ...fields,
    nutrition: Object.fromEntries(
      nutritionKeys.map((key) => [key, product.nutrition?.[key] ?? "N/A"]),
    ) as NonNullable<Product["nutrition"]>,
  };
}
type EditorProps = { api: Api; close: () => void; saved: () => void };
export function ProductEditor({
  api,
  id,
  close,
  saved,
}: EditorProps & { id: string }) {
  const [reload, setReload] = useState(0);
  const { data, loading, error } = useResource<{ product?: Product }>(
    api,
    id === "new" ? "/session" : `/products/${id}`,
    reload,
  );
  const [draft, setDraft] = useState<Product>(emptyProduct);
  const [lists, setLists] = useState({
    ingredients: "",
    allergens: "",
    alternatives: "",
  });
  const [baseline, setBaseline] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  useEffect(() => {
    if (!data) return;
    const product = data.product
      ? normalizeProduct(data.product)
      : emptyProduct;
    const initialLists = {
      ingredients: product.ingredients
        .map((item) => `${item.isAllergen ? "* " : ""}${item.name}`)
        .join("\n"),
      allergens: names(product.allergens),
      alternatives: names(product.alternatives),
    };
    setDraft(product);
    setLists(initialLists);
    setBaseline(JSON.stringify([product, initialLists]));
  }, [data]);
  const dirty = !!baseline && baseline !== JSON.stringify([draft, lists]);
  const field = (
    key: keyof Product,
    title: string,
    required = true,
    type = "text",
  ) => (
    <label key={key}>
      {title}
      <input
        type={type}
        required={required}
        value={String(draft[key] ?? "")}
        disabled={busy || (key === "slug" && id !== "new")}
        onChange={(event) =>
          setDraft((value) => ({
            ...value,
            [key]: event.target.value || (type === "url" ? null : ""),
          }))
        }
      />
    </label>
  );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !data) return;
    setBusy(true);
    setSaveError("");
    const product = {
      ...draft,
      ingredients: lines(lists.ingredients).map((line) => ({
        name: line.replace(/^\*\s*/, ""),
        isAllergen: line.startsWith("*"),
      })),
      allergens: lines(lists.allergens),
      alternatives: lines(lists.alternatives),
    };
    try {
      await api(id === "new" ? "/products" : `/products/${id}`, {
        method: id === "new" ? "POST" : "PUT",
        body: JSON.stringify(
          id === "new"
            ? product
            : { product, updatedAt: data.product?.updatedAt },
        ),
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
    <Drawer
      title={id === "new" ? "Add product" : "Edit product"}
      {...{ close, busy, dirty }}
    >
      <div className="editor-body">
        <Notice {...{ loading, error }} retry={() => setReload((v) => v + 1)} />
        {data && (
          <form onSubmit={submit}>
            <p className="muted">
              Use the package label for size and nutrition. Keep unavailable
              values as N/A.
            </p>
            <h3>Product identity</h3>
            <div className="form-grid">
              {field("name", "Product name, including size")}
              {field("brand", "Brand")}
              {field("barcode", "Barcode or QR value")}
              {field("slug", "Catalog ID (lowercase-with-hyphens)")}
              {field("category", "Category")}
              {field("servingSize", "Serving size")}
            </div>
            <h3>Registration and guidance</h3>
            <div className="form-grid">
              <label>
                Product status
                <select
                  value={draft.status}
                  disabled={busy}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      status: event.target.value,
                    }))
                  }
                >
                  {["APPROVED", "CAUTION", "FDA_ADVISORY", "UNVERIFIED"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {label(value)}
                      </option>
                    ),
                  )}
                </select>
              </label>
              {field("fdaStatusLabel", "FDA status label")}
              {field(
                "registrationNumber",
                "Registration or notification number",
              )}
              {field("verificationUrl", "Verification source", false, "url")}
            </div>
            <label>
              Product guidance
              <textarea
                rows={5}
                required
                maxLength={8000}
                disabled={busy}
                value={draft.warningMessage}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    warningMessage: event.target.value,
                  }))
                }
              />
            </label>
            <h3>Nutrition per serving</h3>
            <div className="form-grid">
              {nutritionKeys.map((key) => (
                <label key={key}>
                  {label(key.replace(/([A-Z])/g, " $1"))}
                  <input
                    required
                    disabled={busy}
                    value={draft.nutrition?.[key] ?? "N/A"}
                    onChange={(event) =>
                      setDraft((value) => ({
                        ...value,
                        nutrition: {
                          ...value.nutrition!,
                          [key]: event.target.value,
                        },
                      }))
                    }
                  />
                </label>
              ))}
              <label>
                Reviewed health score (0–100, optional)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={busy}
                  value={draft.healthScore ?? ""}
                  onChange={(event) =>
                    setDraft((value) => ({
                      ...value,
                      healthScore:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>
            <h3>Ingredients and allergens</h3>
            <label>
              Ingredients — one per line; prefix an allergenic ingredient with *
              <textarea
                rows={7}
                disabled={busy}
                value={lists.ingredients}
                onChange={(event) =>
                  setLists((value) => ({
                    ...value,
                    ingredients: event.target.value,
                  }))
                }
              />
            </label>
            <div className="form-grid">
              <label>
                Declared allergens — visual manager
                <div className="allergen-manager">
                  <div className="allergen-pills">
                    {lines(lists.allergens).map((allergen, idx) => (
                      <span key={idx} className="allergen-pill">
                        {allergen}
                        <button
                          type="button"
                          disabled={busy}
                          tabIndex={-1}
                          onClick={() =>
                            setLists((v) => ({
                              ...v,
                              allergens: lines(v.allergens)
                                .filter((_, i) => i !== idx)
                                .join("\n"),
                            }))
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add allergen (e.g., peanuts, milk, soy)"
                    disabled={busy}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (val && !lines(lists.allergens).includes(val)) {
                          setLists((v) => ({
                            ...v,
                            allergens:
                              (v.allergens ? v.allergens + "\n" : "") + val,
                          }));
                          input.value = "";
                        }
                      }
                    }}
                  />
                </div>
                <p className="muted">Press Enter to add allergens.</p>
              </label>
              <label>
                Alternatives — one per line
                <textarea
                  rows={4}
                  disabled={busy}
                  value={lists.alternatives}
                  onChange={(event) =>
                    setLists((value) => ({
                      ...value,
                      alternatives: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            {field("imageUrl", "Product image URL (optional)", false, "url")}
            <label className="check">
              <input
                type="checkbox"
                checked={draft.isArchived}
                disabled={busy}
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    isArchived: event.target.checked,
                  }))
                }
              />
              Archive product from public search and barcode results
            </label>
            <p className="muted">
              Archiving retains the record, reports, and scan history.
            </p>
            {saveError && (
              <div className="error-box" role="alert">
                {saveError}
                {id !== "new" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Reload the latest product and discard your draft?",
                        )
                      ) {
                        setReload((v) => v + 1);
                        setSaveError("");
                      }
                    }}
                  >
                    Reload latest product
                  </button>
                )}
              </div>
            )}
            <footer className="form-actions">
              <button
                className="primary"
                disabled={busy || (!dirty && id !== "new")}
              >
                {busy
                  ? "Saving…"
                  : id === "new"
                    ? "Create product"
                    : "Save product"}
              </button>
            </footer>
          </form>
        )}
      </div>
    </Drawer>
  );
}

const blankAdvisory: Advisory = {
  advisoryNumber: "",
  title: "",
  category: "FOOD",
  type: "PUBLIC_HEALTH_WARNING",
  status: "NOT_APPROVED",
  publishedAt: new Date().toISOString().slice(0, 10),
  sourceUrl: "",
  filipinoSourceUrl: null,
  isActive: true,
};
export function AdvisoryEditor({
  api,
  initial,
  close,
  saved,
}: EditorProps & { initial: Advisory | "new" }) {
  const original =
    initial === "new"
      ? blankAdvisory
      : { ...initial, publishedAt: initial.publishedAt.slice(0, 10) };
  const [draft, setDraft] = useState(original);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(original);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const advisory = Object.fromEntries(
      Object.keys(blankAdvisory).map((key) => [
        key,
        draft[key as keyof Advisory],
      ]),
    );
    try {
      await api(
        initial === "new" ? "/advisories" : `/advisories/${initial.id}`,
        {
          method: initial === "new" ? "POST" : "PUT",
          body: JSON.stringify(
            initial === "new"
              ? advisory
              : { advisory, updatedAt: initial.updatedAt },
          ),
        },
      );
      saved();
      close();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer
      title={initial === "new" ? "Add advisory" : "Edit advisory"}
      {...{ close, busy, dirty }}
    >
      <form className="editor-body" onSubmit={submit}>
        <p className="muted">
          Transcribe the official FDA notice and include its source link.
        </p>
        <div className="form-grid">
          {(
            [
              ["advisoryNumber", "Advisory number", "text"],
              ["publishedAt", "Publication date", "date"],
            ] as const
          ).map(([key, title, type]) => (
            <label key={key}>
              {title}
              <input
                required
                type={type}
                value={draft[key]}
                disabled={busy}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, [key]: event.target.value }))
                }
              />
            </label>
          ))}
        </div>
        <label>
          Official title
          <textarea
            required
            rows={4}
            value={draft.title}
            disabled={busy}
            onChange={(event) =>
              setDraft((value) => ({ ...value, title: event.target.value }))
            }
          />
        </label>
        <div className="form-grid">
          {(
            [
              ["category", ["FOOD", "DRUG", "COSMETIC"]],
              [
                "type",
                [
                  "PUBLIC_HEALTH_WARNING",
                  "RECALL",
                  "QUALITY_HOLD",
                  "SAFETY_ALERT",
                  "LIFTING",
                ],
              ],
              ["status", ["NOT_APPROVED", "CAUTION", "LIFTED"]],
            ] as const
          ).map(([key, values]) => (
            <label key={key}>
              {label(key)}
              <select
                value={draft[key]}
                disabled={busy}
                onChange={(event) =>
                  setDraft((value) => ({ ...value, [key]: event.target.value }))
                }
              >
                {values.map((value) => (
                  <option value={value} key={value}>
                    {label(value)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <label>
          Official source URL
          <input
            type="url"
            required
            value={draft.sourceUrl}
            disabled={busy}
            onChange={(event) =>
              setDraft((value) => ({ ...value, sourceUrl: event.target.value }))
            }
          />
        </label>
        <label>
          Filipino source URL (optional)
          <input
            type="url"
            value={draft.filipinoSourceUrl ?? ""}
            disabled={busy}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                filipinoSourceUrl: event.target.value || null,
              }))
            }
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={draft.isActive}
            disabled={busy}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                isActive: event.target.checked,
              }))
            }
          />
          Active advisory
        </label>
        <p className="muted">
          Inactive notices remain available as historical records.
        </p>
        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
        <footer className="form-actions">
          <button
            className="primary"
            disabled={busy || (!dirty && initial !== "new")}
          >
            {busy ? "Saving…" : "Save advisory"}
          </button>
        </footer>
      </form>
    </Drawer>
  );
}
