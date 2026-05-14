/**
 * Survey question code → human-readable label mappings.
 * Source: survey_schemas.question_map (Supabase)
 *
 * Used by the Persona Brief generator and the PersonaPanel UI.
 */

/* ── Q2: Sustainability Associations (multi-code, 0/1) ────────────── */
export const Q2_ASSOCIATIONS: Record<string, string> = {
  Q2r1: "Environmental protection",
  Q2r2: "Economic development",
  Q2r3: "Social equality",
  Q2r4: "Resource conservation",
  Q2r5: "Future wellbeing",
  Q2r6: "Technology innovation",
  Q2r7: "Other",
};

/* ── Q5: Understanding Areas (grid, 1-5 scale per row) ────────────── */
export const Q5_AREAS: Record<string, string> = {
  Q5r1: "Climate change",
  Q5r2: "Production of products and packaging (incl plastics)",
  Q5r3: "The food chain",
  Q5r4: "Greenhouse gas emissions / pollution",
  Q5r5: "Waste management (re-use and recycling)",
  Q5r6: "Water conservation",
  Q5r7: "Protecting nature and biodiversity",
  Q5r8: "Social inequality",
};

/* ── Q9: Actions Taken (multi-code, 0/1) ──────────────────────────── */
export const Q9_ACTIONS: Record<string, string> = {
  Q9r1: "Recycling",
  Q9r2: "Re-use/re-purpose products",
  Q9r3: "Reduce energy at home",
  Q9r4: "Electric cars/public transport",
  Q9r5: "Reducing water usage",
  Q9r6: "Buy sustainable/ethical products",
  Q9r7: "Look up company policies/supply chains",
  Q9r8: "Look up environmental impact",
  Q9r9: "Research sustainable living",
  Q9r10: "Reduce/remove meat consumption",
  Q9r99: "None of these",
};

/* ── Q11: Barriers (multi-code, 0/1) ──────────────────────────────── */
export const Q11_BARRIERS: Record<string, string> = {
  Q11r1: "No one else takes it seriously",
  Q11r2: "No help from authorities",
  Q11r3: "Costs too much to change",
  Q11r4: "Other pressing issues",
  Q11r5: "Not convinced of need to change",
  Q11r6: "Unsure of right choices",
  Q11r7: "Things are fine as they are",
  Q11r8: "Don't trust sustainability advocates",
  Q11r9: "Don't see impact",
  Q11r10: "Too much change too soon",
  Q11r11: "Too hard to make changes",
  Q11r12: "Cultural/religious norms",
  Q11r13: "Other",
  Q11r14: "Don't know",
};

/* ── Q12: Motivators / Drivers (multi-code, 0/1) ─────────────────── */
export const Q12_MOTIVATORS: Record<string, string> = {
  Q12r1: "Concern about planet destruction",
  Q12r2: "Fairer equitable society",
  Q12r3: "Do my bit to help",
  Q12r4: "Help future generations",
  Q12r5: "Be a responsible citizen",
  Q12r6: "Feel guilty doing nothing",
  Q12r7: "Lead by example/influence others",
  Q12r8: "Inspired by friends/family",
  Q12r9: "Inspired by different generations",
  Q12r10: "Other",
  Q12r11: "Don't know/nothing",
};

/* ── Q16: Information Sources (multi-code, 0/1) ───────────────────── */
export const Q16_INFO_SOURCES: Record<string, string> = {
  Q16r1: "In the news",
  Q16r2: "Social media",
  Q16r3: "Articles / forums online",
  Q16r4: "In documentary TV programmes",
  Q16r5: "Through films / movies touching on the topic",
  Q16r6: "Government communications",
  Q16r7: "School or higher education",
  Q16r8: "Environmental organisations or charities",
  Q16r9: "Scientific publications",
  Q16r10: "Through discussions with friends and family",
  Q16r11: "Other",
};

