import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsBoolean,
  Length, 
  Matches,
  IsEnum,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 倉庫ステータス列挙型
 */
export enum WarehouseStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  CLOSED = 'closed'
}

/**
 * 倉庫作成DTO
 * 企業級入力検証とサニタイゼーション完備
 */
export class CreateWarehouseDto {
  @ApiProperty({ 
    description: '倉庫名（2-100文字）',
    example: '東京第一倉庫',
    maxLength: 100,
    minLength: 2
  })
  @IsString({ message: '倉庫名は文字列で入力してください' })
  @Length(2, 100, { message: '倉庫名は2文字以上100文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  name: string;

  @ApiProperty({ 
    description: '倉庫コード（3-20文字、英数字のみ）',
    example: 'WH001',
    maxLength: 20,
    minLength: 3
  })
  @IsString({ message: '倉庫コードは文字列で入力してください' })
  @Length(3, 20, { message: '倉庫コードは3文字以上20文字以下で入力してください' })
  @Matches(/^[A-Za-z0-9_-]+$/, { 
    message: '倉庫コードは英数字、ハイフン、アンダースコアのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
  code: string;

  @ApiProperty({ 
    description: '倉庫名（カナ）',
    example: 'トウキョウダイイチソウコ',
    required: false
  })
  @IsOptional()
  @IsString({ message: '倉庫名（カナ）は文字列で入力してください' })
  @Length(1, 100, { message: '倉庫名（カナ）は1文字以上100文字以下で入力してください' })
  @Matches(/^[ァ-ヶー\s]+$/, { 
    message: '倉庫名（カナ）はカタカナのみ使用できます' 
  })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  kana_name?: string;

  @ApiProperty({ 
    description: '担当者メールアドレス',
    example: 'warehouse@company.com'
  })
  @IsEmail({}, { message: '正しいメールアドレスを入力してください' })
  @Length(5, 255, { message: 'メールアドレスは5文字以上255文字以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  contact_email: string;

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
    description: '倉庫ステータス',
    enum: WarehouseStatus,
    example: WarehouseStatus.ACTIVE,
    default: WarehouseStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(WarehouseStatus, { 
    message: `倉庫ステータスは次の値のいずれかを選択してください: ${Object.values(WarehouseStatus).join(', ')}` 
  })
  status?: WarehouseStatus = WarehouseStatus.ACTIVE;

  @ApiProperty({ 
    description: '収容能力（平方メートル）',
    example: 1000,
    minimum: 1,
    maximum: 100000,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: '収容能力は数値で入力してください' })
  @Min(1, { message: '収容能力は1平方メートル以上で入力してください' })
  @Max(100000, { message: '収容能力は100,000平方メートル以下で入力してください' })
  @Transform(({ value }) => typeof value === 'string' ? parseInt(value, 10) : value)
  capacity_sqm?: number;

  @ApiProperty({ 
    description: '温度管理対応',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: '温度管理対応はtrue/falseで入力してください' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  temperature_controlled?: boolean = false;

  @ApiProperty({ 
    description: '危険物保管対応',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean({ message: '危険物保管対応はtrue/falseで入力してください' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  hazmat_storage?: boolean = false;

  @ApiProperty({ 
    description: '備考',
    example: '24時間監視体制',
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
