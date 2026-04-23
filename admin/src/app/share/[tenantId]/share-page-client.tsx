"use client";

import { useState } from "react";
import QRCode from "@/components/QRCode";

interface Build {
  id: string;
  downloadUrl: string;
  downloadUrlIos?: string | null;
  platform: string;
  createdAt: string;
}

interface SharePageClientProps {
  appName: string;
  primaryColor: string;
  logoUrl?: string;
  appetizeKey?: string | null;
  builds: Build[];
}

export default function SharePageClient({
  appName,
  primaryColor,
  logoUrl,
  appetizeKey,
  builds,
}: SharePageClientProps) {
  const [showInstall, setShowInstall] = useState(false);
  const [expandedSection, setExpandedSection] = useState<
    "android" | "ios" | null
  >(null);

  const androidBuild = builds.find(
    (b) => b.platform === "android" || b.platform === "all",
  );
  const iosBuild = builds.find(
    (b) => b.platform === "ios" || b.platform === "all",
  );

  const hasBuild = androidBuild || iosBuild;

  return (
    <div className="min-h-screen bg-gray-950 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* App header */}
        <div className="text-center mb-8">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={appName}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 border border-gray-800"
            />
          )}
          <h1 className="text-2xl font-bold text-white mb-1">{appName}</h1>
          <p className="text-sm text-gray-400">Preview Build</p>
        </div>

        {!hasBuild ? (
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-8 text-center">
            <p className="text-gray-400 text-sm">
              No preview build is available yet. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Primary: Browser-based simulator ──
             * NOTE: Appetize's iframe embed is a paid feature (Starter tier
             * and up). On the free tier the iframe renders the "Embeds are
             * not enabled for this app" message. Until we upgrade, we link
             * out to Appetize directly — the embedded-in-portal experience
             * is tracked in ROADMAP.md as a planned enhancement.
             */}
            {appetizeKey ? (
              <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
                <div className="px-5 pt-5 pb-3">
                  <h2 className="text-white font-semibold text-sm mb-1">
                    Try it now
                  </h2>
                  <p className="text-xs text-gray-400">
                    Launch an interactive browser preview — no install needed.
                  </p>
                </div>
                <div className="px-5 pb-5">
                  <a
                    href={`https://appetize.io/app/${appetizeKey}?device=pixel7&autoplay=false`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-lg text-white text-sm font-semibold transition-colors"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                      aria-hidden="true"
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Launch browser preview
                  </a>
                  <p className="text-[11px] text-gray-500 text-center mt-2">
                    Opens in a new tab. Tap around — your session lasts 5
                    minutes.
                  </p>
                </div>
              </div>
            ) : null}

            {/* ── Secondary: Install on device ── */}
            <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
              <button
                onClick={() => setShowInstall(!showInstall)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="text-white font-semibold text-sm">
                    {appetizeKey
                      ? "Install on your device"
                      : "Download & Install"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {appetizeKey
                      ? "For hands-on testing with push notifications, camera, etc."
                      : "Install directly on your Android or iOS device"}
                  </p>
                </div>
                <span className="text-gray-500 text-sm flex-shrink-0 ml-3">
                  {showInstall ? "−" : "+"}
                </span>
              </button>

              {showInstall && (
                <div className="border-t border-gray-800">
                  {/* Android */}
                  {androidBuild && (
                    <div className="border-b border-gray-800 last:border-b-0">
                      <button
                        onClick={() =>
                          setExpandedSection(
                            expandedSection === "android" ? null : "android",
                          )
                        }
                        className="w-full flex items-center justify-between px-5 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">&#x1F4F1;</span>
                          <div>
                            <p className="text-white font-medium text-sm">
                              Android
                            </p>
                            <p className="text-xs text-gray-500">
                              Install directly — no app store needed
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {expandedSection === "android" ? "−" : "+"}
                        </span>
                      </button>

                      {expandedSection === "android" && (
                        <div className="px-5 pb-5 pt-2">
                          <div className="flex justify-center mb-4 bg-white rounded-lg p-3">
                            <QRCode
                              url={androidBuild.downloadUrl}
                              size={180}
                            />
                          </div>
                          <p className="text-xs text-gray-400 text-center mb-4">
                            Scan with your phone camera
                          </p>

                          <div className="space-y-3 mb-4">
                            <Step n={1}>
                              Scan the QR code or tap the button below
                            </Step>
                            <Step n={2}>
                              When prompted, tap{" "}
                              <strong className="text-white">
                                &quot;Download anyway&quot;
                              </strong>{" "}
                              (Android may show a safety warning — this is
                              normal for apps outside the Play Store)
                            </Step>
                            <Step n={3}>
                              Open the downloaded file and tap{" "}
                              <strong className="text-white">Install</strong>
                            </Step>
                            <Step n={4}>
                              If asked, enable{" "}
                              <strong className="text-white">
                                &quot;Install from unknown sources&quot;
                              </strong>{" "}
                              in your settings
                            </Step>
                          </div>

                          <a
                            href={androidBuild.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-white text-sm font-semibold transition-colors"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Download for Android
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* iOS */}
                  {iosBuild ? (
                    <div>
                      <button
                        onClick={() =>
                          setExpandedSection(
                            expandedSection === "ios" ? null : "ios",
                          )
                        }
                        className="w-full flex items-center justify-between px-5 py-3 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">&#x1F34F;</span>
                          <div>
                            <p className="text-white font-medium text-sm">
                              iPhone / iPad
                            </p>
                            <p className="text-xs text-gray-500">
                              Requires device registration
                            </p>
                          </div>
                        </div>
                        <span className="text-gray-500 text-xs">
                          {expandedSection === "ios" ? "−" : "+"}
                        </span>
                      </button>

                      {expandedSection === "ios" && (
                        <div className="px-5 pb-5 pt-2">
                          {iosBuild.downloadUrlIos && (
                            <>
                              <div className="flex justify-center mb-4 bg-white rounded-lg p-3">
                                <QRCode
                                  url={iosBuild.downloadUrlIos}
                                  size={180}
                                />
                              </div>
                              <p className="text-xs text-gray-400 text-center mb-4">
                                Scan with your phone camera
                              </p>
                            </>
                          )}

                          <div className="space-y-3 mb-4">
                            <Step n={1}>
                              Scan the QR code or tap the button below
                            </Step>
                            <Step n={2}>
                              If your device is{" "}
                              <strong className="text-white">
                                not registered
                              </strong>
                              , you&apos;ll be asked to install a configuration
                              profile — follow the prompts to register your
                              device
                            </Step>
                            <Step n={3}>
                              After registering, let the person who shared this
                              link know — they need to{" "}
                              <strong className="text-white">rebuild</strong>{" "}
                              the app to include your device
                            </Step>
                            <Step n={4}>
                              Once the new build is ready, come back to this
                              page and tap Install
                            </Step>
                          </div>

                          <div className="rounded-lg bg-yellow-900/20 border border-yellow-800/50 p-3 mb-4">
                            <p className="text-xs text-yellow-400 leading-relaxed">
                              <strong>First time?</strong> iOS requires each
                              device to be registered before it can install
                              preview builds. This only needs to happen once —
                              after that, all future builds will work
                              automatically.
                            </p>
                          </div>

                          <a
                            href={
                              iosBuild.downloadUrlIos ?? iosBuild.downloadUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-white text-sm font-semibold transition-colors"
                            style={{ backgroundColor: primaryColor }}
                          >
                            Install for iOS
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-5 py-3">
                      <span className="text-xl">&#x1F34F;</span>
                      <div>
                        <p className="text-white font-medium text-sm">
                          iPhone / iPad
                        </p>
                        <p className="text-xs text-gray-500">
                          iOS build not available yet
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-600 mt-8">
          Powered by MBG Technology
        </p>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 text-xs text-gray-400 flex items-center justify-center font-medium">
        {n}
      </span>
      <p className="text-sm text-gray-300 leading-relaxed">{children}</p>
    </div>
  );
}
