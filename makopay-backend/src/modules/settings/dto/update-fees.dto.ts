import { IsNumber, Min, Max } from 'class-validator';

export class UpdateFeesDto {
    @IsNumber()
    @Min(0)
    @Max(100)
    depositFeePercent: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    withdrawalFeePercent: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    orderFeePercent: number;
}
