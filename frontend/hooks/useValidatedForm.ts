import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClientSanitizer, SanitizationOptions } from '@/lib/validation/sanitizer';
import { useCallback, useEffect } from 'react';

/**
 * 企業級フォーム検証・サニタイゼーションフック
 * バックエンドDTO完全同期対応
 */

export interface ValidatedFormOptions<TSchema extends z.ZodType<any, any>> 
  extends Omit<UseFormProps<z.infer<TSchema>>, 'resolver'> {
  schema: TSchema;
  sanitizationOptions?: SanitizationOptions;
  onValidationError?: (errors: Record<string, string>) => void;
  onSanitizationComplete?: (cleanedData: z.infer<TSchema>) => void;
  enableRealTimeValidation?: boolean;
  autoSanitize?: boolean;
}

export interface ValidatedFormReturn<TSchema extends z.ZodType<any, any>> 
  extends UseFormReturn<z.infer<TSchema>> {
  /**
   * 手動サニタイゼーション実行
   */
  sanitizeAndValidate: () => Promise<z.infer<TSchema> | null>;
  
  /**
   * フォーム送信時の安全な処理
   */
  handleSafeSubmit: (
    onValid: (data: z.infer<TSchema>) => void | Promise<void>,
    onError?: (errors: Record<string, string>) => void
  ) => (data: z.infer<TSchema>) => Promise<void>;
  
  /**
   * 検証エラーの整理されたメッセージ
   */
  getFormattedErrors: () => Record<string, string>;
  
  /**
   * フィールド単位サニタイゼーション
   */
  sanitizeField: (fieldName: keyof z.infer<TSchema>, value: any) => any;
}

/**
 * バリデーション＋サニタイゼーション統合フック
 */