/* ── Q19: Adoption Influences (multi-code, 0/1) ──────────────────── */
export const Q19_INFLUENCES: Record<string, string> = {
  Q19r1: "Financial incentives",
  Q19r2: "More convenient options",
  Q19r3: "Better information",
  Q19r4: "Stronger regulations",
  Q19r5: "Social pressure",
  Q19r6: "More transparent reporting on the impact of products and supply chains",
  Q19r7: "Educational programs",
  Q19r8: "Community initiatives",
  Q19r9: "Other",
  Q19r10: "None of the above",
};

/* ── Q6: Important Sustainability Issues (multi-code, 0/1) ────────── */
export const Q6_ISSUES: Record<string, string> = {
  Q6r1: "Air Pollution",
  Q6r2: "Climate Change",
  Q6r3: "Over-Population",
  Q6r4: "Over-Consumption",
  Q6r5: "Global Poverty",
  Q6r6: "Renewable Energy",
  Q6r7: "Water Scarcity",
  Q6r8: "Gender Equality",
  Q6r9: "LGBTQ+",
  Q6r10: "Disability Equality",
  Q6r11: "Racial Equality",
  Q6r12: "Religious Equality",
  Q6r13: "Environmental Protection",
  Q6r14: "Children's Rights",
  Q6r15: "Employee Welfare",
  Q6r16: "Female Empowerment",
  Q6r17: "Other (please specify)",
};

/* ── Q14: Business & Sustainability Statements (cell-encoded, c1=Agree/c2=Disagree/c3=Don't know) */
export const Q14_STATEMENTS: Record<string, string> = {
  Q14r1: "Most businesses prioritise profits over sustainability",
  Q14r2: "Businesses should do more to tackle sustainability issues",
  Q14r3: "All businesses have a responsibility to be more sustainable",
  Q14r4: "I'm more likely to buy from brands that demonstrate sustainability commitment",
  Q14r5: "I am sceptical about claims most businesses make about sustainability",
  Q14r6: "Having more data tracking will better enable sustainability goals",
  Q14r7: "Having a growing economy is more important than sustainability",
};

/* ── Q15: Sustainability Seriousness Scales (1-10 per row) ────────── */
export const Q15_SCALES: Record<string, string> = {
  Q15r1: "Sustainability in my country",
  Q15r2: "Sustainability in my local community",
  Q15r3: "Sustainability in my household",
};

/* ── Q17: Primary Responsibility (single-select) ─────────────────── */
export const Q17_RESPONSIBILITY: Record<number, string> = {
  1: "Individual citizens",
  2: "Businesses/corporations",
  3: "Government",
  4: "Environmental organisations / charities",
  5: "All of the above equally",
  6: "Other",
};

/* ── Q5: Understanding Scale (1-5 per area) ──────────────────────── */
export const Q5_UNDERSTANDING_SCALE: Record<number, string> = {
  1: "I know nothing about this area",
  2: "I have a little understanding",
  3: "I have a reasonable understanding",
  4: "I understand a lot",
  5: "I know everything",
};

/* ── Q13: Agreement Statements (IRT response times) ───────────────── */
export const Q13_STATEMENTS: Record<string, string> = {
  Q13r1: "My activity alone won't make much impact",
  Q13r2: "We are heading for irreversible environmental disaster",
  Q13r3: "Sustainability is someone else's problem",
  Q13r4: "We all need to play a role",
  Q13r5: "My friends and family care",
  Q13r6: "My government/local authorities care",
  Q13r7: "I need help and guidance to make better choices",
  Q13r8: "I am very aware of the impact of the products I buy/consume",
  Q13r9: "I want to do more but will wait for everyone else to do their bit",
  Q13r10: "I try to be more sustainable in some areas more than others",
  Q13r11: "What we are told about sustainability isn't the only way to do things",
  Q13r12: "Solutions require diverse perspectives and opinions to succeed",
  Q13r13: "My individual actions can make a big difference",
  Q13r14: "My generation views sustainability differently",
  Q13r15: "My views on sustainability are influenced by my cultural background",
  Q13r16: "The area I live has an impact on how sustainable I am",
};

