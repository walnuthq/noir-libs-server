import { ApiKeyScope } from '../../../../model/auth/apikey-scope.enum';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsPositive,
    MaxLength
} from 'class-validator';

export class GenerateApiKeyDto {

    @IsOptional()
    @MaxLength(255)
    @IsNotEmpty()
    label?: string;

    // if not given, expires never
    @IsOptional()
    @IsInt()
    @IsPositive()
    expiresDays?: number;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(2)
    @IsEnum(ApiKeyScope, { each: true })
    scopes: ApiKeyScope[];
}