export type MatchedSkill = {
  skill: string;
  found_in_resume: string;
};

export type MissingCriticalSkill = {
  skill: string;
  importance: "must-have" | "nice-to-have";
  how_to_bridge: string;
};

export type MissingGoodToHaveSkill = {
  skill: string;
  suggestion: string;
};

export type AdjacentSkill = {
  you_have: string;
  bridges_to: string;
  how: string;
};

export type LearningPlanItem = {
  skill: string;
  resource: string;
  timeframe: string;
};

export type SkillsGapResult = {
  match_percentage: number;
  matched_skills: MatchedSkill[];
  missing_critical: MissingCriticalSkill[];
  missing_good_to_have: MissingGoodToHaveSkill[];
  adjacent_skills: AdjacentSkill[];
  quick_wins: string[];
  learning_plan: LearningPlanItem[];
};
