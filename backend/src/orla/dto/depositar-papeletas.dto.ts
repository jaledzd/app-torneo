import { IsInt, Min } from 'class-validator';
export class DepositarPapeletasDto {
  @IsInt() @Min(1) cantidad: number;
}
