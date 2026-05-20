import React, { useState, useEffect } from "react";
import { api } from "./api";

// =====================================================================
// Junglee × Edstellar — Gemini Capability Assessment
// Interactive demo for Mihir Samir Verma, Chief of Staff
// =====================================================================

const COLORS = {
  bg: "#F6F1E7",
  bgDeep: "#EFE8D8",
  ink: "#16140F",
  inkSoft: "#3A352F",
  inkMuted: "#8A8278",
  rule: "#C9C0AE",
  ruleSoft: "#DDD4C2",
  jungleeDeep: "#89191C",
  jungleeBright: "#D01F25",
  jungleeSoft: "#E8C5C5",
  edstellar: "#255FFF",
  edstellarSoft: "#C5D3FF",
  green: "#2D6A4F",
};

// =====================================================================
// QUESTION BANK
// =====================================================================

const ENGINEERING_QUESTIONS = [
  {
    id: "eng-q1",
    type: "K",
    section: "knowledge",
    stem: "You're using Gemini 3 Pro with Thinking mode enabled to debug a concurrency issue in the matchmaking service. Which prompt design choice will give you the best result?",
    options: [
      { text: "Tell it to 'think step by step, working through each thread's behaviour in sequence before reaching a conclusion.'", points: 0 },
      { text: "Describe the symptom, paste the relevant code, and ask for a diagnosis. Let the model's internal reasoning do the work.", points: 1 },
      { text: "Set temperature to 0.1 and use a system prompt that frames the model as a senior distributed-systems engineer.", points: 0 },
      { text: "Ask the model to first generate three possible hypotheses, then evaluate each one.", points: 0 },
    ],
  },
  {
    id: "eng-q2",
    type: "K",
    section: "knowledge",
    stem: "You want Gemini to return player segment data in a format your existing Python pipeline can consume reliably across thousands of runs. Which prompt fragment will most reliably produce parseable output?",
    options: [
      { text: "Return the results as a structured response in JSON format. Make sure it's valid.", points: 0 },
      { text: "Return the results as JSON with these keys: segment_id, player_count, avg_session_minutes. Use sensible types.", points: 0 },
      { text: "Return the results as a JSON object matching this schema: { \"segment_id\": string, \"player_count\": integer, \"avg_session_minutes\": number }. Output only the JSON, no preamble or commentary.", points: 1 },
      { text: "Return the results in JSON format. I've included a Python parser below, so make sure the output works with it: json.loads(response).", points: 0 },
    ],
  },
  {
    id: "eng-q3",
    type: "K",
    section: "knowledge",
    stem: "You're prompting Gemini to convert 200 legacy MSSQL stored procedures into clean Python equivalents. The transformation needs to be consistent across all 200 — same naming, same error handling, same logging pattern. Each procedure is similar in shape (10 to 30 lines, no complex logic). What prompt approach produces the most consistent output across all 200 runs?",
    options: [
      { text: "Describe the desired style precisely in a long system prompt — naming conventions, error handling patterns, expected use of context managers — and submit each procedure individually.", points: 0 },
      { text: "Provide 2 to 3 worked examples showing the exact input/output transformation, then submit each new procedure with the same prefix.", points: 1 },
      { text: "Use a system prompt that establishes the role ('You are a senior Python engineer who has converted hundreds of MSSQL procedures') and the conventions, then submit procedures one at a time.", points: 0 },
      { text: "For each procedure, prompt Gemini to first explain the procedure's logic in plain English, get the explanation, then prompt again to convert based on the explanation.", points: 0 },
    ],
  },
  {
    id: "eng-q4",
    type: "K",
    section: "knowledge",
    stem: "You're drafting a roadmap update in Google Docs. You have a Sheet called 'Q3-Revenue-Forecast' and a Doc called 'Player-Research-Q3' in your Drive that you want Gemini to use as context for the update. What's the most efficient way?",
    options: [
      { text: "Paste key tables and quotes from each file into a hidden section at the bottom of the Doc, then prompt Gemini.", points: 0 },
      { text: "In the prompt to Gemini, type @ and the file name for each file; Gemini reads them as live context.", points: 1 },
      { text: "Use the 'Connect data' feature in Docs to link both files as data sources, then prompt Gemini.", points: 0 },
      { text: "Open the Doc, the Sheet, and the other Doc in three separate browser tabs; Gemini sees what's open.", points: 0 },
    ],
  },
  {
    id: "eng-q5",
    type: "K",
    section: "knowledge",
    stem: "You're asking Gemini to summarise recent changes to India's IT Rules for online gaming, which have been amended twice this year. Which instruction will most reliably give you current information rather than training-data answers?",
    options: [
      { text: "Make sure you're using the most recent information. Cite any sources you rely on.", points: 0 },
      { text: "Use Google Search grounding for this. Return cited sources alongside the summary.", points: 1 },
      { text: "The current date is May 2026. Use information from 2025 and 2026 only. If you reference anything older, flag it.", points: 0 },
      { text: "Use the tool that lets you search the web before answering. Cite sources.", points: 0 },
    ],
  },
  {
    id: "eng-q6",
    type: "K",
    section: "knowledge",
    stem: "Research from 2024 to 2025 shows LLM reasoning quality starts to degrade around 3,000 tokens of context, even though Gemini's context window is far larger. What's the best practical implication for production prompts?",
    options: [
      { text: "Keep prompts compact; if more context is needed, retrieve only the most relevant chunks via RAG and inject those into the prompt.", points: 1 },
      { text: "Always use the full context window for safety — more context lets the model find the right answer even if some is irrelevant.", points: 0 },
      { text: "For tasks above 3,000 tokens, switch to Gemini 3 Pro with its larger effective context handling.", points: 0 },
      { text: "Pre-process long inputs by asking Gemini to summarise them first, then feed the summary into the next prompt.", points: 0 },
    ],
  },
  {
    id: "eng-q7",
    type: "K",
    section: "knowledge",
    stem: "You're building an internal tool that uses Gemini to triage support tickets from Junglee players into one of seven routing categories. The system prompt needs to enforce consistent routing. Which design pattern is most robust?",
    options: [
      { text: "A detailed system prompt that walks through Junglee's player demographics, the philosophy behind each category, and instructs the model to apply judgement to ambiguous cases.", points: 0 },
      { text: "A short structured system prompt: role, list of categories with one defining example each, output schema, what to do when uncertain.", points: 1 },
      { text: "A two-stage system prompt: first stage classifies sentiment and urgency, second stage maps the classification onto the seven categories.", points: 0 },
      { text: "A system prompt that includes 20 fully-worked routing examples covering edge cases, ambiguous tickets, and the most common mistakes.", points: 0 },
    ],
  },
  {
    id: "eng-q8",
    type: "K",
    section: "knowledge",
    stem: "Which instruction will more reliably get Gemini to use only the data you've provided in the prompt?",
    options: [
      { text: "Do not hallucinate. Do not invent statistics. Do not use information from outside the provided context.", points: 0 },
      { text: "Use only the data provided below. If the data does not contain the answer, respond: 'Not available in provided data.'", points: 1 },
      { text: "Base your answer strictly on the context provided. If you're unsure, say so.", points: 0 },
      { text: "Treat the provided data as the only source of truth. Cite specific lines from it for every claim you make.", points: 0 },
    ],
  },
  {
    id: "eng-q9",
    type: "K",
    section: "knowledge",
    stem: "Your engineering team uses Gemini Code Assist in VS Code daily. A colleague asks you the best way to refactor a 400-line legacy function across three related files in your repository. Which approach in Code Assist is most effective?",
    options: [
      { text: "Open each file individually, select the relevant section, press Cmd+I and use /fix on each file in turn.", points: 0 },
      { text: "Use agent mode chat and prompt with '@your-repo-name refactor the X function consolidating the duplicated logic across files A, B, C — present a plan before making changes'.", points: 1 },
      { text: "Copy the contents of all three files into the side-panel chat, then ask Gemini to suggest a unified refactor.", points: 0 },
      { text: "Use /simplify on the longest function and let Gemini propose the structure, then manually apply matching changes to the other two files.", points: 0 },
    ],
  },
  {
    id: "eng-q10",
    type: "K",
    section: "knowledge",
    stem: "You're prototyping a feature that classifies player chat messages for toxicity in real time. The classifier needs to handle approximately 200 messages per second at peak. Which model do you start with?",
    options: [
      { text: "Gemini 3 Pro — when accuracy matters for player safety, you can't compromise on the strongest model.", points: 0 },
      { text: "Gemini 3 Flash — classification is a throughput-bound task; you need low latency and the cost-per-call to scale.", points: 1 },
      { text: "Gemini 3 Thinking — toxicity classification often involves nuance and context, which Thinking mode handles better.", points: 0 },
      { text: "A custom-tuned Gemini model trained on your historical labelled toxicity data.", points: 0 },
    ],
  },
  {
    id: "eng-q11",
    type: "J",
    section: "judgement",
    stem: "A teammate shares this prompt with you: \"Hey Gemini, can you please act as a senior game design expert with 20 years of experience and think step by step about whether we should add a new tournament mode to Junglee Rummy. Make sure not to forget about player retention. Don't hallucinate. Give me a detailed analysis with all the pros and cons. Thanks!\" What's the most useful piece of feedback?",
    options: [
      { text: "It has no inputs — no retention numbers, no past tournament data, no success definition. Gemini will produce a generic answer that sounds reasonable. Add data and an output contract.", points: 2 },
      { text: "Three smaller issues stacked: 'don't hallucinate' should be positive-framed, 'think step by step' is redundant for reasoning models, and 'detailed analysis with pros and cons' isn't a real output spec. Fix each one and the prompt improves substantially.", points: 1 },
      { text: "The prompt is reasonable. Maybe add a sentence about Junglee's audience and the timing of the launch to make the output more specific to our situation.", points: 0 },
      { text: "Drop the role prompting. 'Senior game design expert with 20 years of experience' has negligible effect on factual analysis tasks and just wastes tokens.", points: 0 },
    ],
  },
  {
    id: "eng-q12",
    type: "J",
    section: "judgement",
    stem: "Gemini produces this Python snippet to process player session data:\n\ndef get_active_users(sessions, threshold_minutes=30):\n    active = []\n    for s in sessions:\n        if s['duration'] > threshold_minutes * 60:\n            active.append(s['user_id'])\n    return list(set(active))\n\nThe code runs without errors on your test data. What's the most important concern before using it on production data?",
    options: [
      { text: "It runs, returns a deduplicated list, has clear naming. Looks production-ready — ship and monitor.", points: 0 },
      { text: "The list(set(active)) pattern loses order. If downstream consumers expect chronological or ID-sorted user IDs, this is a silent bug that will surface in unpredictable ways.", points: 1 },
      { text: "It assumes every session has 'duration' and 'user_id' keys, with duration as a non-null integer in seconds. None of those are validated. At production volume, one malformed record crashes the batch and you get no signal which record caused it.", points: 2 },
      { text: "The set conversion is wasteful — better to use a dict for dedup, or sort the list first. Also, the for-loop should be a comprehension for performance at production volume.", points: 0 },
    ],
  },
  {
    id: "eng-q13",
    type: "J",
    section: "judgement",
    stem: "You have these four tasks on your sprint today. Which is the worst candidate for using Gemini to help?",
    options: [
      { text: "Generate the boilerplate for a new microservice, including the standard observability hooks, against our existing template.", points: 0 },
      { text: "Write a script to grep last week's application logs for a specific error pattern and tally occurrences by service. A senior engineer might do this faster directly.", points: 1 },
      { text: "Decide whether to deprecate a payments service that hasn't been touched in 18 months but is listed in three other services' dependency graphs.", points: 2 },
      { text: "Write unit tests for a utility function with clear, documented behaviour and known input ranges that you've worked with before.", points: 0 },
    ],
  },
  {
    id: "eng-q14",
    type: "J",
    section: "judgement",
    stem: "You ask Gemini to summarise recent changes to India's IT Rules for online gaming. It returns a clean, structured response with specific dates, section numbers, and named provisions. What's the right next step before relying on any of it?",
    options: [
      { text: "This is high-coverage public policy with strong training data. Trust the response unless something looks obviously off — pattern-match against what you already know about the rules.", points: 0 },
      { text: "Verify every specific claim — dates, section numbers, provisions — against the primary source (MeitY publication or a tracked legal database). Treat the response as outline, not evidence.", points: 2 },
      { text: "Re-run with Search grounding explicitly enabled, request cited sources, and independently confirm each citation resolves to the document it claims.", points: 2 },
      { text: "Run the query three times with slight phrasing variations. If dates and section numbers stay consistent across all three runs, the answer is reliable enough to use.", points: 0 },
    ],
  },
  {
    id: "eng-q15",
    type: "J",
    section: "judgement",
    stem: "Your team uses Gemini Enterprise (sanctioned, paid), Claude (personal accounts), and ChatGPT (personal accounts) for daily work. A colleague pastes a snippet of Junglee's payment-processing logic into a personal ChatGPT to debug it. What's the right response?",
    options: [
      { text: "Pull them aside privately and explain that personal AI accounts shouldn't be used for code that handles sensitive systems. Document the conversation but don't escalate.", points: 0 },
      { text: "Report the incident through the standard security channel so it's documented in the incident log, and follow up with the colleague separately about the policy.", points: 1 },
      { text: "Report it, then in the same conversation propose migrating the team's debugging workflow to Gemini Enterprise. Frame the incident as a workflow gap, not a discipline issue.", points: 2 },
      { text: "Watch the situation; one snippet is unlikely to cause real harm and surfacing this creates more friction than it's worth across the team.", points: 0 },
    ],
  },
  {
    id: "eng-q16",
    type: "J",
    section: "judgement",
    stem: "A colleague submits a pull request: 600 lines of new code. Variable names are clean. Docstrings are extensive. Structure is reasonable. Every function has a header comment. Something feels off but you can't articulate what. What's the most useful next step?",
    options: [
      { text: "Approve it — clean code with good documentation is the standard you want to encourage on the team, and 'feels off' isn't a substantive review comment.", points: 0 },
      { text: "Ask the colleague to walk you through it on a call so you can see how they were thinking through the design and get a sense for whether the polish reflects actual understanding.", points: 1 },
      { text: "Pick three involved functions. Ask the colleague to explain why they chose that approach over the obvious alternative. AI-assisted code that wasn't deeply understood can't defend specific design choices.", points: 2 },
      { text: "Run the test suite, check coverage on the new code paths, and ask for additional tests on anything below 80%. If tests pass and cover the code paths reasonably, ship it.", points: 1 },
    ],
  },
  {
    id: "eng-q17",
    type: "J",
    section: "judgement",
    stem: "A senior engineer in another team shares a prompt with you and says 'this produces great results for code review.' Before adopting it on your team, what's the most important thing to check?",
    options: [
      { text: "Whether the prompt is compatible with Gemini 3 — older prompts written for earlier models sometimes need adjustments for newer reasoning behaviour.", points: 0 },
      { text: "What inputs they tested it on, and whether those test cases represent your team's actual workload. A prompt fitted to one codebase often degrades on another.", points: 2 },
      { text: "Whether the prompt includes few-shot examples appropriate to your code style. If the examples reflect their conventions, you'll need to swap in your own.", points: 1 },
      { text: "Whether it's been reviewed by the AI Champions network and tagged as approved for code-review use cases across the engineering org.", points: 1 },
    ],
  },
];

