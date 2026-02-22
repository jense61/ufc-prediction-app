import { differenceInYears, parse } from "date-fns";
import { load } from "cheerio";
import puppeteer from "puppeteer";
import { isWithinNextDaysBrussels } from "@/lib/time";
import { isNumberedUfcEvent } from "@/lib/utils";
import type {
  ScrapedEventResults,
  ScrapedEventSnapshot,
  ScrapedFightSnapshot,
  ScrapedFighterSnapshot,
  ScrapedResultFight
} from "@/server/scrapers/types";

type UpcomingEventCandidate = {
  name: string;
  date: Date;
  url: string;
};

const UFC_STATS_UPCOMING_URL = "http://ufcstats.com/statistics/events/upcoming";
const UFC_STATS_COMPLETED_URL = "http://ufcstats.com/statistics/events/completed?page=all";
const onlyNumbered = (process.env.ONLY_NUMBERED ?? "true").toLowerCase() !== "false";

const UNKNOWN = "Unknown";

const parseDateLoose = (input: string) => {
  const direct = new Date(input);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  const parsed = parse(input, "MMMM d, yyyy", new Date());
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  throw new Error(`Unable to parse date: ${input}`);
};

const tryParseDateLoose = (input: string): Date | null => {
  try {
    return parseDateLoose(input);
  } catch {
    return null;
  }
};

const getFirstParsableDateFromRow = (cells: string[]) => {
  for (const cellText of cells) {
    const parsed = tryParseDateLoose(cellText);
    if (parsed) {
      return parsed;
    }
  }
  return null;
};

type CheerioInput = Parameters<ReturnType<typeof load>>[0];

const parseEventCandidateFromRow = ($: ReturnType<typeof load>, row: CheerioInput) => {
  const rowNode = $(row);
  const anchor = rowNode.find("td").first().find("a.b-link").first();
  const name = cleanText(anchor.text());
  const url = anchor.attr("href") || "";

  if (!name || !url) {
    return null;
  }

  const explicitDateText = cleanText(rowNode.find("td").first().find("span.b-statistics__date").first().text());
  const explicitDate = explicitDateText ? tryParseDateLoose(explicitDateText) : null;

  if (explicitDate) {
    return { name, date: explicitDate, url };
  }

  const firstCellText = cleanText(rowNode.find("td").first().text());
  const fallbackDate = getFirstParsableDateFromRow([firstCellText]);
  if (!fallbackDate) {
    return null;
  }

  return { name, date: fallbackDate, url };
};

const isSpecialOutcome = (winner: string | null, method: string) => {
  const normalizedMethod = method.toLowerCase();
  const noContest = normalizedMethod.includes("no contest");
  const overturned = normalizedMethod.includes("overturned");
  const draw = winner === null && !noContest && !overturned;
  return { draw, noContest, overturned };
};

const isWinnerToken = (value: string) => {
  const normalized = value.toLowerCase();
  return normalized === "w" || normalized === "win";
};

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();
const shouldIncludeEvent = (eventName: string) => !onlyNumbered || isNumberedUfcEvent(eventName);

async function fetchHtml(url: string): Promise<string> {
  try {
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      return await page.content();
    } finally {
      await browser.close();
    }
  } catch {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    return await response.text();
  }
}

async function scrapeFighterProfile(url: string, fallbackName: string): Promise<ScrapedFighterSnapshot> {
  try {
    const html = await fetchHtml(url);
    const $ = load(html);

    const name = cleanText($(".b-content__title-highlight").first().text()) || fallbackName;
    const recordText = cleanText($(".b-content__title-record").first().text());
    const record = recordText.replace(/^Record:\s*/i, "").trim() || UNKNOWN;

    const getProfileInfoValue = (label: string) => {
      const items = $(".b-list__info-box_style_small-width .b-list__box-list-item").toArray();
      for (const item of items) {
        const labelText = cleanText($(item).find(".b-list__box-item-title").first().text())
          .replace(":", "")
          .trim()
          .toLowerCase();

        if (labelText !== label.toLowerCase()) {
          continue;
        }

        const fullText = cleanText($(item).text());
        return cleanText(fullText.replace(new RegExp(`^${label}\\s*:`, "i"), ""));
      }

      return "";
    };

    const details = $(".b-list__box-list-item").toArray();
    const detailMap = new Map<string, string>();

    for (const item of details) {
      const text = cleanText($(item).text());
      const [label, ...rest] = text.split(":");
      if (label && rest.length > 0) {
        detailMap.set(label.toLowerCase(), cleanText(rest.join(":")));
      }
    }

    const height = getProfileInfoValue("Height") || detailMap.get("height") || UNKNOWN;
    const reach = getProfileInfoValue("Reach") || detailMap.get("reach") || UNKNOWN;
    const dob = getProfileInfoValue("DOB") || detailMap.get("dob") || "";

    let age = UNKNOWN;
    if (dob) {
      const dobDate = parseDateLoose(dob);
      if (!Number.isNaN(dobDate.getTime())) {
        age = String(differenceInYears(new Date(), dobDate));
      }
    }

    return {
      name,
      record,
      age,
      height,
      reach
    };
  } catch {
    return {
      name: fallbackName,
      record: UNKNOWN,
      age: UNKNOWN,
      height: UNKNOWN,
      reach: UNKNOWN
    };
  }
}

