import React from "react";

export const SITE_URL = "https://www.nebulapdf.online";
export const SITE_NAME = "Nebula PDF";

type JsonLdData = Record<string, unknown> | Record<string, unknown>[];

/**
 * Renders a JSON-LD <script> tag for Schema.org structured data.
 * Safe to use inside Server Components (Next.js App Router).
 */
export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

type ToolStructuredDataProps = {
  /** Human-readable tool name, e.g. "Merge PDF" */
  name: string;
  /** Short description of what the tool does */
  description: string;
  /** Route path beginning with a slash, e.g. "/merge" */
  path: string;
};

/**
 * Emits SoftwareApplication + BreadcrumbList structured data for a tool page.
 * Centralizes SEO markup so individual tool pages stay declarative.
 */
export function ToolStructuredData({ name, description, path }: ToolStructuredDataProps) {
  const url = `${SITE_URL}${path}`;

  const softwareApplication = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    browserRequirements: "Requires a modern web browser with JavaScript enabled.",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: url },
    ],
  };

  return <JsonLd data={[softwareApplication, breadcrumb]} />;
}
