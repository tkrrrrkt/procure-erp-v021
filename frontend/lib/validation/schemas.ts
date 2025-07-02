import { z } from 'zod';

/**
 * 企業級フロントエンド入力検証スキーマ
 * バックエンドDTO完全同期対応
 */

// ========================================
// 基本検証ユーティリティ
// ========================================

/**
 * 日本の郵便番号検証（7桁数字またはハイフン区切り）
 */
export const japanesePostalCodeSchema = z
  .string()
  .regex(/^\d{3}-\d{4}$|^\d{7}$/, {
    message: '郵便番号は7桁の数字またはハイフン区切りで入力してください（例：100-0001）'
  })
  .transform((value) => {
    const cleaned = value.replace(/[^\d-]/g, '');
    return cleaned.length === 7 && !cleaned.includes('-') 
      ? `${cleaned.slice(0, 3)}-${cleaned.slice(3)}` 
      : cleaned;
  });

/**
 * 日本の電話番号検証（数字とハイフンのみ）
 */
export const japanesePhoneSchema = z
  .string()
  .min(10, { message: '電話番号は10文字以上で入力してください' })
  .max(15, { message: '電話番号は15文字以下で入力してください' })
  .regex(/^[0-9-]+$/, { 
    message: '電話番号は数字とハイフンのみ使用できます' 
  });

/**
 * カタカナ検証
 */
export const katakanaSchema = z
  .string()
  .regex(/^[ァ-ヶー\s]*$/, { 
    message: 'カタカナのみ使用できます' 
  });

/**
 * 英数字コード検証
 */
export const alphanumericCodeSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/, { 
    message: '英数字、ハイフン、アンダースコアのみ使用できます' 
  })
  .transform((value) => value.trim().toUpperCase());

/**
 * 安全なURL検証（HTTPSエンフォース）
 */
export const secureUrlSchema = z
  .string()
  .url({ message: '正しいURLを入力してください' })
  .refine((url) => {
    if (process.env.NODE_ENV === 'production') {
      return url.startsWith('https://');
    }
    return true;
  }, { message: '本番環境ではHTTPSのURLのみ使用できます' });

// ========================================
// ユーザープロファイル検証スキーマ
// ========================================

export const updateUserProfileSchema = z.object({
  display_name: z
    .string()
    .min(1, { message: '表示名を入力してください' })
    .max(100, { message: '表示名は100文字以下で入力してください' })
    .transform((value) => value.trim()),
  
  email: z
    .string()
    .email({ message: '正しいメールアドレスを入力してください' })
    .min(5, { message: 'メールアドレスは5文字以上で入力してください' })
    .max(255, { message: 'メールアドレスは255文字以下で入力してください' })
    .transform((value) => value.trim().toLowerCase()),
  
  phone: japanesePhoneSchema.optional(),
  
  language: z
    .enum(['ja', 'en'], { 
      errorMap: () => ({ message: '言語は日本語または英語を選択してください' }) 
    })
    .default('ja'),
  
  timezone: z
    .string()
    .min(1, { message: 'タイムゾーンを選択してください' })
    .max(50, { message: 'タイムゾーンは50文字以下で入力してください' })
    .default('Asia/Tokyo'),
  
  avatar_url: secureUrlSchema.optional(),
  
  notification_preferences: z.object({
    email_notifications: z.boolean().default(true),
    sms_notifications: z.boolean().default(false),
    push_notifications: z.boolean().default(true),
  }).default({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
  }),
  
  is_active: z.boolean().default(true),
});

// ========================================
// ベンダー検証スキーマ
// ========================================

