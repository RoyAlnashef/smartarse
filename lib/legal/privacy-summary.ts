import { DPO_EMAIL, ICO_URL, LEGAL_LAST_UPDATED, LEGAL_VERSION } from "@/lib/legal/constants"
import type { LegalDocument } from "@/lib/legal/types"

export const privacySummaryDocument: LegalDocument = {
  title: "Privacy Summary",
  subtitle: "Disrupt Insight Ltd",
  intro: [
    "This is a summary of how Disrupt Insight Ltd handles personal data. It should be read alongside the full Privacy Policy, available on request, which takes precedence.",
  ],
  sections: [
    {
      title: "Who we are",
      paragraphs: [
        "Disrupt Insight Ltd provides the smartA.R.S.E Platform and is responsible for how your personal data is handled when you use our services.",
      ],
    },
    {
      title: "Our role",
      listItems: [
        "For data you upload for projects, we usually act as a data processor on behalf of your organisation",
        "For your account and platform usage, we act as a data controller",
      ],
    },
    {
      title: "What data we collect",
      paragraphs: ["We collect and use the following types of data:"],
      listItems: [
        "Account information (e.g. name, email, organisation)",
        "Access and login data (to manage and secure accounts)",
        "Platform usage data (e.g. queries, interactions, usage levels)",
        "Project data (data you upload, such as research datasets, transcripts and reports)",
        "Technical data (e.g. IP address and system identifiers for security and logging)",
      ],
    },
    {
      title: "How we use your data",
      paragraphs: ["We use your data to:"],
      listItems: [
        "Provide access to and operate the Platform",
        "Analyse and generate insights from uploaded data",
        "Maintain security and detect misuse or incidents",
        "Manage project usage, including tokens and billing controls",
        "Improve and develop the Platform",
        "Send marketing communications where permitted",
      ],
    },
    {
      title: "Legal basis for processing",
      paragraphs: ["Where we act as controller, we rely on:"],
      listItems: [
        "Contract – to deliver services",
        "Legitimate interests – to operate, secure and improve the Platform",
        "Consent – where required (e.g. demo access, marketing)",
        "Legal obligations where applicable",
      ],
      subsections: [
        {
          title: "",
          paragraphs: [
            "When acting as processor, we process data only on the Client's instructions.",
          ],
        },
      ],
    },
    {
      title: "Who we share data with",
      paragraphs: [
        "We share data only where necessary with trusted service providers (such as hosting, workflow and AI providers). Some providers may operate outside the UK or EEA. Where this occurs, appropriate safeguards are in place.",
      ],
    },
    {
      title: "How we keep your data secure",
      paragraphs: ["We implement security measures including:"],
      listItems: [
        "Controlled access to data",
        "Encryption where supported",
        "Monitoring and security logging",
        "Backup and recovery processes",
      ],
    },
    {
      title: "How long we keep your data",
      listItems: [
        "Demo accounts: up to 6 months from setup",
        "Client accounts: up to 6 months after project completion",
        "Backups and logs: up to 6 months after expiry, subject to legal requirements",
      ],
    },
    {
      title: "Your rights",
      paragraphs: ["You may have the right to:"],
      listItems: [
        "Access, correct or delete your data",
        "Restrict or object to processing",
        "Withdraw consent at any time",
      ],
      subsections: [
        {
          title: "",
          paragraphs: [
            `Contact: ${DPO_EMAIL}. You can also lodge a complaint with the UK ICO at ${ICO_URL}.`,
          ],
        },
      ],
    },
    {
      title: "Demo access and consent",
      listItems: [
        "We obtain consent through a clear user action",
        "We record consent for audit purposes",
        "Marketing consent (if requested) is optional",
        "You can withdraw consent at any time",
      ],
    },
    {
      title: "Contact us",
      paragraphs: [`For privacy queries: ${DPO_EMAIL}`],
    },
  ],
}

export const privacySummaryMeta = {
  lastUpdated: LEGAL_LAST_UPDATED,
  version: LEGAL_VERSION,
}
