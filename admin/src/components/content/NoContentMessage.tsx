"use client";

import Link from "next/link";

type Props = {
  templateType: string;
};

export default function NoContentMessage({ templateType }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md text-center">
        <div className="text-gray-500 mb-3">
          <svg
            className="w-10 h-10 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">
          No content to manage
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          The <span className="font-medium text-gray-300">{templateType}</span>{" "}
          template is configuration-driven and does not have backend data tables
          to manage. All customization is handled through the tenant
          configuration.
        </p>
        <Link
          href="/tenants"
          className="inline-block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
        >
          Back to Tenants
        </Link>
      </div>
    </div>
  );
}
