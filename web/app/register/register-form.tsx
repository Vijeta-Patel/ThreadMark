"use client";

import { useState, type FormEvent } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { validateGarmentInput } from "@/lib/validate";
import { IMAGE_BUCKET } from "@/lib/storage";
import {
  REGISTER_MESSAGES,
  describeRegisterFailure,
  imageExtension,
  txLink,
} from "@/lib/register-ui";
import type { RegisterSuccess } from "@/lib/types";

const FIELDS = [
  { name: "brand", label: "Brand", placeholder: "WeaveNest" },
  { name: "sku", label: "SKU", placeholder: "WN260101" },
  { name: "fabric", label: "Fabric", placeholder: "Cotton" },
  { name: "origin", label: "Origin", placeholder: "Karnataka, India" },
  { name: "manufacturingDate", label: "Manufacturing date (YYYY-MM-DD)", placeholder: "2026-01-10" },
] as const;

type Values = Record<(typeof FIELDS)[number]["name"], string>;
const EMPTY: Values = { brand: "", sku: "", fabric: "", origin: "", manufacturingDate: "" };

/** Upload the chosen image to Storage as <userId>/<uuid>.<ext>; returns the storage path. */
async function uploadImage(file: File, extension: string): Promise<string> {
  const supabase = getBrowserSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error(REGISTER_MESSAGES.unauthorized);
  const path = `${data.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw new Error(REGISTER_MESSAGES.uploadFailed);
  return path;
}

export function RegisterForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<RegisterSuccess | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const checked = validateGarmentInput(values);
    let errors: Record<string, string> = checked.ok ? {} : { ...checked.fields };
    let extension: string | null = null;
    if (file) {
      extension = imageExtension(file);
      if (!extension) errors = { ...errors, image: REGISTER_MESSAGES.imageType };
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !checked.ok) return;

    setSubmitting(true);
    try {
      let imageRef: string | undefined;
      if (file && extension) imageRef = await uploadImage(file, extension);

      const response = await fetch("/api/garments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...checked.value, ...(imageRef ? { imageRef } : {}) }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 201) {
        setDone(body as RegisterSuccess);
        return;
      }
      const failure = describeRegisterFailure(response.status, body);
      setFieldErrors(failure.fields);
      setFormError(failure.message);
    } catch (error) {
      setFormError(error instanceof Error && error.message ? error.message : REGISTER_MESSAGES.generic);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setValues(EMPTY);
    setFile(null);
    setFieldErrors({});
    setFormError("");
    setDone(null);
  }

  if (done) {
    const link = txLink(process.env.NEXT_PUBLIC_EXPLORER_TX_URL, done.txHash);
    return (
      <section className="flex flex-col gap-4" aria-live="polite">
        <h2 className="text-xl font-semibold text-green-700">Garment registered</h2>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="font-medium">Product ID</dt>
            <dd className="break-all font-mono">{done.pid}</dd>
          </div>
          <div>
            <dt className="font-medium">Hash</dt>
            <dd className="break-all font-mono">{done.hash}</dd>
          </div>
          <div>
            <dt className="font-medium">Transaction</dt>
            <dd className="break-all font-mono">
              {link ? (
                <a className="underline" href={link} target="_blank" rel="noreferrer">
                  {done.txHash}
                </a>
              ) : (
                done.txHash
              )}
            </dd>
          </div>
        </dl>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={done.qrDataUrl} alt={`QR code for ${done.pid}`} width={240} height={240} className="border p-2" />
        <p className="break-all text-xs text-gray-600">{done.verifyUrl}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={done.qrDataUrl}
            download={`ThreadMark-${done.pid}.png`}
            className="rounded border border-gray-500 bg-black px-4 py-2 text-white"
          >
            Download QR
          </a>
          <button type="button" onClick={reset} className="rounded border px-4 py-2">
            Register another garment
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="rounded border border-red-600 bg-red-50 p-3 text-red-800">
          {formError}
        </p>
      )}
      {fieldErrors.body && (
        <p role="alert" className="text-sm text-red-700">
          {fieldErrors.body}
        </p>
      )}
      {FIELDS.map(({ name, label, placeholder }) => (
        <div key={name} className="flex flex-col gap-1">
          <label htmlFor={name} className="font-medium">
            {label}
          </label>
          <input
            id={name}
            name={name}
            value={values[name]}
            placeholder={placeholder}
            onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
            aria-invalid={fieldErrors[name] ? true : undefined}
            aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
            className="rounded border border-gray-400 bg-transparent p-2"
          />
          {fieldErrors[name] && (
            <p id={`${name}-error`} className="text-sm text-red-700">
              {fieldErrors[name]}
            </p>
          )}
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <label htmlFor="image" className="font-medium">
          Product image (optional)
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-invalid={fieldErrors.image ? true : undefined}
        />
        {(fieldErrors.image || fieldErrors.imageRef) && (
          <p className="text-sm text-red-700">{fieldErrors.image ?? fieldErrors.imageRef}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded border border-gray-500 bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {submitting ? "Registering…" : "Register garment"}
      </button>
    </form>
  );
}
