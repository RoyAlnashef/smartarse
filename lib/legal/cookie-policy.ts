import { DPO_EMAIL, LEGAL_LAST_UPDATED, LEGAL_VERSION } from "@/lib/legal/constants"
import type { LegalDocument } from "@/lib/legal/types"

export const cookiePolicyDocument: LegalDocument = {
  title: "Full Cookie Policy",
  intro: [
    "This Cookie Policy explains how Disrupt Insight Ltd uses cookies and similar technologies in connection with the smartA.R.S.E. Platform.",
    "This Policy should be read alongside the Privacy Policy. In the event of any inconsistency, the Privacy Policy shall take precedence.",
  ],
  sections: [
    {
      title: "Cookies in Use",
      paragraphs: [
        "As at the effective date of this Policy, the Platform utilises strictly necessary cookies only.",
        "Strictly necessary cookies include authentication and session management cookies required to maintain secure user sessions and enable core functionality of the Platform.",
        "Functional preferences (such as user interface or display settings) may also be stored locally within the user's browser where required to support usability.",
        "The Platform does not currently deploy analytics cookies, marketing cookies, tracking pixels, device fingerprinting or third-party advertising identifiers, unless and until such technologies are explicitly introduced and disclosed in an updated version of this Policy.",
      ],
      subsections: [
        {
          title: "Future Use of Non-Essential Cookies",
          paragraphs: [
            "Where non-essential cookies or similar technologies (including analytics, performance or marketing tools) are introduced, Disrupt Insight Ltd shall ensure that:",
            "(a) an appropriate and compliant consent mechanism is implemented prior to deployment;",
            "(b) users are provided with clear and granular choices, including the ability to accept, reject or manage preferences;",
            "(c) no non-essential cookies are activated until valid user consent has been obtained;",
            "(d) user consent is recorded, auditable and version-controlled; and",
            "(e) users are able to withdraw or modify consent at any time.",
            "A cookie banner and, where required, a cookie preference management tool shall be implemented in accordance with applicable legislation, including the Privacy and Electronic Communications Regulations (PECR).",
          ],
        },
        {
          title: "Legal Basis and Consent",
          paragraphs: [
            "Strictly necessary cookies do not require user consent under applicable law, as they are essential to the operation of the Platform.",
            "Where non-essential cookies are used, such processing shall be based on the user's consent in accordance with applicable data protection laws.",
            "Consent shall be obtained through a clear affirmative action and shall meet the requirements of being freely given, specific, informed and unambiguous.",
          ],
        },
        {
          title: "Cookie Categories (Applicable Where Introduced)",
          paragraphs: [
            "Where cookies beyond those strictly necessary are deployed, they may include:",
            "(a) Performance / Analytics cookies: to understand how users interact with the Platform and improve functionality;",
            "(b) Functional cookies: to remember user preferences and settings;",
            "(c) Marketing cookies: to deliver relevant communications or measure effectiveness of campaigns.",
            "Full details of any such cookies, including purpose and retention period, shall be provided in an updated version of this Policy or via a cookie preference centre.",
          ],
        },
        {
          title: "Retention and Duration",
          paragraphs: [
            "Cookies may be either:",
            "(a) Session cookies, which expire when the browser session ends; or",
            "(b) Persistent cookies, which remain on the user's device for a defined period or until deleted.",
            "Where applicable, retention periods for cookies shall be limited to what is necessary for the relevant purpose and disclosed via the cookie preference mechanism.",
          ],
        },
      ],
    },
    {
      title: "Managing Cookies",
      paragraphs: [
        "Users may manage or restrict cookies through their browser settings or, where implemented, through the Platform's cookie preference management tool.",
        "Users should note that disabling strictly necessary cookies may prevent access to the Platform or impair its functionality.",
      ],
    },
    {
      title: "Third-Party Technologies",
      paragraphs: [
        "Where third-party providers are used (including hosting, analytics or AI-related services), cookies or similar technologies may be deployed by such providers to the extent necessary for the operation of the Platform.",
        "Disrupt Insight Ltd shall ensure that any such providers are subject to appropriate contractual and data protection obligations.",
      ],
    },
    {
      title: "Updates to this Policy",
      paragraphs: [
        "Disrupt Insight Ltd may update this Policy from time to time to reflect changes to the Platform, applicable law, or the use of cookies and similar technologies.",
        "Where material changes are made, users shall be notified and, where required, new consent shall be obtained prior to implementation.",
      ],
    },
    {
      title: "Contact",
      paragraphs: [
        `Any questions regarding the use of cookies or similar technologies should be directed to: ${DPO_EMAIL}`,
      ],
    },
  ],
  table: {
    title: "Cookie Details",
    columns: [
      { key: "name", header: "Cookie Name" },
      { key: "purpose", header: "Purpose" },
      { key: "type", header: "Type" },
      { key: "duration", header: "Duration" },
      { key: "provider", header: "Provider" },
    ],
    rows: [
      {
        name: "session_id (or equivalent)",
        purpose: "Maintains secure user session and authentication state",
        type: "Strictly necessary",
        duration: "Session (expires on browser close)",
        provider: "Disrupt Insight / platform infrastructure",
      },
      {
        name: "auth_token (or equivalent)",
        purpose: "Verifies authenticated user access and maintains login session security",
        type: "Strictly necessary",
        duration: "Session or short-lived (typically <24 hours)",
        provider: "Supabase / authentication provider",
      },
      {
        name: "csrf_token (if applicable)",
        purpose: "Protects against cross-site request forgery attacks",
        type: "Strictly necessary",
        duration: "Session",
        provider: "Platform application",
      },
      {
        name: "preferences (or equivalent local storage)",
        purpose: "Stores user interface preferences (e.g. theme, layout)",
        type: "Functional (strictly necessary where required)",
        duration: "Persistent (until deleted or overridden)",
        provider: "Platform application",
      },
      {
        name: "cookie_consent (future implementation)",
        purpose: "Stores user cookie consent preferences and version",
        type: "Strictly necessary (for compliance)",
        duration: "Up to 6 months",
        provider: "Disrupt Insight",
      },
      {
        name: "(future: analytics cookie – e.g. _ga)",
        purpose: "Measures usage and performance analytics",
        type: "Non-essential (requires consent)",
        duration: "Typically 13 months (subject to configuration)",
        provider: "Third-party analytics provider",
      },
      {
        name: "(future: marketing cookie)",
        purpose: "Supports marketing communications and campaign measurement",
        type: "Non-essential (requires consent)",
        duration: "Varies (typically 6–13 months)",
        provider: "Third-party marketing provider",
      },
    ],
    footnotes: [
      "The cookies listed above reflect the current operation of the Platform as at the effective date of this Policy.",
      "Where non-essential cookies are introduced, this table shall be updated to include the cookie name, purpose, duration and provider, and such cookies shall not be deployed unless and until valid user consent has been obtained in accordance with applicable law.",
      "Cookie durations may vary depending on configuration and provider capabilities and shall not exceed what is necessary for the relevant purpose.",
    ],
  },
}

export const cookiePolicyMeta = {
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
}