const LAYMAN_QUESTIONS = [
  {
    id: "lay-q1",
    type: "K",
    section: "knowledge",
    stem: "You open an email thread with 23 replies about a player communications launch. You need the decision quickly. Which Gemini feature is the right tool?",
    options: [
      { text: "Use 'Smart Reply' suggestions to see what Gemini thinks the most likely responses to the thread are.", points: 0 },
      { text: "Click 'Summarize this email' in the Gemini side panel; Gemini reads the thread and returns a structured summary.", points: 1 },
      { text: "Open Gemini chat at gemini.google.com and paste the thread in, then ask for the key decision.", points: 0 },
      { text: "Use Gmail's filter menu to search the thread for messages containing decision keywords.", points: 0 },
    ],
  },
  {
    id: "lay-q2",
    type: "K",
    section: "knowledge",
    stem: "You're drafting a project update in Docs. You've highlighted three bullet points that aren't quite flowing well. You click the Gemini icon. Which feature gives you what you need?",
    options: [
      { text: "'Summarize this section' — Gemini will condense the bullets into a tighter form.", points: 0 },
      { text: "'Help me write' with the instruction 'polish this section' or 'improve flow.' Gemini rewrites the selected text.", points: 1 },
      { text: "'Match writing style' — Gemini ensures the selection matches the tone of the rest of the document.", points: 0 },
      { text: "'Refine' on the floating bar — Gemini suggests in-place revisions to the selected text.", points: 0 },
    ],
  },
  {
    id: "lay-q3",
    type: "K",
    section: "knowledge",
    stem: "You have a column of player IDs in a Junglee Rummy Sheet, and you want a second column showing each player's most-played variant this month (data is in a separate Sheet). What's the most reliable way to do this with Gemini in Sheets?",
    options: [
      { text: "Use the 'Help me organize' prompt in the Gemini side panel and describe the lookup in plain English; Gemini generates a formula you can paste in the second column.", points: 1 },
      { text: "Use Gemini in Docs to write the VLOOKUP formula, then paste it into the Sheet.", points: 0 },
      { text: "Export both Sheets as CSV, paste them into gemini.google.com, ask Gemini to merge them, then paste back into Sheets.", points: 0 },
      { text: "Use the Gemini chat panel in Sheets to ask Gemini to populate the second column directly with the values it computes.", points: 0 },
    ],
  },
  {
    id: "lay-q4",
    type: "K",
    section: "knowledge",
    stem: "You're hosting a 45-minute roadmap planning call with stakeholders across Bengaluru and Gurgaon. You want structured notes with action items at the end. Which Gemini feature in Meet is the right one?",
    options: [
      { text: "Turn on 'Live captions' so Gemini can process the transcript afterwards.", points: 0 },
      { text: "Enable 'Take notes for me' before the call starts; Gemini produces a structured notes document with action items attached.", points: 1 },
      { text: "Use the 'Meeting transcript' feature to record what's said, then run the transcript through Gemini in Docs after the call.", points: 0 },
      { text: "Use the 'Summarize this meeting' option from the Meet sidebar during the call.", points: 0 },
    ],
  },
  {
    id: "lay-q5",
    type: "K",
    section: "knowledge",
    stem: "You're drafting a quarterly review in Docs. You want Gemini to incorporate data from 'Q3-OKRs.gsheet' and 'Q3-Player-Survey.gdoc' that are both in your Drive. What's the right way?",
    options: [
      { text: "Copy and paste the relevant sections from each file into the Doc, then prompt Gemini.", points: 0 },
      { text: "In your prompt to Gemini, type @ and the file name for each file; Gemini will use them as context for its response.", points: 1 },
      { text: "Share the two files with yourself as the Gemini app user, then reference them by URL in your prompt.", points: 0 },
      { text: "Open all three files in browser tabs at the same time so Gemini has access to them as context.", points: 0 },
    ],
  },
  {
    id: "lay-q6",
    type: "K",
    section: "knowledge",
    stem: "You're scoping a competitive analysis of new rummy gaming entrants in Southeast Asia. You need a structured report covering several competitors, market sizing, and recent funding rounds. Which Gemini surface fits this task best?",
    options: [
      { text: "Open Docs and ask 'Help me write' to draft a competitive analysis section by section, providing whatever you already know.", points: 0 },
      { text: "Open Deep Research in the Gemini Enterprise app; describe the analysis you need, and let it autonomously search dozens of sources and compile a structured report with citations.", points: 1 },
      { text: "Ask Gemini chat at gemini.google.com to give you a list of rummy competitors, then research each one individually.", points: 0 },
      { text: "Build a custom Gem with your competitive intelligence template, then prompt it about the SEA market.", points: 0 },
    ],
  },
  {
    id: "lay-q7",
    type: "K",
    section: "knowledge",
    stem: "Your team has 14 PDFs of player research from the last 18 months. You want to find every passage that mentions retention concerns, with citations back to the source PDFs. What's the right tool?",
    options: [
      { text: "Upload all 14 PDFs to NotebookLM as a notebook, then ask 'Find every passage about player retention concerns and quote them with their source documents.'", points: 1 },
      { text: "Use Deep Research in the Gemini Enterprise app and tell it to search your 14 PDFs for retention passages.", points: 0 },
      { text: "Convert each PDF to a Google Doc, put them in a Drive folder, then ask Gemini in Docs to search across them with @mention.", points: 0 },
      { text: "Combine all 14 PDFs into a single document, upload to gemini.google.com, ask for retention quotes with citations.", points: 0 },
    ],
  },
  {
    id: "lay-q8",
    type: "K",
    section: "knowledge",
    stem: "You write similar player-comms drafts every week — same brand voice, same compliance constraints (responsible gaming rules), same approval flow context. Building a custom 'Gem' gives you what?",
    options: [
      { text: "A reusable Gemini configuration with persistent instructions baked in, so you don't re-explain the same context every time you draft.", points: 1 },
      { text: "A version of Gemini fine-tuned on your brand voice, so the model itself learns to write in Junglee's style.", points: 0 },
      { text: "A workspace with saved past prompts you can copy and modify, like a prompt history.", points: 0 },
      { text: "A custom agent that can read your Drive, generate drafts, and post them to a review channel automatically.", points: 0 },
    ],
  },
  {
    id: "lay-q9",
    type: "K",
    section: "knowledge",
    stem: "A new colleague asks you to explain how Gemini works at Junglee. Which explanation is most accurate?",
    options: [
      { text: "Gemini is one product accessed through different doorways — Workspace, the standalone app, and the engineering platform are all the same thing with different entry points.", points: 0 },
      { text: "Gemini has three distinct surfaces: Workspace-embedded (Docs, Sheets, Gmail, Meet), the standalone Gemini Enterprise app (chat, Deep Research, NotebookLM, Gems), and the Agent Platform for engineers building custom agents. Most non-engineers use the first two.", points: 1 },
      { text: "Workspace Gemini and gemini.google.com are the same product with the same features; only the URL differs. Agent Platform is a separate developer tool with no overlap.", points: 0 },
      { text: "Gemini Enterprise app is the main surface; Workspace Gemini features are a subset of it. Agent Platform is for advanced users who want to build complex prompts.", points: 0 },
    ],
  },
  {
    id: "lay-q10",
    type: "J",
    section: "judgement",
    stem: "A colleague shares an internal blog draft they generated with Gemini in 4 minutes. It's 800 words, structured into five sections with subheadings, has confident statements throughout, and uses Junglee's brand voice well. Reading it, you notice it doesn't say anything specific about Junglee's actual situation — it could have been written for any gaming company. What do you tell them?",
    options: [
      { text: "It reads well — clear structure, on-brand voice, good length. The lack of specifics is fine for an internal blog where readers already know our context anyway.", points: 0 },
      { text: "Structure is solid, but it reads as generic gaming content. Add three specific Junglee inputs — a product name, a recent decision, a real number — and rerun the prompt. Otherwise this is Workslop.", points: 2 },
      { text: "Try a different prompt that asks Gemini to focus on Junglee specifically. Mention our brand, our games, and our recent quarter directly in the prompt itself.", points: 1 },
      { text: "Add an introduction paragraph that names Junglee and our market position. With that framing the rest of the draft will feel more grounded to the reader.", points: 0 },
    ],
  },
  {
    id: "lay-q11",
    type: "J",
    section: "judgement",
    stem: "You have these four things on your plate today. Which is the worst candidate for using Gemini?",
    options: [
      { text: "Draft a welcome email to 50 new high-value players, personalised by their game preferences from the player CRM.", points: 0 },
      { text: "Decide whether to escalate a specific player complaint to leadership. Known high-spender, recent product change involved, relationship history in CRM.", points: 2 },
      { text: "Summarise yesterday's three-hour off-site discussion into action items, using the meeting transcript Gemini captured automatically.", points: 0 },
      { text: "Compare three vendor proposals for a new analytics tool, looking at feature coverage, pricing, and integration complexity for our stack.", points: 1 },
    ],
  },
  {
    id: "lay-q12",
    type: "J",
    section: "judgement",
    stem: "You ask Gemini to summarise a 35-page market analysis report. The summary is clean and useful. How much of it do you need to verify before forwarding to your manager?",
    options: [
      { text: "None — Gemini is reading the document I gave it. The summary is a reading shortcut, and verification would defeat the time-saving purpose of using it.", points: 0 },
      { text: "Skim the report yourself. Gemini's summary is structured around what it thinks matters, which may not match what your manager will react to. Spot-check numbers and quoted claims.", points: 2 },
      { text: "Skim the summary, verify any specific numbers and any direct quotes, and forward with a note: 'summary by Gemini, source attached for reference.'", points: 1 },
      { text: "Run the summary through Gemini a second time with the prompt 'check this summary against the original for accuracy.' If it doesn't flag issues, it's reliable.", points: 0 },
    ],
  },
  {
    id: "lay-q13",
    type: "J",
    section: "judgement",
    stem: "You're using Gemini Enterprise (Junglee's sanctioned, paid version, with the no-training-on-customer-data guarantee). Which of these is riskiest to paste into a prompt?",
    options: [
      { text: "Yesterday's all-hands meeting notes including the CEO's commentary on Q4 priorities and the upcoming product roadmap discussion.", points: 0 },
      { text: "A long player support ticket from a frustrated user that mentions their full name, account ID, and the specific issue they raised.", points: 1 },
      { text: "A spreadsheet with KYC data for 800 high-value players — names, addresses, account balances, payment methods, transaction history.", points: 2 },
      { text: "A draft of a competitive strategy document about a new product launch planned for next quarter with positioning details.", points: 0 },
    ],
  },
  {
    id: "lay-q14",
    type: "J",
    section: "judgement",
    stem: "You're writing a player communications brief. Your Drive has 12 documents that could be relevant: 4 old comms briefs (different products), 3 brand-voice guidelines, 2 responsible-gaming policy documents, 1 legal review template, 1 player segment definition, 1 internal post-mortem of a previous comms incident. Which @mention strategy works best?",
    options: [
      { text: "Mention all 12 so Gemini has complete context. Excluding any of them risks missing a constraint that turns out to matter.", points: 0 },
      { text: "Mention 3 to 4: brand-voice guideline that applies, the RG policy, the most relevant past brief, and the post-mortem. Beyond that, you're adding noise that degrades reasoning.", points: 2 },
      { text: "Mention the brand-voice guideline and the RG policy. The post-mortem would help but might be too much context to include alongside the main writing task itself.", points: 1 },
      { text: "Mention only the brand-voice guideline — Gemini will infer the RG rules from its training data, and other files will just confuse the response output.", points: 0 },
    ],
  },
  {
    id: "lay-q15",
    type: "J",
    section: "judgement",
    stem: "You want Gemini to draft a player apology email after a server outage during peak Junglee Rummy hours. Which of these prompts will produce the best output?",
    options: [
      { text: "Write an apology email for the recent outage. Make it sincere and not too long. Players should feel valued and want to come back to the platform.", points: 0 },
      { text: "Draft player apology email for the Nov 18 outage (8:30 to 9:15pm IST). Audience: cash-game players mid-match. Tone: warm, accountable, no jargon. Mention goodwill credit. Under 150 words. CTA: 'Resume playing.'", points: 2 },
      { text: "Write an apology email for the November 18 outage. Tone warm and accountable. Acknowledge that players in active games were affected. Mention the goodwill credit. Keep it short — under 200 words.", points: 1 },
      { text: "You are a senior customer experience writer with empathy and clarity. Draft an apology email for our recent outage that makes players feel valued and informed about what we're doing.", points: 0 },
    ],
  },
];

