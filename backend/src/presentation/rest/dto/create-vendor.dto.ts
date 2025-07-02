import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsBoolean,
  Length, 
  Matches,
  IsUrl,
  IsPostalCode,
  IsArray,
  ArrayMaxSize,
  ValidateNested
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * ベンダー作成DTO
 * 企業級入力検証とサニタイゼーション完備
 */
export class CreateVendorDto {
  @ApiProperty({ 
    description: 'ベンダー名（2-100文字）',
    example: '株式会社サンプル',
    maxLength: 100,
    minLength: 2
  })
  @IsString({ message: 'ベンダー名は文字列で入力してください' })
  @Length(2, 100, { message: 'ベンダー名は2文字以上100文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  @ApiProperty({ 
    description: 'ベンダーコード（3-20文字、英数字のみ）',
    example: 'VEN001',
    maxLength: 20,
    minLength: 3
  })
  @IsString({ message: 'ベンダーコードは文字列で入力してください' })
  @Length(3, 20, { message: 'ベンダーコードは3文字以上20文字以下で入力してください' })
  @Matches(/^[A-Za-z0-9_-]+$/, { 
    message: 'ベンダーコードは英数字、ハイフン、アンダースコアのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  code: string;

  @ApiProperty({ 
    description: 'ベンダー名（カナ）',
    example: 'カブシキガイシャサンプル',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'ベンダー名（カナ）は文字列で入力してください' })
  @Length(1, 100, { message: 'ベンダー名（カナ）は1文字以上100文字以下で入力してください' })
  @Matches(/^[ァ-ヶー\s]+$/, { 
    message: 'ベンダー名（カナ）はカタカナのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  kana_name?: string;

  @ApiProperty({ 
    description: 'メールアドレス',
    example: 'contact@vendor.com'
  })
  @IsEmail({}, { message: '正しいメールアドレスを入力してください' })
  @Length(5, 255, { message: 'メールアドレスは5文字以上255文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  email: string;

  @ApiProperty({ 
    description: '電話番号（数字とハイフンのみ）',
    example: '03-1234-5678'
  })
  @IsString({ message: '電話番号は文字列で入力してください' })
  @Length(10, 15, { message: '電話番号は10文字以上15文字以下で入力してください' })
  @Matches(/^[0-9-]+$/, { 
    message: '電話番号は数字とハイフンのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  phone: string;

  @ApiProperty({ 
    description: 'FAX番号（数字とハイフンのみ）',
    example: '03-1234-5679',
    required: false
  })
  @IsOptional()
  @IsString({ message: 'FAX番号は文字列で入力してください' })
  @Length(10, 15, { message: 'FAX番号は10文字以上15文字以下で入力してください' })
  @Matches(/^[0-9-]+$/, { 
    message: 'FAX番号は数字とハイフンのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  fax?: string;

  @ApiProperty({ 
    description: '郵便番号（7桁数字またはハイフン区切り）',
    example: '100-0001'
  })
  @IsString({ message: '郵便番号は文字列で入力してください' })
  @Matches(/^\d{3}-\d{4}$|^\d{7}$/, { 
    message: '郵便番号は7桁の数字またはハイフン区切りで入力してください（例：100-0001）' 
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const cleaned = value.trim().replace(/[^\d-]/g, '');
      return cleaned.length === 7 && !cleaned.includes('-') 
        ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}` 
        : cleaned;
    }
    return value;
  })
  postal_code: string;

  @ApiProperty({ 
    description: '住所',
    example: '東京都千代田区丸の内1-1-1'
  })
  @IsString({ message: '住所は文字列で入力してください' })
  @Length(5, 255, { message: '住所は5文字以上255文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  address: string;

  @ApiProperty({ 
    description: 'ウェブサイトURL',
    example: 'https://www.vendor.com',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: '正しいURLを入力してください' })
  @Length(10, 255, { message: 'URLは10文字以上255文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  website?: string;

  @ApiProperty({ 
    description: '取引カテゴリー',
    example: ['IT機器', 'オフィス用品'],
    required: false,
    isArray: true
  })
  @IsOptional()
  @IsArray({ message: '取引カテゴリーは配列で入力してください' })
  @ArrayMaxSize(10, { message: '取引カテゴリーは10個以下で入力してください' })
  @IsString({ each: true, message: '取引カテゴリーの各項目は文字列で入力してください' })
  @Transform(({ value }) => 
    Array.isArray(value) 
      ? value.map(item => typeof item === 'string' ? item.trim() : item)
      : value
  )
  business_categories?: string[];

  @ApiProperty({ 
    description: '備考',
    example: '重要な取引先です',
    required: false
  })
  @IsOptional()
  @IsString({ message: '備考は文字列で入力してください' })
  @Length(0, 1000, { message: '備考は1000文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  notes?: string;

  @ApiProperty({ 
    description: 'アクティブフラグ',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean({ message: 'アクティブフラグはtrue/falseで入力してください' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  is_active?: boolean = true;
}
