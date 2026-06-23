import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class ThroughputQueryDto {
  @ApiPropertyOptional({
    description: 'Size of the time window to report, in minutes',
    minimum: 5,
    maximum: 1440,
    default: 60,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(1440)
  windowMinutes = 60;

  @ApiPropertyOptional({
    description: 'Width of each bucket, in minutes',
    minimum: 1,
    maximum: 60,
    default: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  bucketMinutes = 5;
}