const SELF_RATING_OPTIONS = [
  { value: 1, label: "I rarely use it." },
  { value: 2, label: "I use it occasionally for one or two specific tasks." },
  { value: 3, label: "I use it across several tasks each week." },
  { value: 4, label: "I use it daily across multiple workflows." },
  { value: 5, label: "I've designed AI-augmented workflows that others now use." },
];

// =====================================================================
// TRACK DESCRIPTIONS
// =====================================================================

const TRACK_DESCRIPTIONS = {
  foundation: {
    name: "Foundation",
    duration: "8-week cohort",
    summary: "Start at the beginning. Build a working mental model of Gemini's surfaces, then develop the judgement to use them well.",
    watchFor: "Most at risk of becoming Workslop-producers in weeks one to three. Module 2 specifically addresses output verification.",
  },
  knowledgeLed: {
    name: "Knowledge-led Practitioner",
    duration: "6-week cohort, judgement-heavy",
    summary: "You know the surfaces well. The work now is evaluating output quality, choosing when AI helps, and developing verification discipline.",
    watchFor: "Largest single-quadrant population in most enterprise rollouts. Enthusiastic, surface-productive, quietly accumulating verification debt.",
  },
  judgementLed: {
    name: "Judgement-led Practitioner",
    duration: "6-week cohort, tooling-heavy",
    summary: "Your instincts are sound. Each session introduces one Gemini surface with hands-on time. Less judgement content because you already have it.",
    watchFor: "Often opted out of AI tools deliberately. Module 1 validates that instinct before redirecting it.",
  },
  advanced: {
    name: "Advanced / Champion",
    duration: "4-week co-delivery cohort",
    summary: "You're already an effective Gemini user. Your work is a real-problem capstone, co-delivered with Edstellar to your colleagues in subsequent cohorts.",
    watchFor: "Small population (typically 8–15% of any org). The AI Champions network candidates.",
  },
};