/* ── Scale labels ─────────────────────────────────────────────────── */

export const Q7_SCALE: Record<number, string> = {
  1: "No influence",
  2: "Minor influence",
  3: "Moderate influence",
  4: "Major influence",
  5: "Critical influence",
  6: "Don't know",
};

export const Q8_SCALE: Record<number, string> = {
  1: "Very pessimistic",
  2: "Somewhat pessimistic",
  3: "Neutral",
  4: "Somewhat optimistic",
  5: "Very optimistic",
};

export const Q10_SCALE: Record<number, string> = {
  1: "Not willing at all",
  2: "Slightly willing",
  3: "Moderately willing",
  4: "Very willing",
  5: "Extremely willing",
};

/* ── Q-code → Full Question Wording (for citation popover) ────────── */
export const Q_CODE_QUESTIONS: Record<string, string> = {
  Q1: "In your own words, what does sustainability mean to you?",
  Q2: "Which of the following areas do you consider to be a part of sustainability?",
  Q3: "When you hear the phrase \"saving people and the planet\" what comes to mind?",
  Q4: "How concerned are you about sustainability and the impact on your life?",
  Q5: "How much would you say you understand about the role of sustainability in each of the following areas?",
  Q6: "When thinking about sustainability, which of the following issues are most important to you?",
  Q7: "How much influence do you believe your individual actions have on overall sustainability?",
  Q8: "How optimistic are you about society's ability to address sustainability challenges?",
  Q9: "In what ways do you currently try and do your bit to live more sustainably?",
  Q10: "How willing are you to make significant lifestyle changes in order to live more sustainably?",
  Q11: "What barriers prevent you from living more sustainably?",
  Q12: "What drives you to live more sustainably?",
  Q13: "To what extent do you agree or disagree with the following statements about sustainability and your role within it?",
  Q14: "To what extent do you agree or disagree with the following statements about businesses and sustainability?",
  Q15: "How seriously do you believe sustainability is being taken by different groups?",
  Q16: "In which of the following ways have you learned about the different aspects of sustainability?",
  Q17: "Who do you think bears the primary responsibility for addressing sustainability issues?",
  Q19: "What would make you more likely to adopt sustainable practices across different aspects of your life?",
  Q20: "Who in your community or society do you consider a role model for sustainable practices?",
  Q21: "Are there any specific events or information that have shaped your views on sustainability in recent years?",
  Q22: "Which industry does your company operate in?",
  Q23: "What type of area do you live in?",
  Q24: "Which one of the following ethnicities do you identify with?",
  Q25: "What is your religion?",
  S1: "Which of the following best describes your employment status?",
  S4: "Which of the following best describes your primary role at work?",
  S5: "What is your job title?",
  S6: "What level is your role within the organization?",
};

/* ── Helper: decode multi-code fields ─────────────────────────────── */

/**
 * Given a respondent's data_rows object and a code map (e.g. Q11_BARRIERS),
 * returns an array of human-readable labels for all codes where value === 1.
 */
export function decodeMultiCode(
  dataRows: Record<string, unknown>,
  codeMap: Record<string, string>
): string[] {
  return Object.entries(codeMap)
    .filter(([key]) => {
      const val = dataRows[key];
      return val === 1 || val === "1";
    })
    .map(([, label]) => label);
}

/**
 * For ranking fields (e.g. Q6) where any nonzero value means "selected"
 * and the value represents ranking position (1=top, 2=second, 3=third).
 * Returns labels sorted by rank.
 */
export function decodeRankedMultiCode(
  dataRows: Record<string, unknown>,
  codeMap: Record<string, string>
): string[] {
  return Object.entries(codeMap)
    .map(([key, label]) => ({ key, label, rank: Number(dataRows[key]) || 0 }))
    .filter(({ rank }) => rank > 0)
    .sort((a, b) => a.rank - b.rank)
    .map(({ label }) => label);
}
