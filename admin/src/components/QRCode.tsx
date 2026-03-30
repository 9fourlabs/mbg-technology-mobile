"use client";

interface QRCodeProps {
  url: string;
  size?: number;
}

export default function QRCode({ url, size = 150 }: QRCodeProps) {
  const encoded = encodeURIComponent(url);
  const src = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encoded}`;

  return (
    <img
      src={src}
      alt={url}
      width={size}
      height={size}
      className="rounded"
    />
  );
}
