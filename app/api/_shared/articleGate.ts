/**
 * Gate: LLMagnet only accepts real news / business journalism drafts.
 * Rejects gibberish, Wikipedia dumps, social posts, product copy, and other
 * non-editorial pastes. Invalid input surfaces as ENTER A VALID PROMPT LINK.
 */

import OpenAI from 'openai';
import https from 'https';

export const INVALID_INPUT_MESSAGE = 'ENTER A VALID PROMPT LINK';

export type ArticleGateFailure = {
  ok: false;
  code:
    | 'TOO_SHORT'
    | 'NO_HEADLINE'
    | 'GIBBERISH'
    | 'NOT_NEWS_ARTICLE'
    | 'EMPTY'
    | 'WIKIPEDIA_OR_REFERENCE'
    | 'SOCIAL_OR_POST';
  message: string;
};

export type ArticleGateSuccess = { ok: true };

export type ArticleGateResult = ArticleGateSuccess | ArticleGateFailure;

const MIN_BODY_CHARS = 350;
const MIN_WORDS = 60;
const MIN_HEADLINE = 8;

/** Product citeability band — honest mid-high newsroom scores, not 0–100 theatre. */
export const CITE_SCORE_MIN = 60;
export const CITE_SCORE_MAX = 85;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function invalid(
  code: ArticleGateFailure['code'],
  detail?: string
): ArticleGateFailure {
  return {
    ok: false,
    code,
    message: detail
      ? `${INVALID_INPUT_MESSAGE} — ${detail}`
      : INVALID_INPUT_MESSAGE,
  };
}

