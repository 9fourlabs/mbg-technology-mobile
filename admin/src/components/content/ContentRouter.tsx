"use client";

import BookingManager from "@/components/content/BookingManager";
import CommerceManager from "@/components/content/CommerceManager";
import ContentPostsManager from "@/components/content/ContentPostsManager";
import DirectoryManager from "@/components/content/DirectoryManager";
import FormsManager from "@/components/content/FormsManager";
import LoyaltyManager from "@/components/content/LoyaltyManager";

function NoContentMessage({ templateType }: { templateType: string }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-12 text-center">
      <h2 className="text-lg font-semibold text-white mb-2">
        No content tables for{" "}
        <span className="capitalize">{templateType}</span> templates
      </h2>
      <p className="text-sm text-gray-400 max-w-md mx-auto">
        This template type does not have content that can be managed from the
        admin panel.
      </p>
    </div>
  );
}

export default function ContentRouter({
  tenantId,
  templateType,
}: {
  tenantId: string;
  templateType: string;
  businessName: string;
}) {
  switch (templateType) {
    case "booking":
      return <BookingManager tenantId={tenantId} />;
    case "commerce":
      return <CommerceManager tenantId={tenantId} />;
    case "content":
      return <ContentPostsManager tenantId={tenantId} />;
    case "directory":
      return <DirectoryManager tenantId={tenantId} />;
    case "forms":
      return <FormsManager tenantId={tenantId} />;
    case "loyalty":
      return <LoyaltyManager tenantId={tenantId} />;
    default:
      return <NoContentMessage templateType={templateType} />;
  }
}
