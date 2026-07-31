import { z } from 'zod';

export const BREAKER_STATES = ['closed', 'half_open', 'open'] as const;

export const breakerStateSchema = z.enum(BREAKER_STATES);
export type BreakerState = z.infer<typeof breakerStateSchema>;