// =====================================================================
// STYLES
// =====================================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    color: COLORS.ink,
    fontFamily: "Inter, -apple-system, system-ui, sans-serif",
    padding: "24px",
  },
  container: {
    maxWidth: "720px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0 24px 0",
    borderBottom: `1px solid ${COLORS.rule}`,
    marginBottom: "32px",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: COLORS.inkMuted,
    fontWeight: 600,
  },
  brandDot: {
    width: "6px",
    height: "6px",
    background: COLORS.jungleeDeep,
    borderRadius: "50%",
  },
  progress: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12px",
    color: COLORS.inkMuted,
    letterSpacing: "0.05em",
  },
  progressBar: {
    height: "2px",
    background: COLORS.ruleSoft,
    marginBottom: "32px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: COLORS.jungleeDeep,
    transition: "width 350ms ease-out",
  },
  h1: {
    fontSize: "32px",
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: "-0.015em",
    color: COLORS.ink,
    marginBottom: "16px",
  },
  h2: {
    fontSize: "20px",
    fontWeight: 600,
    color: COLORS.ink,
    marginBottom: "12px",
  },
  bodyText: {
    fontSize: "15px",
    lineHeight: 1.6,
    color: COLORS.inkSoft,
    marginBottom: "16px",
  },
  cardOption: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "14px 16px",
    background: COLORS.bgDeep,
    border: `1px solid transparent`,
    borderRadius: "6px",
    fontSize: "14px",
    lineHeight: 1.5,
    color: COLORS.ink,
    cursor: "pointer",
    marginBottom: "10px",
    fontFamily: "inherit",
    transition: "background 120ms ease, border-color 120ms ease",
  },
  cardOptionSelected: {
    background: "#FFFFFF",
    borderColor: COLORS.jungleeDeep,
  },
  cardOptionHover: {
    background: "#FFFFFF",
  },
  primaryBtn: {
    padding: "12px 24px",
    background: COLORS.ink,
    color: COLORS.bg,
    border: "none",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.02em",
  },
  secondaryBtn: {
    padding: "12px 20px",
    background: "transparent",
    color: COLORS.ink,
    border: `1px solid ${COLORS.rule}`,
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
    marginRight: "10px",
  },
  trackCard: {
    padding: "20px",
    background: COLORS.bgDeep,
    borderRadius: "6px",
    marginBottom: "12px",
    cursor: "pointer",
    transition: "transform 120ms ease, background 120ms ease",
    border: "1px solid transparent",
  },
  metaLine: {
    fontSize: "11px",
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: COLORS.jungleeDeep,
    fontWeight: 600,
    marginBottom: "6px",
  },
  prePre: {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "12.5px",
    background: "#FFFFFF",
    padding: "12px 14px",
    borderRadius: "4px",
    border: `1px solid ${COLORS.ruleSoft}`,
    marginBottom: "12px",
    whiteSpace: "pre-wrap",
    overflow: "auto",
  },
};

