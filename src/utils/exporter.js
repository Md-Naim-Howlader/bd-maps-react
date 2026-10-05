import { PW, PH, drawBangladeshMap } from './canvasRenderer';

function dataUrlToBytes(u) {
  const bin = atob(u.slice(u.indexOf(",") + 1));
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}

function dataUrlToBlob(u) {
  return new Blob([dataUrlToBytes(u)], { type: u.slice(5, u.indexOf(";")) });
}

function jpegToPdf(img, iw, ih, pw, ph) {
  const W = pw * 0.75, H = ph * 0.75;
  const enc = new TextEncoder();
  const parts = [], offs = [];
  let len = 0;

  const put = (x) => {
    const b = typeof x === "string" ? enc.encode(x) : x;
    parts.push(b);
    len += b.length;
  };
  const obj = (n, body) => {
    offs[n] = len;
    put(`${n} 0 obj\n${body}\nendobj\n`);
  };

  const draw = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
  put("%PDF-1.4\n");
  obj(1, "<</Type/Catalog/Pages 2 0 R>>");
  obj(2, "<</Type/Pages/Kids[3 0 R]/Count 1>>");
  obj(3, `<</Type/Page/Parent 2 0 R/MediaBox[0 0 ${W} ${H}]/Resources<</XObject<</Im0 4 0 R>>>>/Contents 5 0 R>>`);
  offs[4] = len;
  put(`4 0 obj\n<</Type/XObject/Subtype/Image/Width ${iw}/Height ${ih}/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length ${img.length}>>\nstream\n`);
  put(img);
  put("\nendstream\nendobj\n");
  obj(5, `<</Length ${draw.length}>>\nstream\n${draw}\nendstream`);

  const x = len;
  put("xref\n0 6\n0000000000 65535 f \n" + offs.slice(1).map(o => String(o).padStart(10, "0") + " 00000 n \n").join(""));
  put(`trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${x}\n%%EOF\n`);

  return new Blob(parts, { type: "application/pdf" });
}

export function saveBlob(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file] }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function exportBangladeshMap({ kind, selected, theme, userName, showLabels, photoImg }) {
  const c = document.createElement("canvas");
  c.width = PW * 2;
  c.height = PH * 2;
  const ctx = c.getContext("2d");
  drawBangladeshMap(ctx, 2, { selected, theme, userName, showLabels, photoImg });

  const safeName = (userName.trim() ? userName.trim().toLowerCase().replace(/\s+/g, "-") : "amar-desh") + "-map";

  if (kind === "png") {
    const blob = dataUrlToBlob(c.toDataURL("image/png"));
    saveBlob(blob, `${safeName}.png`);
  } else if (kind === "jpg") {
    const blob = dataUrlToBlob(c.toDataURL("image/jpeg", 0.95));
    saveBlob(blob, `${safeName}.jpg`);
  } else if (kind === "pdf") {
    const jpegData = dataUrlToBytes(c.toDataURL("image/jpeg", 0.95));
    const blob = jpegToPdf(jpegData, c.width, c.height, PW, PH);
    saveBlob(blob, `${safeName}.pdf`);
  }
}