async function scrapeFightSnapshot(fightUrl: string, division: string, isTitleFight: boolean) {
  const html = await fetchHtml(fightUrl);
  const $ = load(html);

  const fighterAnchors = $(".b-fight-details__person-name a").toArray().slice(0, 2);

  if (fighterAnchors.length < 2) {
    throw new Error(`Unable to parse fighters from fight page: ${fightUrl}`);
  }

  const fighter1Name = cleanText($(fighterAnchors[0]).text());
  const fighter2Name = cleanText($(fighterAnchors[1]).text());

  const fighter1ProfileUrl = $(fighterAnchors[0]).attr("href") || "";
  const fighter2ProfileUrl = $(fighterAnchors[1]).attr("href") || "";

  const [fighter1, fighter2] = await Promise.all([
    scrapeFighterProfile(fighter1ProfileUrl, fighter1Name),
    scrapeFighterProfile(fighter2ProfileUrl, fighter2Name)
  ]);

  return {
    division,
    isTitleFight,
    fighter1,
    fighter2
  } satisfies ScrapedFightSnapshot;
}

async function scrapeEventFightCard(candidate: UpcomingEventCandidate): Promise<ScrapedEventSnapshot> {
  const html = await fetchHtml(candidate.url);
  const $ = load(html);

  const location = cleanText($(".b-list__box-list-item:contains('Location:')").text().replace("Location:", "")) || UNKNOWN;

  const rows = $(".b-fight-details__table tbody tr").toArray().slice(0, 5);
  const fights: ScrapedFightSnapshot[] = [];

  for (const row of rows) {
    const rowNode = $(row);
    const onclick = rowNode.attr("onclick") || "";
    const onclickMatch = onclick.match(/doNav\('([^']+)'\)/);
    const fightUrl =
      rowNode.attr("data-link") ||
      onclickMatch?.[1] ||
      rowNode.find("a[data-link]").attr("data-link") ||
      rowNode.find("a.b-flag").attr("href") ||
      "";

    if (!fightUrl) {
      continue;
    }

    const division = cleanText(rowNode.find("td").eq(6).text()) || UNKNOWN;
    const boutType = cleanText(rowNode.find("td").eq(7).text());
    const hasBeltIcon = rowNode.find("td").eq(6).find("img[src*='belt']").length > 0;
    const isTitleFight = hasBeltIcon || /title/i.test(boutType) || /title/i.test(division);
    fights.push(await scrapeFightSnapshot(fightUrl, division, isTitleFight));
  }

  return {
    name: candidate.name,
    date: candidate.date,
    location,
    fights
  };
}

async function scrapeUpcomingCandidates(): Promise<UpcomingEventCandidate[]> {
  const html = await fetchHtml(UFC_STATS_UPCOMING_URL);
  const $ = load(html);
  const rows = $("table.b-statistics__table-events tbody tr.b-statistics__table-row").toArray();

  const candidates: UpcomingEventCandidate[] = [];

  for (const row of rows) {
    const candidate = parseEventCandidateFromRow($, row);
    if (!candidate) {
      continue;
    }

    const { name, date, url } = candidate;

    if (!shouldIncludeEvent(name)) {
      continue;
    }

    candidates.push({ name, date, url });
  }

  return candidates;
}

async function scrapeLatestCompletedNumberedEvent(): Promise<UpcomingEventCandidate | null> {
  const html = await fetchHtml(UFC_STATS_COMPLETED_URL);
  const $ = load(html);
  const rows = $("table.b-statistics__table-events tbody tr.b-statistics__table-row").toArray();

  for (const row of rows) {
    const candidate = parseEventCandidateFromRow($, row);
    if (!candidate) {
      continue;
    }

    const { name, date, url } = candidate;

    if (!shouldIncludeEvent(name)) {
      continue;
    }

    const daysFromNow = Math.abs((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysFromNow <= 2) {
      return { name, date, url };
    }
  }

  return null;
}

async function scrapeCompletedEventResults(candidate: UpcomingEventCandidate): Promise<ScrapedEventResults> {
  const html = await fetchHtml(candidate.url);
  const $ = load(html);
  const rows = $(".b-fight-details__table tbody tr").toArray().slice(0, 5);

  const fights: ScrapedResultFight[] = [];

  for (const row of rows) {
    const rowNode = $(row);
    const fighterLinks = rowNode.find("td").eq(1).find("a").toArray();
    if (fighterLinks.length < 2) {
      continue;
    }

    const fighter1Name = cleanText($(fighterLinks[0]).text());
    const fighter2Name = cleanText($(fighterLinks[1]).text());

    const status1 = cleanText(rowNode.find("td").eq(0).find("p").eq(0).text());
    const status2 = cleanText(rowNode.find("td").eq(0).find("p").eq(1).text());
    const method = cleanText(rowNode.find("td").eq(7).text()) || UNKNOWN;

    let winner: string | null = null;
    if (isWinnerToken(status1)) {
      winner = fighter1Name;
    } else if (isWinnerToken(status2)) {
      winner = fighter2Name;
    }

    const special = isSpecialOutcome(winner, method);

    fights.push({
      fighter1Name,
      fighter2Name,
      winner,
      method,
      isDraw: special.draw,
      isNoContest: special.noContest,
      isOverturned: special.overturned
    });
  }

  return {
    eventName: candidate.name,
    eventDate: candidate.date,
    fights
  };
}

export class UfcScraper {
  async getUpcomingNumberedEventWithin7Days(): Promise<ScrapedEventSnapshot | null> {
    const candidates = await scrapeUpcomingCandidates();
    const selected = candidates.find((candidate) => isWithinNextDaysBrussels(candidate.date, 7));

    if (!selected) {
      return null;
    }

    return scrapeEventFightCard(selected);
  }

  async getLatestNumberedEventResults(): Promise<ScrapedEventResults | null> {
    const latest = await scrapeLatestCompletedNumberedEvent();
    if (!latest) {
      return null;
    }

    return scrapeCompletedEventResults(latest);
  }
}