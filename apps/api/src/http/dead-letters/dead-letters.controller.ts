import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import type { ListDeadLettersUseCase } from '../../core/use-cases/list-dead-letters.use-case';
import type { ReplayDeadLetterUseCase } from '../../core/use-cases/replay-dead-letter.use-case';
import {
  LIST_DEAD_LETTERS_USE_CASE,
  REPLAY_DEAD_LETTER_USE_CASE,
} from '../../infrastructure/tokens';
import { DeadLetterDto } from './dto/dead-letter.dto';
import { DeadLetterListDto } from './dto/dead-letter-list.dto';
import { ListDeadLettersQueryDto } from './dto/list-dead-letters.query';

@ApiTags('dead-letters')
@Controller('dead-letters')
export class DeadLettersController {
  constructor(
    @Inject(LIST_DEAD_LETTERS_USE_CASE) private readonly listDeadLetters: ListDeadLettersUseCase,
    @Inject(REPLAY_DEAD_LETTER_USE_CASE) private readonly replayDeadLetter: ReplayDeadLetterUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List dead letters, most recent first' })
  @ApiOkResponse({ type: DeadLetterListDto })
  async list(@Query() query: ListDeadLettersQueryDto): Promise<DeadLetterListDto> {
    return this.listDeadLetters.execute({ limit: query.limit, offset: query.offset });
  }

  @Post(':id/replay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a dead letter back to the orders queue' })
  @ApiOkResponse({ type: DeadLetterDto })
  @ApiNotFoundResponse({ description: 'No dead letter with that id' })
  @ApiConflictResponse({ description: 'Dead letter was already replayed' })
  @ApiUnprocessableEntityResponse({ description: 'Payload is not a replayable order event' })
  async replay(@Param('id', ParseUUIDPipe) id: string): Promise<DeadLetterDto> {
    return this.replayDeadLetter.execute(id);
  }
}
