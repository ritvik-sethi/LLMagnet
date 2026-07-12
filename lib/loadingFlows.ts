/** Per-pipeline loading copy — immersive, stage-specific. */

export type LoadingFlowId =
  | 'score'
  | 'live'
  | 'suggest'
  | 'rewrite'
  | 'competitors'
  | 'semantic'
  | 'queries'
  | 'trends';

export interface LoadingFlow {
  title: string;
  stages: string[];
}

/** ~40 article-desk verbs — shuffled randomly, each shown ~5s. */
export const EDITORIAL_VERBS: string[] = [
  'Tinkering',
  'Galvanizing',
  'Burnishing',
  'Densifying',
  'Workshopping',
  'Sharpening',
  'Fact-weaving',
  'Pulse-checking',
  'Angle-hunting',
  'Line-editing',
  'Scoop-sniffing',
  'Cite-testing',
  'Lede-tightening',
  'Nut-grafing',
  'Source-chasing',
  'Quote-mining',
  'Rival-reading',
  'Gap-hunting',
  'Stress-testing',
  'Probe-running',
  'Entity-mapping',
  'Fan-out mapping',
  'Trust-weighing',
  'Claim-hardening',
  'Context-layering',
  'Stakes-raising',
  'Hook-finding',
  'Kicker-crafting',
  'Byline-proofing',
  'Attribution-checking',
  'Timeline-sorting',
  'Number-crunching',
  'Narrative-pulling',
  'Machine-reading',
  'Human-proofing',
  'Desk-passing',
  'Copy-tasting',
  'Freshness-checking',
  'Outflanking',
  'Sense-making',
];

export function shuffleVerbs(seed = Date.now()): string[] {
  const list = [...EDITORIAL_VERBS];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = list.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export const LOADING_FLOWS: Record<LoadingFlowId, LoadingFlow> = {
  score: {
    title: 'Scoring citeability',
    stages: [
      'Reading your headline and lede',
      'Running a live OpenAI citation probe',
      'Weighing Experience, Expertise, Authoritativeness, and Trust',
      'Asking whether an answer engine would quote this piece',
      'Opening reader and machine views side by side',
    ],
  },
  live: {
    title: 'Checking the news cycle',
    stages: [
      'Rephrasing the story for live search',
      'Pulling fresh posts from X',
      'Scanning Reddit threads for sentiment',
      'Collecting questions readers are Googling',
      'Mapping what other outlets already covered',
    ],
  },
  suggest: {
    title: 'Building edit advice',
    stages: [
      'Loading your Live check snapshot',
      'Matching SOCIAL signals to draft passages',
      'Ranking human-story opportunities',
      'Ranking citation opportunities for AI answers',
      'Writing one reconciled next edit',
    ],
  },
  rewrite: {
    title: 'Polishing the article',
    stages: [
      'Extracting claims that need verification',
      'Searching the web for each claim',
      'Reading source pages for denser facts',
      'Honouring prior Live check and Advice',
      'Rewriting in an Indian business-news voice',
    ],
  },
  competitors: {
    title: 'Comparing rival coverage',
    stages: [
      'Reverse-engineering Google and LLM searches',
      'Finding rival articles outside your source site',
      'Reading competing pieces in depth',
      'Comparing facts, angles, and quotable lines',
      'Prioritizing gaps against prior advice',
    ],
  },
  semantic: {
    title: 'Scoring semantic fit',
    stages: [
      'Mapping named entities in the draft',
      'Tracing who did what to whom',
      'Checking hierarchy and extractable structure',
      'Testing fan-out query coverage',
      'Opening reader and machine views',
    ],
  },
  queries: {
    title: 'Mapping target queries',
    stages: [
      'Mining claims that could win citations',
      'Drafting questions a reader would ask',
      'Drafting questions an AI would answer',
      'Ranking citation potential per query',
      'Opening reader and machine views',
    ],
  },
  trends: {
    title: 'Finding angles',
    stages: [
      'Reading the draft for latent angles',
      'Checking what feels timely right now',
      'Separating human-story hooks from citeable frames',
      'Ranking angles by urgency and fit',
      'Opening reader and machine views',
    ],
  },
};
