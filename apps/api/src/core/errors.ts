export class OrderNotFoundError extends Error {
  constructor(readonly orderId: string) {
    super(`Order ${orderId} not found`);
    this.name = 'OrderNotFoundError';
  }
}

export class DeadLetterNotFoundError extends Error {
  constructor(readonly deadLetterId: string) {
    super(`Dead letter ${deadLetterId} not found`);
    this.name = 'DeadLetterNotFoundError';
  }
}

export class DeadLetterAlreadyReplayedError extends Error {
  constructor(
    readonly deadLetterId: string,
    readonly replayedAt: string,
  ) {
    super(`Dead letter ${deadLetterId} was already replayed at ${replayedAt}`);
    this.name = 'DeadLetterAlreadyReplayedError';
  }
}

export class DeadLetterNotReplayableError extends Error {
  constructor(
    readonly deadLetterId: string,
    readonly reason: string,
  ) {
    super(`Dead letter ${deadLetterId} cannot be replayed: ${reason}`);
    this.name = 'DeadLetterNotReplayableError';
  }
}
