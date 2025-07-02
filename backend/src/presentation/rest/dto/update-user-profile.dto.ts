import { 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsNumber, 
  IsEmail,
  Length, 
  Min, 
  Max, 
  Matches,
  IsNotEmpty,
  IsBoolean
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ユーザープロファイル更新DTO
 * 企業級入力検証とサニタイゼーション完備
 */
export class UpdateUserProfileDto {
  @ApiProperty({ 
    description: '社員コード（3-20文字、英数字とハイフン・アンダースコアのみ）',
    example: 'EMP001',
    required: false 
  })
  @IsOptional()
  @IsString({ message: '社員コードは文字列で入力してください' })
  @Length(3, 20, { message: '社員コードは3文字以上20文字以下で入力してください' })
  @Matches(/^[A-Za-z0-9_-]+$/, { 
    message: '社員コードは英数字、ハイフン、アンダースコアのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  employee_code?: string;

  @ApiProperty({ 
    description: '部署ID（UUID形式）',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false 
  })
  @IsOptional()
  @IsUUID('4', { message: '正しい部署IDを指定してください' })
  department_id?: string;

  @ApiProperty({ 
    description: '上司ID（UUID形式）',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false 
  })
  @IsOptional()
  @IsUUID('4', { message: '正しい上司IDを指定してください' })
  manager_id?: string;

  @ApiProperty({ 
    description: '承認限度額（0-10,000,000円）',
    example: 100000,
    required: false 
  })
  @IsOptional()
  @IsNumber({}, { message: '承認限度額は数値で入力してください' })
  @Min(0, { message: '承認限度額は0円以上で入力してください' })
  @Max(10000000, { message: '承認限度額は10,000,000円以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  approval_limit?: number;

  @ApiProperty({ 
    description: 'メールアドレス',
    example: 'user@company.com',
    required: false 
  })
  @IsOptional()
  @IsEmail({}, { message: '正しいメールアドレスを入力してください' })
  @Length(5, 255, { message: 'メールアドレスは5文字以上255文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  email?: string;

  @ApiProperty({ 
    description: '電話番号（数字とハイフンのみ）',
    example: '03-1234-5678',
    required: false 
  })
  @IsOptional()
  @IsString({ message: '電話番号は文字列で入力してください' })
  @Length(10, 15, { message: '電話番号は10文字以上15文字以下で入力してください' })
  @Matches(/^[0-9-]+$/, { 
    message: '電話番号は数字とハイフンのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  phone?: string;

  @ApiProperty({ 
    description: 'アクティブフラグ',
    example: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean({ message: 'アクティブフラグはtrue/falseで入力してください' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_active?: boolean;
}