export const createVendorSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'ベンダー名は2文字以上で入力してください' })
    .max(100, { message: 'ベンダー名は100文字以下で入力してください' })
    .transform((value) => value.trim()),
  
  code: alphanumericCodeSchema
    .min(3, { message: 'ベンダーコードは3文字以上で入力してください' })
    .max(20, { message: 'ベンダーコードは20文字以下で入力してください' }),
  
  kana_name: katakanaSchema
    .min(1, { message: 'ベンダー名（カナ）は1文字以上で入力してください' })
    .max(100, { message: 'ベンダー名（カナ）は100文字以下で入力してください' })
    .optional()
    .transform((value) => value ? value.trim() : value),
  
  email: z
    .string()
    .email({ message: '正しいメールアドレスを入力してください' })
    .min(5, { message: 'メールアドレスは5文字以上で入力してください' })
    .max(255, { message: 'メールアドレスは255文字以下で入力してください' })
    .transform((value) => value.trim().toLowerCase()),
  
  phone: japanesePhoneSchema,
  
  fax: japanesePhoneSchema.optional(),
  
  postal_code: japanesePostalCodeSchema,
  
  address: z
    .string()
    .min(5, { message: '住所は5文字以上で入力してください' })
    .max(255, { message: '住所は255文字以下で入力してください' })
    .transform((value) => value.trim()),
  
  website: secureUrlSchema
    .min(10, { message: 'URLは10文字以上で入力してください' })
    .max(255, { message: 'URLは255文字以下で入力してください' })
    .optional(),
  
  business_categories: z
    .array(z.string().min(1, { message: 'カテゴリー名を入力してください' }))
    .max(10, { message: '取引カテゴリーは10個以下で入力してください' })
    .optional()
    .transform((value) => 
      value ? value.map(item => item.trim()).filter(item => item.length > 0) : value
    ),
  
  notes: z
    .string()
    .max(1000, { message: '備考は1000文字以下で入力してください' })
    .optional()
    .transform((value) => value ? value.trim() : value),
  
  is_active: z.boolean().default(true),
});

// ========================================
// 倉庫検証スキーマ
// ========================================

export const warehouseStatusSchema = z.enum(['active', 'inactive', 'maintenance', 'closed'], {
  errorMap: () => ({ message: '倉庫ステータスを正しく選択してください' })
});

export const createWarehouseSchema = z.object({
  name: z
    .string()
    .min(2, { message: '倉庫名は2文字以上で入力してください' })
    .max(100, { message: '倉庫名は100文字以下で入力してください' })
    .transform((value) => value.trim()),
  
  code: alphanumericCodeSchema
    .min(3, { message: '倉庫コードは3文字以上で入力してください' })
    .max(20, { message: '倉庫コードは20文字以下で入力してください' }),
  
  kana_name: katakanaSchema
    .min(1, { message: '倉庫名（カナ）は1文字以上で入力してください' })
    .max(100, { message: '倉庫名（カナ）は100文字以下で入力してください' })
    .optional()
    .transform((value) => value ? value.trim() : value),
  
  contact_email: z
    .string()
    .email({ message: '正しいメールアドレスを入力してください' })
    .min(5, { message: 'メールアドレスは5文字以上で入力してください' })
    .max(255, { message: 'メールアドレスは255文字以下で入力してください' })
    .transform((value) => value.trim().toLowerCase()),
  
  phone: japanesePhoneSchema,
  
  fax: japanesePhoneSchema.optional(),
  
  postal_code: japanesePostalCodeSchema,
  
  address: z
    .string()
    .min(5, { message: '住所は5文字以上で入力してください' })
    .max(255, { message: '住所は255文字以下で入力してください' })
    .transform((value) => value.trim()),
  
  status: warehouseStatusSchema.default('active'),
  
  capacity_sqm: z
    .number()
    .min(1, { message: '収容能力は1平方メートル以上で入力してください' })
    .max(100000, { message: '収容能力は100,000平方メートル以下で入力してください' })
    .optional(),
  
  temperature_controlled: z.boolean().default(false),
  
  hazmat_storage: z.boolean().default(false),
  
  notes: z
    .string()
    .max(1000, { message: '備考は1000文字以下で入力してください' })
    .optional()
    .transform((value) => value ? value.trim() : value),
  
  is_active: z.boolean().default(true),
});

// ========================================
// 型エクスポート
// ========================================

export type UpdateUserProfileFormData = z.infer<typeof updateUserProfileSchema>;
export type CreateVendorFormData = z.infer<typeof createVendorSchema>;
export type CreateWarehouseFormData = z.infer<typeof createWarehouseSchema>;

// ========================================
// スキーマエクスポート（旧コードとの互換性）
// ========================================

export const formSchemas = {
  userProfile: updateUserProfileSchema,
  vendor: createVendorSchema,
  warehouse: createWarehouseSchema,
} as const;
