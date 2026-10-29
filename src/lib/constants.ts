// Single-user MVP: every query is scoped to this id, so moving to real auth
// later only means swapping this constant for the session user's id.
export const DEFAULT_USER_ID = "local-user";

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
