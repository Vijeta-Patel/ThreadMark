"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pidFromQrText } from "@/lib/scan";

// Consumer panel: scan a garment's QR with the camera, upload a photo of it, or type the Product ID.
// No login. Whatever is found opens the public /verify/<pid> page.

const NOT_THREADMARK = "That QR code isn't a ThreadMark label. Try again or type the Product ID.";
const MAX_UPLOAD_SIDE = 1600;

export function QrScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [manualPid, setManualPid] = useState("");

  function stopCamera() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  useEffect(() => stopCamera, []);

  function openPid(pid: string) {
    stopCamera();
    router.push(`/verify/${encodeURIComponent(pid)}`);
  }

  async function startCamera() {
    setMessage(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("This browser can't open the camera. Upload a photo of the QR instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      streamRef.current = stream;
      setScanning(true);
    } catch {
      setMessage("Camera access was blocked. Allow it in your browser, or upload a photo of the QR instead.");
    }
  }

  // Once the <video> is on screen, attach the stream and read frames until a ThreadMark code shows up.
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!scanning || !video || !stream) return;

    video.srcObject = stream;
    void video.play();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let lastBad = "";

    const tick = () => {
      if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        if (code) {
          const pid = pidFromQrText(code.data);
          if (pid) return openPid(pid);
          if (code.data !== lastBad) {
            lastBad = code.data;
            setMessage(NOT_THREADMARK);
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_UPLOAD_SIDE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas");
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height, {
        inversionAttempts: "attemptBoth",
      });
      if (!code) {
        setMessage("No QR code found in that photo. Try a closer, sharper picture.");
        return;
      }
      const pid = pidFromQrText(code.data);
      if (pid) openPid(pid);
      else setMessage(NOT_THREADMARK);
    } catch {
      setMessage("Couldn't read that file. Use a JPG or PNG photo.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault();
    const pid = manualPid.trim();
    if (pid) openPid(pid);
  }

  return (
    <section aria-labelledby="consumer-heading" className="w-full max-w-md bg-brand p-6 text-paper md:p-8">
      <p className="tag mb-3">For shoppers · no login</p>
      <h2 id="consumer-heading" className="display text-4xl">
        Is it real?
        <br />
        <em>Scan the label.</em>
      </h2>
      <p className="mt-3 text-sm">
        Every ThreadMark garment carries a QR code. Scan it to see its passport and check it against the blockchain.
      </p>

      {scanning && (
        <div className="relative mt-5 overflow-hidden border border-paper">
          <video ref={videoRef} playsInline muted className="aspect-square w-full object-cover" />
          <div aria-hidden className="pointer-events-none absolute inset-[18%] border-2 border-dashed border-paper" />
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {scanning ? (
          <button type="button" onClick={stopCamera} className="pill pill-light">
            Stop camera
          </button>
        ) : (
          <button type="button" onClick={startCamera} className="pill pill-light-solid">
            Scan with camera
          </button>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="pill pill-light"
        >
          Upload QR photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {message && (
        <p role="alert" className="mt-4 text-sm">
          {message}
        </p>
      )}

      <form onSubmit={handleManual} className="mt-6 flex items-end gap-3 border-t border-paper/40 pt-4">
        <label className="flex-1">
          <span className="tag">Or type the Product ID</span>
          <input
            value={manualPid}
            onChange={(e) => setManualPid(e.target.value)}
            placeholder="TM-XXXXXXXXXX"
            className="field field-light"
          />
        </label>
        <button type="submit" className="tag underline underline-offset-4">
          Check →
        </button>
      </form>
    </section>
  );
}
