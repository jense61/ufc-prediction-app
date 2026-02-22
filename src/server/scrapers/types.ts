export type ScrapedFighterSnapshot = {
  name: string;
  record: string;
  age: string;
  height: string;
  reach: string;
};

export type ScrapedFightSnapshot = {
  division: string;
  isTitleFight: boolean;
  fighter1: ScrapedFighterSnapshot;
  fighter2: ScrapedFighterSnapshot;
};

export type ScrapedEventSnapshot = {
  name: string;
  date: Date;
  location: string;
  fights: ScrapedFightSnapshot[];
};

export type ScrapedResultFight = {
  fighter1Name: string;
  fighter2Name: string;
  winner: string | null;
  method: string;
  isDraw: boolean;
  isNoContest: boolean;
  isOverturned: boolean;
};

export type ScrapedEventResults = {
  eventName: string;
  eventDate: Date;
  fights: ScrapedResultFight[];
};