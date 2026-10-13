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
      <section className="flex flex-col gap-6" aria-live="polite">
        <h2 className="display text-4xl md:text-5xl">
          Garment <em>registered</em>
        </h2>
        <dl className="grid gap-4">
          <div className="border-t hairline pt-3">
            <dt className="tag">Product ID</dt>
            <dd className="mt-1 break-all font-mono text-lg">{done.pid}</dd>
          </div>
          <div className="border-t hairline pt-3">
            <dt className="tag">Hash</dt>
            <dd className="mt-1 break-all font-mono text-sm">{done.hash}</dd>
          </div>
          <div className="border-t hairline pt-3">
            <dt className="tag">Transaction</dt>
            <dd className="mt-1 break-all font-mono text-sm">
              {link ? (
                <a className="underline underline-offset-4" href={link} target="_blank" rel="noreferrer">
                  {done.txHash}
                </a>
              ) : (
                done.txHash
              )}
            </dd>
          </div>
        </dl>
        <div className="w-fit border hairline p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={done.qrDataUrl} alt={`QR code for ${done.pid}`} width={240} height={240} />
        </div>
        <p className="break-all text-sm">{done.verifyUrl}</p>
        <div className="flex flex-wrap gap-3">
          <a href={done.qrDataUrl} download={`ThreadMark-${done.pid}.png`} className="pill pill-solid">
            Download QR
          </a>
          <button type="button" onClick={reset} className="pill">
            Register another garment
          </button>
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-7">
      {formError && (
        <p role="alert" className="border border-brand bg-mist p-3">
          <span aria-hidden="true" className="tag mr-2">
            !
          </span>
          {formError}
        </p>
      )}
      {fieldErrors.body && (
        <p role="alert" className="font-serif text-lg italic">
          {fieldErrors.body}
        </p>
      )}
      {FIELDS.map(({ name, label, placeholder }) => (
        <div key={name} className="flex flex-col gap-1">
          <label htmlFor={name} className="tag">
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
            className="field"
          />
          {fieldErrors[name] && (
            <p id={`${name}-error`} className="font-serif text-lg italic">
              ↳ {fieldErrors[name]}
            </p>
          )}
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <label htmlFor="image" className="tag">
          Product image (optional)
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          aria-invalid={fieldErrors.image ? true : undefined}
          className="text-sm file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-brand file:bg-transparent file:px-4 file:py-1 file:font-serif file:italic file:text-brand"
        />
        {(fieldErrors.image || fieldErrors.imageRef) && (
          <p className="font-serif text-lg italic">↳ {fieldErrors.image ?? fieldErrors.imageRef}</p>
        )}
      </div>
      <div>
        <button type="submit" disabled={submitting} className="pill pill-solid">
          {submitting ? "Registering…" : "Register garment"}
        </button>
      </div>
    </form>
  );
}