export function useValidatedForm<TSchema extends z.ZodType<any, any>>(
  options: ValidatedFormOptions<TSchema>
): ValidatedFormReturn<TSchema> {
  const {
    schema,
    sanitizationOptions = {},
    onValidationError,
    onSanitizationComplete,
    enableRealTimeValidation = true,
    autoSanitize = true,
    ...formOptions
  } = options;

  // React Hook Form初期化
  const form = useForm<z.infer<TSchema>>({
    ...formOptions,
    resolver: zodResolver(schema),
    mode: enableRealTimeValidation ? 'onChange' : 'onSubmit',
  });

  const { watch, setValue, getValues, trigger, formState } = form;

  /**
   * フィールド単位サニタイゼーション
   */
  const sanitizeField = useCallback((
    fieldName: keyof z.infer<TSchema>, 
    value: any
  ) => {
    if (typeof value !== 'string') return value;

    return ClientSanitizer.sanitizeInput(value, {
      trim: true,
      stripHtml: true,
      ...sanitizationOptions,
    });
  }, [sanitizationOptions]);

  /**
   * 全フォームデータサニタイゼーション
   */
  const sanitizeFormData = useCallback((data: z.infer<TSchema>): z.infer<TSchema> => {
    return ClientSanitizer.sanitizeObject(data, {
      trim: true,
      stripHtml: true,
      maxLength: 1000, // ENV変数と同期
      ...sanitizationOptions,
    });
  }, [sanitizationOptions]);

  /**
   * 手動サニタイゼーション＋検証実行
   */
  const sanitizeAndValidate = useCallback(async (): Promise<z.infer<TSchema> | null> => {
    try {
      const currentData = getValues();
      const sanitizedData = sanitizeFormData(currentData);
      
      // サニタイズ後データをフォームに反映
      Object.entries(sanitizedData).forEach(([key, value]) => {
        setValue(key as any, value as any, { shouldValidate: true });
      });

      // 検証実行
      const isValid = await trigger();
      
      if (isValid) {
        onSanitizationComplete?.(sanitizedData);
        return sanitizedData;
      } else {
        const errors = getFormattedErrors();
        onValidationError?.(errors);
        return null;
      }
    } catch (error) {
      console.error('🔒 Form sanitization/validation error:', error);
      return null;
    }
  }, [getValues, sanitizeFormData, setValue, trigger, onSanitizationComplete, onValidationError]);

  /**
   * 安全なフォーム送信処理
   */
  const handleSafeSubmit = useCallback((
    onValid: (data: z.infer<TSchema>) => void | Promise<void>,
    onError?: (errors: Record<string, string>) => void
  ) => {
    return async (data: z.infer<TSchema>) => {
      try {
        // 送信前サニタイゼーション
        const sanitizedData = sanitizeFormData(data);
        
        // 最終検証
        const validationResult = schema.safeParse(sanitizedData);
        
        if (validationResult.success) {
          await onValid(validationResult.data);
        } else {
          const errors = validationResult.error.errors.reduce((acc, error) => {
            const path = error.path.join('.');
            acc[path] = error.message;
            return acc;
          }, {} as Record<string, string>);
          
          onError?.(errors);
          onValidationError?.(errors);
        }
      } catch (error) {
        console.error('🔒 Form submission error:', error);
        onError?.({ submit: 'フォーム送信中にエラーが発生しました' });
      }
    };
  }, [schema, sanitizeFormData, onValidationError]);

  /**
   * 整理されたエラーメッセージ取得
   */
  const getFormattedErrors = useCallback((): Record<string, string> => {
    return Object.entries(formState.errors).reduce((acc, [field, error]) => {
      if (error?.message && typeof error.message === 'string') {
        acc[field] = error.message;
      }
      return acc;
    }, {} as Record<string, string>);
  }, [formState.errors]);

  // 自動サニタイゼーション（リアルタイム）
  useEffect(() => {
    if (!autoSanitize || !enableRealTimeValidation) return;

    const subscription = watch((value, { name, type }) => {
      if (type === 'change' && name && typeof value[name] === 'string') {
        const sanitizedValue = sanitizeField(name as keyof z.infer<TSchema>, value[name]);
        
        if (sanitizedValue !== value[name]) {
          setValue(name as any, sanitizedValue, { 
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue, sanitizeField, autoSanitize, enableRealTimeValidation]);

  // 検証エラー時のコールバック
  useEffect(() => {
    if (formState.errors && Object.keys(formState.errors).length > 0) {
      const errors = getFormattedErrors();
      onValidationError?.(errors);
    }
  }, [formState.errors, getFormattedErrors, onValidationError]);

  return {
    ...form,
    sanitizeAndValidate,
    handleSafeSubmit,
    getFormattedErrors,
    sanitizeField,
  };
}

/**
 * フォーム送信エラーハンドリングフック
 */
export function useFormErrorHandler() {
  const handleValidationErrors = useCallback((errors: Record<string, string>) => {
    // エラーメッセージをユーザーフレンドリーに表示
    const errorMessages = Object.entries(errors)
      .map(([field, message]) => `${field}: ${message}`)
      .join('\n');
    
    console.warn('🔍 Form validation errors:', errors);
    
    // Toast通知やモーダル表示のロジックをここに追加
    // 例: toast.error(errorMessages);
  }, []);

  const handleSanitizationComplete = useCallback((cleanedData: any) => {
    console.info('🔒 Form data sanitized successfully:', {
      fieldCount: Object.keys(cleanedData).length,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return {
    handleValidationErrors,
    handleSanitizationComplete,
  };
}

/**
 * 特定スキーマ用のプリセットフック
 */
export function useUserProfileForm(initialData?: Partial<any>) {
  const { handleValidationErrors, handleSanitizationComplete } = useFormErrorHandler();
  
  return useValidatedForm({
    schema: z.object({}), // schemas.tsから実際のスキーマをインポート
    defaultValues: initialData,
    onValidationError: handleValidationErrors,
    onSanitizationComplete: handleSanitizationComplete,
    enableRealTimeValidation: true,
    autoSanitize: true,
  });
}

export default useValidatedForm;
