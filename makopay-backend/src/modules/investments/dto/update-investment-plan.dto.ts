import { PartialType } from '@nestjs/mapped-types';
import { CreateInvestmentPlanDto } from './create-investment-plan.dto';

export class UpdateInvestmentPlanDto extends PartialType(CreateInvestmentPlanDto) { }
