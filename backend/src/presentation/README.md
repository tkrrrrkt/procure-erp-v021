# Presentation Layer（プレゼンテーション層）

## 概要
プレゼンテーション層は外部とのインターフェースを提供する層です。REST API、GraphQL、gRPCなど、様々なプロトコルでアプリケーションの機能を公開します。

## ディレクトリ構成

### rest/
REST APIの実装
- **controllers/**: RESTコントローラー
- **dto/**: データ転送オブジェクト
- **mappers/**: DTOとドメインオブジェクトのマッピング
- **filters/**: 例外フィルター
- **interceptors/**: リクエスト/レスポンスインターセプター
- **pipes/**: バリデーションパイプ
- **guards/**: 認証・認可ガード

### graphql/
GraphQL APIの実装（オプション）
- **resolvers/**: GraphQLリゾルバー
- **schemas/**: GraphQLスキーマ定義
- **types/**: GraphQL型定義

### grpc/
gRPC APIの実装（マイクロサービス間通信）
- **protos/**: Protocol Buffers定義
- **services/**: gRPCサービス実装

## 実装例

### RESTコントローラー
```typescript
@Controller('purchase-requests')
@UseGuards(OktaAuthGuard)
@ApiTags('Purchase Requests')
export class PurchaseRequestController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: '購買依頼の作成' })
  async create(@Body() dto: CreatePurchaseRequestDto): Promise<ResponseDto> {
    const command = new CreatePurchaseRequestCommand(
      dto.requesterId,
      dto.items,
      dto.justification,
    );
    const id = await this.commandBus.execute(command);
    return { id, message: '購買依頼を作成しました' };
  }

  @Get()
  @ApiOperation({ summary: '購買依頼一覧の取得' })
  async findAll(
    @Query() filter: PurchaseRequestFilterDto,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<PurchaseRequestDto>> {
    const query = new GetPurchaseRequestsQuery(filter, pagination);
    return this.queryBus.execute(query);
  }
}
```

### DTO定義
```typescript
export class CreatePurchaseRequestDto {
  @IsNotEmpty()
  @IsString()
  requesterId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequestItemDto)
  items: RequestItemDto[];

  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  justification: string;
}
```

### Mapperの実装
```typescript
@Injectable()
export class PurchaseRequestMapper {
  toDto(entity: PurchaseRequest): PurchaseRequestDto {
    return {
      id: entity.id.value,
      requestNumber: entity.requestNumber.value,
      status: entity.status.value,
      items: entity.items.map(item => this.toItemDto(item)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDomain(dto: CreatePurchaseRequestDto): PurchaseRequest {
    // DTOからドメインオブジェクトへの変換
  }
}
```

## 責務

1. **APIエンドポイントの提供**
   - RESTful API、GraphQL、gRPCの実装
   - OpenAPI/Swagger仕様の生成

2. **リクエスト/レスポンス変換**
   - DTOとドメインオブジェクトのマッピング
   - シリアライゼーション/デシリアライゼーション

3. **入力検証**
   - DTOレベルのバリデーション
   - リクエストパラメータの検証

4. **認証・認可**
   - Oktaトークンの検証
   - エンドポイントレベルのアクセス制御

5. **エラーハンドリング**
   - 例外のHTTPレスポンスへの変換
   - 適切なステータスコードの返却

## 設計原則

- 薄いコントローラー（Thin Controller）
- ビジネスロジックは含まない
- CQRSパターンに従った実装
- 適切なHTTPステータスコードの使用
- RESTfulな設計原則の遵守
