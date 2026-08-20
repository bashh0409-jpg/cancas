/**
 * ⚡ CREDITS PRICING CONFIGURATION
 * 
 * This is the single source of truth for all credit costs and plan allocations.
 * Update values here to change pricing across the entire application.
 * 
 * DO NOT hardcode credit values elsewhere - always import from this file.
 */

/**
 * Cost of each AI operation in credits
 * These represent the compute/resource cost of each feature
 */
export const OPERATION_COSTS = {
  /** Remove background from an image */
  REMOVE_BACKGROUND: 4,
  
  /** Upscale an image to higher resolution */
  UPSCALE: 10,
} as const;

/**
 * Monthly credit allocation per subscription plan
 * Renews monthly for active subscriptions
 */
export const PLAN_MONTHLY_CREDITS = {
  free: 100,
  starter: 1000,
  pro: 2500,
  ultra: 5000,
} as const;

/**
 * Plan display information
 */
export const PLAN_DETAILS = {
  free: {
    name: "Free",
    displayName: "Free Plan",
    monthlyCredits: PLAN_MONTHLY_CREDITS.free,
  },
  starter: {
    name: "Starter",
    displayName: "Starter Plan",
    monthlyCredits: PLAN_MONTHLY_CREDITS.starter,
  },
  pro: {
    name: "Pro",
    displayName: "Pro Plan",
    monthlyCredits: PLAN_MONTHLY_CREDITS.pro,
  },
  ultra: {
    name: "Ultra",
    displayName: "Ultra Plan",
    monthlyCredits: PLAN_MONTHLY_CREDITS.ultra,
  },
} as const;

/**
 * Get the cost of a specific operation
 * @param operation - The operation to get the cost for
 * @returns The credit cost
 */
export function getOperationCost(
  operation: keyof typeof OPERATION_COSTS
): number {
  return OPERATION_COSTS[operation];
}

/**
 * Get monthly credits for a subscription plan
 * @param plan - The subscription plan
 * @returns The monthly credit allocation
 */
export function getPlanCredits(plan: keyof typeof PLAN_MONTHLY_CREDITS): number {
  return PLAN_MONTHLY_CREDITS[plan];
}

/**
 * Calculate how many times a user can perform an operation with their current credits
 * @param credits - User's available credits
 * @param operation - The operation to check
 * @returns Number of times the operation can be performed
 */
export function calculateOperationCount(
  credits: number,
  operation: keyof typeof OPERATION_COSTS
): number {
  return Math.floor(credits / getOperationCost(operation));
}

/**
 * Get a human-readable description of what an operation costs
 * @param operation - The operation
 * @returns A formatted string like "4 credits"
 */
export function formatOperationCost(operation: keyof typeof OPERATION_COSTS): string {
  const cost = getOperationCost(operation);
  return `${cost} credit${cost !== 1 ? "s" : ""}`;
}

/**
 * Estimate credit requirements for multiple operations
 * @param operations - Array of operations to perform
 * @returns Total credits needed
 */
export function estimateTotalCost(
  operations: Array<keyof typeof OPERATION_COSTS>
): number {
  return operations.reduce((total, op) => total + getOperationCost(op), 0);
}

/**
 * Type exports for use throughout the application
 */
export type OperationType = keyof typeof OPERATION_COSTS;
export type PlanType = keyof typeof PLAN_MONTHLY_CREDITS;
