import { logger } from "./colorLogger";

interface UsageRecord {
  service: string;
  model: string;
  tokens: number;
  cost: number;
}

export class TokenBudget {
  private transactions = 0;
  private tokensUsed = 0;
  private costAccrued = 0;
  private override = false;
  private readonly freeTokens: number;
  private readonly budgetLimit: number;

  constructor() {
    this.freeTokens = parseInt(process.env.AI_FREE_TOKENS || "0", 10);
    this.budgetLimit = parseFloat(process.env.AI_BUDGET_LIMIT || "0");
  }

  recordUsage(record: UsageRecord) {
    this.transactions += 1;

    const prevTokens = this.tokensUsed;
    this.tokensUsed += record.tokens;

    // Calculate billable tokens taking free cap into account
    const freeRemaining = Math.max(0, this.freeTokens - prevTokens);
    const billableTokens = Math.max(0, record.tokens - freeRemaining);
    const costPerToken = record.cost / Math.max(record.tokens, 1);
    this.costAccrued += billableTokens * costPerToken;

    logger.chatgpt(
      `Usage recorded: ${record.tokens} tokens, ${billableTokens} billable, total cost $${this.costAccrued.toFixed(
        4
      )}`
    );
  }

  getStatus() {
    return {
      transactions: this.transactions,
      tokensUsed: this.tokensUsed,
      cost: this.costAccrued,
      freeTokens: this.freeTokens,
      budgetLimit: this.budgetLimit,
      override: this.override,
    };
  }

  shouldHalt() {
    return !this.override && this.budgetLimit > 0 && this.costAccrued >= this.budgetLimit;
  }

  setOverride(value: boolean) {
    this.override = value;
  }
}

export const tokenBudget = new TokenBudget();