// =====================================================================
// COMPONENT
// =====================================================================

export default function GeminiAssessment() {
  // Stages: start | name | track-select | self-rating | questions | result | methodology | shared
  const [stage, setStage] = useState("start");
  const [participantName, setParticipantName] = useState("");
  const [participantRole, setParticipantRole] = useState("");
  const [track, setTrack] = useState(null); // 'engineering' | 'layman'
  const [selfRating, setSelfRating] = useState(null);
  const [responses, setResponses] = useState({}); // { questionId: optionIndex }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sharedResults, setSharedResults] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  // Load in-progress session
  useEffect(() => {
    (async () => {
      try {
        const parsed = await api.getSession();
        if (parsed && parsed.stage && parsed.stage !== "result" && parsed.stage !== "start") {
          setStage(parsed.stage);
          setParticipantName(parsed.participantName || "");
          setParticipantRole(parsed.participantRole || "");
          setTrack(parsed.track || null);
          setSelfRating(parsed.selfRating || null);
          setResponses(parsed.responses || {});
          setCurrentIndex(parsed.currentIndex || 0);
        }
      } catch (e) {
        // no in-progress session, that's fine
      }
      setStorageReady(true);
    })();
  }, []);

  // Persist session
  useEffect(() => {
    if (!storageReady) return;
    if (stage === "start" || stage === "result") {
      api.deleteSession();
      return;
    }
    const payload = {
      stage, participantName, participantRole, track, selfRating, responses, currentIndex,
    };
    api.setSession(payload);
  }, [stage, participantName, participantRole, track, selfRating, responses, currentIndex, storageReady]);

  // Load shared results
  const loadSharedResults = async () => {
    setLoadingResults(true);
    const results = await api.getResults();
    setSharedResults(results);
    setLoadingResults(false);
  };

  useEffect(() => {
    if (stage === "shared" || stage === "result") {
      loadSharedResults();
    }
  }, [stage]);

  const questions = track === "engineering" ? ENGINEERING_QUESTIONS : track === "layman" ? LAYMAN_QUESTIONS : [];
  const totalQuestions = questions.length;
  const knowledgeQs = questions.filter(q => q.section === "knowledge");
  const judgementQs = questions.filter(q => q.section === "judgement");

  const computeScores = () => {
    let kScore = 0, kMax = 0, jScore = 0, jMax = 0;
    knowledgeQs.forEach(q => {
      kMax += 1;
      const selected = responses[q.id];
      if (selected !== undefined) {
        kScore += q.options[selected].points;
      }
    });
    judgementQs.forEach(q => {
      jMax += 2;
      const selected = responses[q.id];
      if (selected !== undefined) {
        jScore += q.options[selected].points;
      }
    });
    const kPct = kMax > 0 ? Math.round((kScore / kMax) * 100) : 0;
    const jPct = jMax > 0 ? Math.round((jScore / jMax) * 100) : 0;
    return { kScore, kMax, jScore, jMax, kPct, jPct };
  };

  const determineTrack = (kPct, jPct) => {
    const highK = kPct >= 50;
    const highJ = jPct >= 50;
    if (highK && highJ) return "advanced";
    if (highK && !highJ) return "knowledgeLed";
    if (!highK && highJ) return "judgementLed";
    return "foundation";
  };

  // =====================================================================
  // RENDER FUNCTIONS
  // =====================================================================

  const renderHeader = () => (
    <div style={styles.header}>
      <div style={styles.brand}>
        <span style={styles.brandDot}></span>
        <span>Junglee × Edstellar</span>
      </div>
      <div style={styles.progress}>
        {stage === "questions" && `${currentIndex + 1} / ${totalQuestions}`}
        {stage === "self-rating" && `Calibration`}
        {(stage === "result" || stage === "methodology") && `Complete`}
      </div>
    </div>
  );

  const renderProgressBar = () => {
    if (stage !== "questions") return null;
    const pct = ((currentIndex + 1) / totalQuestions) * 100;
    return (
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${pct}%` }}></div>
      </div>
    );
  };

  // ---------- START ----------
  const renderStart = () => (
    <div>
      <div style={styles.metaLine}>Gemini Capability Assessment</div>
      <h1 style={styles.h1}>Where you actually sit on Gemini today.</h1>
      <p style={styles.bodyText}>
        A short diagnostic to identify which AI Academy track you'd start in. Two axes: <strong>knowledge</strong> (what Gemini does) and <strong>judgement</strong> (when to use it). Together they place you in one of four cohorts, each with a different curriculum sequence.
      </p>
      <p style={styles.bodyText}>
        Roughly 12 minutes. Honest answers help more than impressive ones. You can pause and resume on the same device.
      </p>
      <div style={{ marginTop: "32px", marginBottom: "32px", padding: "16px 18px", background: COLORS.bgDeep, borderRadius: "6px", borderLeft: `3px solid ${COLORS.edstellar}` }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.edstellar, fontWeight: 600, marginBottom: "6px" }}>For Mihir, Kalyani &amp; team</div>
        <div style={{ fontSize: "13.5px", lineHeight: 1.55, color: COLORS.inkSoft }}>
          This is not the actual assessment we'd deploy to all 300 employees, this is a demo. The methodology behind the scoring is documented in the brief PDF.
        </div>
      </div>
      <button style={styles.primaryBtn} onClick={() => setStage("name")}>Start assessment</button>
      <button
        style={{ ...styles.secondaryBtn, marginLeft: "10px" }}
        onClick={() => setStage("shared")}
      >
        See who else has taken it
      </button>
    </div>
  );

  // ---------- NAME ----------
  const renderName = () => (
    <div>
      <div style={styles.metaLine}>Step 1 of 4</div>
      <h2 style={styles.h2}>Quick intro</h2>
      <p style={styles.bodyText}>So your result shows up correctly on the shared dashboard. First name is enough.</p>
      <input
        type="text"
        placeholder="First name"
        value={participantName}
        onChange={e => setParticipantName(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px", fontSize: "15px",
          border: `1px solid ${COLORS.rule}`, borderRadius: "4px",
          marginBottom: "12px", background: "#FFFFFF", color: COLORS.ink,
          fontFamily: "inherit",
        }}
      />
      <input
        type="text"
        placeholder="Role (optional)"
        value={participantRole}
        onChange={e => setParticipantRole(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px", fontSize: "15px",
          border: `1px solid ${COLORS.rule}`, borderRadius: "4px",
          marginBottom: "24px", background: "#FFFFFF", color: COLORS.ink,
          fontFamily: "inherit",
        }}
      />
      <button
        style={{ ...styles.primaryBtn, opacity: participantName.trim() ? 1 : 0.4 }}
        disabled={!participantName.trim()}
        onClick={() => setStage("track-select")}
      >
        Continue
      </button>
    </div>
  );

  // ---------- TRACK SELECT ----------
  const renderTrackSelect = () => (
    <div>
      <div style={styles.metaLine}>Step 2 of 4</div>
      <h2 style={styles.h2}>Pick your track</h2>
      <p style={styles.bodyText}>
        Two different question sets, calibrated for different work. Choose what reflects most of your actual day-to-day, not your title.
      </p>
      <div
        style={{ ...styles.trackCard, borderLeftWidth: "3px", borderLeftStyle: "solid", borderLeftColor: COLORS.jungleeDeep }}
        onClick={() => { setTrack("engineering"); setStage("self-rating"); }}
        onMouseEnter={e => e.currentTarget.style.background = "#FFFFFF"}
        onMouseLeave={e => e.currentTarget.style.background = COLORS.bgDeep}
      >
        <div style={styles.metaLine}>Track A — Engineering</div>
        <div style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px", color: COLORS.ink }}>
          You write code or build systems.
        </div>
        <div style={{ fontSize: "13px", color: COLORS.inkSoft, lineHeight: 1.5 }}>
          Software engineers, ML engineers, DevOps, data engineers, technical PMs. Questions cover Gemini prompt engineering at the production level: agentic prompts, reasoning models, output contracts, evaluation. 18 questions, ~15 min.
        </div>
      </div>
      <div
        style={{ ...styles.trackCard, borderLeftWidth: "3px", borderLeftStyle: "solid", borderLeftColor: COLORS.edstellar }}
        onClick={() => { setTrack("layman"); setStage("self-rating"); }}
        onMouseEnter={e => e.currentTarget.style.background = "#FFFFFF"}
        onMouseLeave={e => e.currentTarget.style.background = COLORS.bgDeep}
      >
        <div style={styles.metaLine}>Track B — Everyone else</div>
        <div style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px", color: COLORS.ink }}>
          You work in Workspace daily.
        </div>
        <div style={{ fontSize: "13px", color: COLORS.inkSoft, lineHeight: 1.5 }}>
          Product, design, marketing, BI, customer support, trust &amp; safety, ops, managers, leaders. Questions cover Gemini in Workspace apps plus the standalone Gemini Enterprise app (Deep Research, NotebookLM, Gems). 16 questions, ~12 min.
        </div>
      </div>
      <div style={{ marginTop: "20px" }}>
        <button style={styles.secondaryBtn} onClick={() => setStage("name")}>Back</button>
      </div>
    </div>
  );

  // ---------- SELF-RATING ----------
  const renderSelfRating = () => (
    <div>
      <div style={styles.metaLine}>Step 3 of 4 — Calibration (not scored)</div>
      <h2 style={styles.h2}>Before you start, rate yourself.</h2>
      <p style={styles.bodyText}>
        How would you describe your own Gemini use right now? This isn't scored. It's compared against your result afterwards to flag overconfidence or underconfidence. Both are useful signals for cohort placement.
      </p>
      {SELF_RATING_OPTIONS.map(opt => (
        <button
          key={opt.value}
          style={{
            ...styles.cardOption,
            ...(selfRating === opt.value ? styles.cardOptionSelected : {})
          }}
          onClick={() => setSelfRating(opt.value)}
          onMouseEnter={e => { if (selfRating !== opt.value) e.currentTarget.style.background = "#FFFFFF"; }}
          onMouseLeave={e => { if (selfRating !== opt.value) e.currentTarget.style.background = COLORS.bgDeep; }}
        >
          <strong style={{ marginRight: "10px", color: COLORS.jungleeDeep }}>{opt.value}</strong>
          {opt.label}
        </button>
      ))}
      <div style={{ marginTop: "20px" }}>
        <button style={styles.secondaryBtn} onClick={() => setStage("track-select")}>Back</button>
        <button
          style={{ ...styles.primaryBtn, opacity: selfRating ? 1 : 0.4 }}
          disabled={!selfRating}
          onClick={() => { setStage("questions"); setCurrentIndex(0); }}
        >
          Start questions
        </button>
      </div>
    </div>
  );

  // ---------- QUESTIONS ----------
  const renderQuestions = () => {
    const q = questions[currentIndex];
    if (!q) return null;
    const selected = responses[q.id];
    const isLast = currentIndex === questions.length - 1;
    const hasAnswer = selected !== undefined;
    const hasCodeBlock = q.stem.includes("\n\ndef ") || q.stem.includes("\n\n```");

    return (
      <div>
        <div style={styles.metaLine}>
          {q.section === "knowledge" ? "Knowledge" : "Judgement"} · Question {currentIndex + 1}
        </div>
        <h2 style={{ ...styles.h2, fontSize: "18px", lineHeight: 1.4, marginBottom: "16px" }}>
          {hasCodeBlock ? q.stem.split("\n\n")[0] : q.stem}
        </h2>
        {hasCodeBlock && (
          <pre style={styles.prePre}>{q.stem.split("\n\n").slice(1, -1).join("\n\n")}</pre>
        )}
        {hasCodeBlock && (
          <p style={{ ...styles.bodyText, marginBottom: "16px" }}>{q.stem.split("\n\n").slice(-1)[0]}</p>
        )}
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            style={{
              ...styles.cardOption,
              ...(selected === idx ? styles.cardOptionSelected : {})
            }}
            onClick={() => setResponses({ ...responses, [q.id]: idx })}
            onMouseEnter={e => { if (selected !== idx) e.currentTarget.style.background = "#FFFFFF"; }}
            onMouseLeave={e => { if (selected !== idx) e.currentTarget.style.background = COLORS.bgDeep; }}
          >
            <strong style={{ marginRight: "10px", color: COLORS.jungleeDeep }}>
              {String.fromCharCode(65 + idx)}.
            </strong>
            {opt.text}
          </button>
        ))}
        <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between" }}>
          <button
            style={{ ...styles.secondaryBtn, opacity: currentIndex === 0 ? 0.4 : 1 }}
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(currentIndex - 1)}
          >
            ← Back
          </button>
          {!isLast && (
            <button
              style={{ ...styles.primaryBtn, opacity: hasAnswer ? 1 : 0.4 }}
              disabled={!hasAnswer}
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              Next →
            </button>
          )}
          {isLast && (
            <button
              style={{ ...styles.primaryBtn, opacity: hasAnswer ? 1 : 0.4 }}
              disabled={!hasAnswer}
              onClick={() => handleSubmit()}
            >
              Submit assessment
            </button>
          )}
        </div>
      </div>
    );
  };

  // ---------- HANDLE SUBMIT ----------
  const handleSubmit = async () => {
    const { kScore, kMax, jScore, jMax, kPct, jPct } = computeScores();
    const trackResult = determineTrack(kPct, jPct);
    const resultPayload = {
      id: `${participantName}-${Date.now()}`,
      participantName,
      participantRole,
      track,
      trackResult,
      selfRating,
      kScore, kMax, jScore, jMax, kPct, jPct,
      completedAt: Date.now(),
    };
    await api.saveResult(resultPayload);
    setStage("result");
  };

  // ---------- RESULT ----------
  const renderResult = () => {
    const { kScore, kMax, jScore, jMax, kPct, jPct } = computeScores();
    const trackResult = determineTrack(kPct, jPct);
    const td = TRACK_DESCRIPTIONS[trackResult];
    const highK = kPct >= 50;
    const highJ = jPct >= 50;

    let calibrationNote = null;
    if (selfRating === 5 && trackResult !== "advanced") {
      calibrationNote = "You rated yourself at the top of the scale, but the assessment placed you below Advanced. That's normal. The gap is most often in judgement, which is harder to self-assess than knowledge. Worth a look at your judgement score above.";
    } else if (selfRating === 1 && trackResult !== "foundation") {
      calibrationNote = "You rated yourself at the bottom of the scale, but the assessment placed you above Foundation. You're probably further along than you give yourself credit for.";
    }

    return (
      <div>
        <div style={styles.metaLine}>Result</div>
        <h2 style={{ ...styles.h2, fontSize: "28px", marginBottom: "8px" }}>
          {participantName}, you'd start in
        </h2>
        <h1 style={{ ...styles.h1, color: COLORS.jungleeDeep, marginBottom: "8px" }}>{td.name}</h1>
        <p style={{ ...styles.bodyText, fontSize: "13px", color: COLORS.inkMuted, marginBottom: "24px" }}>
          {td.duration}
        </p>

        {/* 2x2 grid */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.inkMuted, fontWeight: 600, marginBottom: "10px" }}>
            Where you landed
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: "1px", background: COLORS.rule, padding: "1px", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ background: COLORS.bg, padding: "10px 6px", fontSize: "10px", color: COLORS.inkMuted, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
            </div>
            <div style={{ background: COLORS.bg, padding: "10px 12px", fontSize: "10px", color: COLORS.inkMuted, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
              Low judgement
            </div>
            <div style={{ background: COLORS.bg, padding: "10px 12px", fontSize: "10px", color: COLORS.inkMuted, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
              High judgement
            </div>
            {/* High K row */}
            <div style={{ background: COLORS.bg, padding: "20px 6px", fontSize: "10px", color: COLORS.inkMuted, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              High knowledge
            </div>
            <div style={{ background: highK && !highJ ? COLORS.jungleeSoft : COLORS.bgDeep, padding: "20px 14px", minHeight: "80px" }}>
              <div style={{ fontSize: "10.5px", color: COLORS.inkSoft, fontWeight: 600, marginBottom: "4px" }}>Knowledge-led</div>
              <div style={{ fontSize: "10px", color: COLORS.inkMuted }}>6 weeks</div>
              {highK && !highJ && <div style={{ fontSize: "11px", color: COLORS.jungleeDeep, fontWeight: 700, marginTop: "8px" }}>← you</div>}
            </div>
            <div style={{ background: highK && highJ ? COLORS.jungleeSoft : COLORS.bgDeep, padding: "20px 14px", minHeight: "80px" }}>
              <div style={{ fontSize: "10.5px", color: COLORS.inkSoft, fontWeight: 600, marginBottom: "4px" }}>Advanced</div>
              <div style={{ fontSize: "10px", color: COLORS.inkMuted }}>4-week champion</div>
              {highK && highJ && <div style={{ fontSize: "11px", color: COLORS.jungleeDeep, fontWeight: 700, marginTop: "8px" }}>← you</div>}
            </div>
            {/* Low K row */}
            <div style={{ background: COLORS.bg, padding: "20px 6px", fontSize: "10px", color: COLORS.inkMuted, textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
              Low knowledge
            </div>
            <div style={{ background: !highK && !highJ ? COLORS.jungleeSoft : COLORS.bgDeep, padding: "20px 14px", minHeight: "80px" }}>
              <div style={{ fontSize: "10.5px", color: COLORS.inkSoft, fontWeight: 600, marginBottom: "4px" }}>Foundation</div>
              <div style={{ fontSize: "10px", color: COLORS.inkMuted }}>8 weeks</div>
              {!highK && !highJ && <div style={{ fontSize: "11px", color: COLORS.jungleeDeep, fontWeight: 700, marginTop: "8px" }}>← you</div>}
            </div>
            <div style={{ background: !highK && highJ ? COLORS.jungleeSoft : COLORS.bgDeep, padding: "20px 14px", minHeight: "80px" }}>
              <div style={{ fontSize: "10.5px", color: COLORS.inkSoft, fontWeight: 600, marginBottom: "4px" }}>Judgement-led</div>
              <div style={{ fontSize: "10px", color: COLORS.inkMuted }}>6 weeks</div>
              {!highK && highJ && <div style={{ fontSize: "11px", color: COLORS.jungleeDeep, fontWeight: 700, marginTop: "8px" }}>← you</div>}
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
          <div style={{ padding: "16px", background: COLORS.bgDeep, borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.inkMuted, fontWeight: 600, marginBottom: "4px" }}>
              Knowledge
            </div>
            <div style={{ fontSize: "26px", fontWeight: 600, color: COLORS.ink, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
              {kPct}<span style={{ fontSize: "14px", color: COLORS.inkMuted }}>%</span>
            </div>
            <div style={{ fontSize: "11px", color: COLORS.inkMuted, marginTop: "4px" }}>
              {kScore} of {kMax} points
            </div>
          </div>
          <div style={{ padding: "16px", background: COLORS.bgDeep, borderRadius: "6px" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.inkMuted, fontWeight: 600, marginBottom: "4px" }}>
              Judgement
            </div>
            <div style={{ fontSize: "26px", fontWeight: 600, color: COLORS.ink, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
              {jPct}<span style={{ fontSize: "14px", color: COLORS.inkMuted }}>%</span>
            </div>
            <div style={{ fontSize: "11px", color: COLORS.inkMuted, marginTop: "4px" }}>
              {jScore} of {jMax} points
            </div>
          </div>
        </div>

        {/* Track narrative */}
        <div style={{ padding: "16px 18px", background: COLORS.bgDeep, borderRadius: "6px", marginBottom: "16px" }}>
          <div style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.jungleeDeep, fontWeight: 600, marginBottom: "8px" }}>
            What this track does
          </div>
          <p style={{ fontSize: "14px", lineHeight: 1.55, color: COLORS.inkSoft, marginBottom: "10px" }}>{td.summary}</p>
          <div style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.jungleeDeep, fontWeight: 600, marginTop: "12px", marginBottom: "6px" }}>
            Watch for
          </div>
          <p style={{ fontSize: "13px", lineHeight: 1.55, color: COLORS.inkSoft, fontStyle: "italic" }}>{td.watchFor}</p>
        </div>

        {/* Calibration */}
        {calibrationNote && (
          <div style={{ padding: "12px 14px", background: COLORS.edstellarSoft, borderRadius: "6px", marginBottom: "16px", borderLeft: `3px solid ${COLORS.edstellar}` }}>
            <div style={{ fontSize: "10.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.edstellar, fontWeight: 600, marginBottom: "6px" }}>
              Calibration note
            </div>
            <p style={{ fontSize: "13px", lineHeight: 1.55, color: COLORS.ink }}>{calibrationNote}</p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ marginTop: "32px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button style={styles.secondaryBtn} onClick={() => setMethodologyOpen(!methodologyOpen)}>
            {methodologyOpen ? "Hide" : "See"} the methodology
          </button>
          <button style={styles.secondaryBtn} onClick={() => setStage("shared")}>
            See others' results
          </button>
          <button style={styles.primaryBtn} onClick={() => {
            setStage("start"); setParticipantName(""); setParticipantRole("");
            setTrack(null); setSelfRating(null); setResponses({}); setCurrentIndex(0);
          }}>
            Take it again
          </button>
        </div>

        {methodologyOpen && renderMethodology()}
      </div>
    );
  };

  // ---------- METHODOLOGY ----------
  const renderMethodology = () => (
    <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: `1px solid ${COLORS.rule}` }}>
      <h2 style={styles.h2}>How this works</h2>
      <p style={styles.bodyText}>
        Most enterprise AI assessments score a single dimension and route to three tracks. This one scores two: knowledge and judgement. Two people with the same total score often need completely different training.
      </p>
      <p style={styles.bodyText}>
        <strong>Knowledge questions</strong> are multiple choice with one correct answer. 1 point each. Tests whether you know what Gemini does: features, surfaces, model selection, prompt patterns.
      </p>
      <p style={styles.bodyText}>
        <strong>Judgement questions</strong> are scenarios with one best answer (2 pts), one acceptable answer (1 pt), and two poor answers (0 pts). Tests how you actually use what you know: verification, when not to use AI, evaluating output quality, spotting Workslop.
      </p>
      <p style={styles.bodyText}>
        The 50% threshold on each axis produces four tracks. We chose this over a single 70/40 split because it surfaces the high-knowledge / low-judgement pattern that most enterprise rollouts collapse into a misleading mid-score.
      </p>
      <p style={styles.bodyText}>
        <strong>The self-rating question</strong> at the start is not scored. It's compared to your result to flag overconfidence or underconfidence. Both useful signals for cohort placement.
      </p>
      <p style={{ ...styles.bodyText, fontStyle: "italic", color: COLORS.inkMuted }}>
        Full methodology, scoring rubrics for every question, and worked examples for each quadrant are in the assessment brief PDF.
      </p>
    </div>
  );

  // ---------- SHARED RESULTS ----------
  const renderShared = () => (
    <div>
      <div style={styles.metaLine}>Shared results</div>
      <h2 style={styles.h2}>Who else has taken this</h2>
      <p style={styles.bodyText}>
        Results from everyone who has taken the assessment so far. Useful for spotting patterns, and for the moment Bharti, Mihir, and Kalyani see they all landed in different quadrants.
      </p>
      {loadingResults ? (
        <p style={{ ...styles.bodyText, color: COLORS.inkMuted }}>Loading results…</p>
      ) : sharedResults.length === 0 ? (
        <p style={{ ...styles.bodyText, fontStyle: "italic" }}>No-one has finished it yet. Be first.</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {sharedResults.map((r, i) => {
            const td = TRACK_DESCRIPTIONS[r.trackResult];
            return (
              <div key={r.id || i} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "14px",
                padding: "12px 14px",
                marginBottom: "8px",
                background: COLORS.bgDeep,
                borderRadius: "4px",
                alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: COLORS.ink }}>
                    {r.participantName}
                    {r.participantRole && <span style={{ fontSize: "12px", color: COLORS.inkMuted, fontWeight: 400, marginLeft: "8px" }}>· {r.participantRole}</span>}
                  </div>
                  <div style={{ fontSize: "11px", color: COLORS.inkMuted, marginTop: "2px" }}>
                    {r.track === "engineering" ? "Engineering track" : "General track"} · K {r.kPct}% / J {r.jPct}%
                  </div>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.jungleeDeep, whiteSpace: "nowrap" }}>
                  {td ? td.name : r.trackResult}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop: "24px" }}>
        <button style={styles.secondaryBtn} onClick={() => setStage("start")}>← Back to start</button>
        <button style={styles.secondaryBtn} onClick={loadSharedResults}>Refresh</button>
      </div>
    </div>
  );

  // =====================================================================
  // MAIN RENDER
  // =====================================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {renderHeader()}
        {renderProgressBar()}
        {stage === "start" && renderStart()}
        {stage === "name" && renderName()}
        {stage === "track-select" && renderTrackSelect()}
        {stage === "self-rating" && renderSelfRating()}
        {stage === "questions" && renderQuestions()}
        {stage === "result" && renderResult()}
        {stage === "shared" && renderShared()}

        <div style={{ marginTop: "60px", paddingTop: "20px", borderTop: `1px solid ${COLORS.ruleSoft}`, fontSize: "11px", color: COLORS.inkMuted, textAlign: "center" }}>
          Junglee × Edstellar · AI Academy Capability Assessment · Sample build for Mihir Samir Verma, May 2026
        </div>
      </div>
    </div>
  );
}
