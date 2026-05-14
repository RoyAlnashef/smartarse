# Survey Question Codebook

---

## Open-Text Questions


| Code | Question                                     |
| ---- | -------------------------------------------- |
| Q1   | What does sustainability mean to you?        |
| Q3   | What concerns you most about sustainability? |
| Q20  | Who is your sustainability role model?       |
| Q21  | What sustainability initiative inspires you? |
| QC1  | Sustainability concern (colour association)  |


---

## Single-Value Scales


| Code | Question                                         | Scale                                            |
| ---- | ------------------------------------------------ | ------------------------------------------------ |
| Q4   | Sustainability concern level                     | 1–10 (10 = highest)                              |
| Q7   | Perceived individual influence on sustainability | 1 = No influence · 5 = Critical · 6 = Don't know |
| Q8   | Optimism about society addressing sustainability | 1 = Very pessimistic · 5 = Very optimistic       |
| Q10  | Willingness to make lifestyle changes            | 1 = Not willing at all · 5 = Extremely willing   |
| QC2  | Product purchase trigger                         | Single code 1–4                                  |
| Q22  | Industry sector                                  | Numeric code                                     |
| Q23  | Area type                                        | 1 = Inner city · 5 = Rural                       |
| Q24  | Nationality *(KSA only)*                         | Numeric code                                     |
| Q25  | Religion                                         | Numeric code                                     |


---

## Grid Questions


| Code      | Question                                                   | Scale                              |
| --------- | ---------------------------------------------------------- | ---------------------------------- |
| Q5r1–Q5r8 | Understanding of sustainability topics                     | 1 = Very low · 5 = Know everything |
| Q15r1     | How seriously sustainability is taken — my country         | 1–10                               |
| Q15r2     | How seriously sustainability is taken — my local community | 1–10                               |
| Q15r3     | How seriously sustainability is taken — my household       | 1–10                               |


### Q5 Sub-Items


| Code | Topic                      |
| ---- | -------------------------- |
| r1   | Climate change             |
| r2   | Products & packaging       |
| r3   | Food chain                 |
| r4   | Greenhouse gas / pollution |
| r5   | Waste management           |
| r6   | Water conservation         |
| r7   | Nature & biodiversity      |
| r8   | Social inequality          |


---

## Multi-Select / Ranking Questions


| Code              | Question                                                | Type            |
| ----------------- | ------------------------------------------------------- | --------------- |
| Q2r1–Q2r7         | Sustainability associations                             | Multi-select    |
| Q6r1–Q6r17        | Most important sustainability issues                    | Ranking (top 3) |
| Q9r1–Q9r10, Q9r99 | Current sustainable actions being taken                 | Multi-select    |
| Q11r1–Q11r14      | Barriers to sustainable living                          | Multi-select    |
| Q11B              | Cultural/religious factors making sustainability harder | Open text       |
| Q12r1–Q12r11      | What drives you to live more sustainably                | Multi-select    |
| Q16r1–Q16r11      | Information sources about sustainability                | Multi-select    |
| Q19r1–Q19r10      | What would make you adopt sustainable practices         | Multi-select    |


---

## Single-Code Questions


| Code | Question                                            | Options                                                                                                   |
| ---- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Q17  | Who bears primary responsibility for sustainability | 1 = Individuals · 2 = Businesses · 3 = Government · 4 = Environmental orgs · 5 = All equally · 98 = Other |


---

## Implicit Association Test (Reaction Time Data)


| Code             | Question                                                   |
| ---------------- | ---------------------------------------------------------- |
| Q13r1c1–Q13r16c2 | IAT sustainability statement reaction times (milliseconds) |
| Q14r1c1–Q14r7c3  | IAT business/sustainability reaction times (milliseconds)  |


---

## Screening & Classification


| Code | Question              |
| ---- | --------------------- |
| S1   | Employment status     |
| S4   | Industry / sector     |
| S5   | Job title (open text) |
| S6   | Seniority level       |


---

## Other Specify Fields


| Code     | Parent Question                       |
| -------- | ------------------------------------- |
| Q11r13oe | Barriers — Other (specify)            |
| Q12r10oe | Drivers — Other (specify)             |
| Q16r11oe | Information sources — Other (specify) |
| Q19r9oe  | Adoption factors — Other (specify)    |


```
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
```