/** Keyboard mash / nonsense detectors (best-effort). */
function looksLikeGibberish(text: string): boolean {
  const sample = text.replace(/\s+/g, ' ').trim().slice(0, 1200);
  if (!sample) return true;

  const letters = sample.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 40) return true;

  const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;
  const vowelRatio = vowels / letters.length;
  if (vowelRatio < 0.22 || vowelRatio > 0.55) return true;

  if (/(.)\1{6,}/.test(sample)) return true;

  const spaces = (sample.match(/ /g) || []).length;
  if (sample.length > 200 && spaces / sample.length < 0.08) return true;

  if (/lorem ipsum|asdfgh|qwerty|test test test|xxx xxx|foo bar baz/i.test(sample)) {
    return true;
  }

  const nonLetter = sample.replace(/[a-zA-Z0-9\s.,'"’“”-]/g, '');
  if (nonLetter.length / sample.length > 0.35) return true;

  return false;
}

/** Wikipedia / encyclopedia dumps pasted as "articles". */
function looksLikeWikipediaOrReference(headline: string, body: string): boolean {
  const text = `${headline}\n${body}`;
  const sample = text.slice(0, 4000);

  if (
    /wikipedia\.org|from wikipedia|the free encyclopedia|\[\[.+?\]\]|\{\|.+?\|\}|disambiguation page/i.test(
      sample
    )
  ) {
    return true;
  }

  // Encyclopedia lede: "X is a Y that…" without news reporting texture
  const encyclopedicLede =
    /\b[A-Z][a-zA-Z0-9 .,'-]{2,80}\bis (?:a|an|the)\b.{10,120}\b(?:that|which|who)\b/i.test(
      sample.slice(0, 500)
    );
  const hasNewsTexture =
    /\b(said|announced|reported|according to|raised|launched|told|confirmed|filed|sued|acquired)\b/i.test(
      sample
    );
  const wikiVoice =
    /\b(see also|references|external links|further reading|coordinates:|born\s+\d{1,2}\s+\w+\s+\d{4})\b/i.test(
      sample
    );

  if (wikiVoice) return true;
  if (encyclopedicLede && !hasNewsTexture && wordCount(body) > 80) return true;

  return false;
}

/** LinkedIn / X / Facebook-style posts, not reported articles. */
function looksLikeSocialOrPost(headline: string, body: string): boolean {
  const text = `${headline}\n${body}`;
  const words = wordCount(body);
  const sample = text.slice(0, 2500);

  const hashtagCount = (sample.match(/#\w+/g) || []).length;
  const emojiHeavy = (sample.match(/[\u{1F300}-\u{1FAFF}]/gu) || []).length >= 4;
  const postPhrases =
    /\b(excited to (?:share|announce)|thrilled to|just posted|thoughts\?|link in bio|dm me| congrats to|proud to share|hiring alert|we'?re live!)\b/i.test(
      sample
    );
  const threadMarkers =
    /\b(1\/\d+|thread\s*👇|🧵|(?:^|\n)\d+\/\d+)/im.test(sample);
  const shortOpinion =
    words < 180 &&
    /\b(imo|tbh|hot take|unpopular opinion|here'?s why|let that sink in)\b/i.test(sample);

  if (hashtagCount >= 4) return true;
  if (emojiHeavy && words < 250) return true;
  if (postPhrases) return true;
  if (threadMarkers && words < 400) return true;
  if (shortOpinion) return true;

  return false;
}

/** Heuristic: does this read like a news / business article? */
function looksLikeNewsArticle(headline: string, body: string): boolean {
  const text = `${headline}\n${body}`;
  const words = wordCount(body);

  const caps = (text.match(/\b[A-Z][a-zA-Z]{2,}\b/g) || []).length;
  const numbers = (text.match(/\b\d[\d,]*(?:\.\d+)?%?\b/g) || []).length;
  const newsVerbs =
    /\b(said|announced|raised|launched|reported|according|investors?|startup|funding|market|company|ceo|founded|acquired|filed|regulator|ministry|government|told|confirmed|valued|partners?|series\s+[a-f]|crore|rupee|usd)\b/i.test(
      text
    );

  const nonNews =
    /\b(function\s*\(|const\s+\w+\s*=|import\s+\{|SELECT\s+.+FROM|ingredients:|preheat oven|dear sir\/madam|homework assignment|terms of service|privacy policy|cookie policy|add to cart|sku:)\b/i.test(
      text
    );

  if (nonNews) return false;
  if (words < MIN_WORDS) return false;

  // Long reported drafts: allow slightly softer entity threshold
  if (words >= 120 && caps >= 3 && (numbers >= 1 || newsVerbs)) return true;
  if (caps < 4) return false;
  if (numbers < 1 && !newsVerbs) return false;
  return true;
}

/**
 * Fast sync gate — rejects obvious non-articles before any model spend.
 */
export function gateNewsArticle(heading: string, content: string): ArticleGateResult {
  const headline = (heading || '').trim();
  const body = (content || '').trim();

  if (!body) {
    return invalid(
      'EMPTY',
      'paste a news article draft or a published article URL. This desk only works on editorial journalism.'
    );
  }

  if (headline.length < MIN_HEADLINE) {
    return invalid(
      'NO_HEADLINE',
      'add a clear news headline. Untitled notes and social captions are not scored.'
    );
  }

  if (body.length < MIN_BODY_CHARS || wordCount(body) < MIN_WORDS) {
    return invalid(
      'TOO_SHORT',
      `this looks too short for a news article (need roughly ${MIN_WORDS}+ words). Paste the full draft.`
    );
  }

  // Headline-only mash (don't use the full body letter-count rules on short titles)
  if (/(.)\1{5,}/.test(headline) || /asdfgh|qwerty|lorem ipsum|xxx xxx/i.test(headline)) {
    return invalid(
      'GIBBERISH',
      'this doesn’t read as article copy (possible gibberish or keyboard mash).'
    );
  }

  if (looksLikeGibberish(body)) {
    return invalid(
      'GIBBERISH',
      'this doesn’t read as article copy (possible gibberish or keyboard mash).'
    );
  }

  if (looksLikeWikipediaOrReference(headline, body)) {
    return invalid(
      'WIKIPEDIA_OR_REFERENCE',
      'this looks like a Wikipedia / encyclopedia dump or reference page, not an original news article.'
    );
  }

  if (looksLikeSocialOrPost(headline, body)) {
    return invalid(
      'SOCIAL_OR_POST',
      'this reads like a social post, thread, or announcement — not a reported news article.'
    );
  }

  if (!looksLikeNewsArticle(headline, body)) {
    return invalid(
      'NOT_NEWS_ARTICLE',
      'LLMagnet only scores news / business journalism (reported pieces with entities, facts, and a news lede).'
    );
  }

  return { ok: true };
}

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      httpAgent: new https.Agent({ rejectUnauthorized: false }),
    });
  }
  return client;
}

export type ContentKind =
  | 'news_article'
  | 'wikipedia_or_encyclopedia'
  | 'social_post'
  | 'product_or_marketing'
  | 'code_or_docs'
  | 'essay_or_opinion_without_reporting'
  | 'gibberish_or_nonsense'
  | 'other_non_editorial';

/**
 * Intelligent second pass — OpenAI classifies whether the paste is a real
 * editorial news article. Used by scoring / desk routes so borderline dumps
 * (Wikipedia-in-a-LinkedIn-post, soft PR fluff, etc.) still get rejected.
 */
export async function classifyEditorialContent(
  heading: string,
  content: string
): Promise<ArticleGateResult & { kind?: ContentKind; reason?: string }> {
  const sync = gateNewsArticle(heading, content);
  if (!sync.ok) return sync;

  const openai = getClient();
  if (!openai) {
    // No key: trust sync heuristics only
    return { ok: true };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: `You are the intake editor for a newsroom product that ONLY accepts real news / business journalism drafts.

Classify this paste. Be strict but fair.

ACCEPT only if it is a reported or draft news article (startup/business/markets/policy/company news) with journalistic texture: lede, named entities, attributed or attributable facts, news verbs.

REJECT if it is any of:
- Wikipedia / encyclopedia / wiki dump (even if someone pasted it into a "post")
- LinkedIn / X / Instagram / Facebook post, thread, or caption
- Product landing page, marketing blurb, press-release boilerplate without reporting
- Code, homework, recipes, legal boilerplate
- Pure opinion/essay with no reporting
- Gibberish, keyboard mash, placeholder, or unrelated non-editorial text

HEADLINE: ${heading.trim()}
BODY:
${content.trim().slice(0, 7000)}

Return ONLY JSON:
{
  "accept": boolean,
  "kind": "news_article" | "wikipedia_or_encyclopedia" | "social_post" | "product_or_marketing" | "code_or_docs" | "essay_or_opinion_without_reporting" | "gibberish_or_nonsense" | "other_non_editorial",
  "reason": "one polite sentence explaining the call"
}

If accept is false, the product will show: "${INVALID_INPUT_MESSAGE}"`,
        },
      ],
    });

    const raw = JSON.parse(completion.choices[0].message.content || '{}') as {
      accept?: boolean;
      kind?: ContentKind;
      reason?: string;
    };

    if (raw.accept === true && raw.kind === 'news_article') {
      return { ok: true, kind: 'news_article', reason: raw.reason };
    }

    const kind = raw.kind || 'other_non_editorial';
    const code: ArticleGateFailure['code'] =
      kind === 'gibberish_or_nonsense'
        ? 'GIBBERISH'
        : kind === 'wikipedia_or_encyclopedia'
          ? 'WIKIPEDIA_OR_REFERENCE'
          : kind === 'social_post'
            ? 'SOCIAL_OR_POST'
            : 'NOT_NEWS_ARTICLE';

    return {
      ...invalid(
        code,
        raw.reason ||
          'OpenAI classified this paste as non-editorial. Please provide a real news article draft or URL.'
      ),
      kind,
      reason: raw.reason,
    };
  } catch {
    // Classifier failure: fall back to sync pass (already ok)
    return { ok: true };
  }
}

/** Clamp citeability scores into the honest product band (60–85). */
export function clampCiteScore(n: number): number {
  const rounded = Math.round(n);
  return Math.min(CITE_SCORE_MAX, Math.max(CITE_SCORE_MIN, rounded));
}
