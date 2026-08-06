/**
 * @file thinkingTimer.ts
 * @description Continuous time tracker for model reasoning and thinking phase.
 * Supports pausing and resuming without losing accumulated elapsed time during user confirmation.
 */

export class ActiveThinkingTimer {
  private startTime: number | null = null;
  private finalDurationMs: number | null = null;
  private accumulatedMs: number = 0;
  private isPaused: boolean = false;

  /**
   * Called when model begins active thinking / reasoning phase.
   */
  public start(): void {
    if (this.startTime === null && !this.isPaused) {
      this.startTime = Date.now();
      this.finalDurationMs = null;
    }
  }

  /**
   * Called when awaiting user approval or explicitly pausing the timer.
   * Freezes accumulated time and halts the active clock.
   */
  public pause(): void {
    if (this.startTime !== null && !this.isPaused) {
      this.accumulatedMs += Date.now() - this.startTime;
      this.startTime = null;
      this.isPaused = true;
    }
  }

  /**
   * Called when user approval is received or timer resumes execution.
   */
  public resume(): void {
    if (this.isPaused || this.startTime === null) {
      this.startTime = Date.now();
      this.isPaused = false;
      this.finalDurationMs = null;
    }
  }

  /**
   * Called when thinking phase completes (e.g., turn finishes).
   */
  public stop(): number {
    if (this.startTime !== null && !this.isPaused) {
      this.accumulatedMs += Date.now() - this.startTime;
    }
    this.startTime = null;
    this.isPaused = false;
    this.finalDurationMs = this.accumulatedMs;
    return this.finalDurationMs;
  }

  /**
   * Returns current total elapsed thinking/execution time in milliseconds.
   */
  public getDurationMs(): number {
    if (this.finalDurationMs !== null) {
      return this.finalDurationMs;
    }
    if (this.startTime !== null && !this.isPaused) {
      return this.accumulatedMs + (Date.now() - this.startTime);
    }
    return this.accumulatedMs;
  }

  /**
   * Returns whether thinking/execution phase is actively running right now.
   */
  public isStreaming(): boolean {
    return this.startTime !== null && !this.isPaused;
  }
}
