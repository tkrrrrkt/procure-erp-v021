// 模擬データベース: 各ECサイトの商品情報

export type VolumeDiscount = {
  quantity: number
  price: number
}

export type ProductListing = {
  id: string
  siteId: number
  siteName: string
  siteUrl: string
  partNumber: string
  manufacturerPartNumber: string
  description: string
  category: string
  manufacturer: string
  unitPrice: number
  currency: string
  stockStatus: string
  stockQuantity: number
  deliveryDays: number
  minOrderQuantity: number
  volumeDiscounts: VolumeDiscount[]
  specifications: Record<string, string>
  imageUrl: string
  lastUpdated: string
  tags: string[]
}

export type ECSite = {
  id: number
  name: string
  url: string
  logo?: string
}

// ECサイト情報
export const ecSites: ECSite[] = [
  { id: 1, name: "RS Components", url: "https://jp.rs-online.com" },
  { id: 2, name: "Digi-Key", url: "https://www.digikey.jp" },
  { id: 3, name: "Mouser Electronics", url: "https://www.mouser.jp" },
  { id: 4, name: "Misumi", url: "https://jp.misumi-ec.com" },
  { id: 5, name: "Chip One Stop", url: "https://www.chip1stop.com" },
]

// 部品カテゴリ
export const categories = ["電子部品", "機械部品", "ファスナー", "電気部品", "油圧・空圧部品", "工具・消耗品"]

// 模擬データベース: 電子部品
const electronicComponents: ProductListing[] = [
  // 抵抗器
  {
    id: "rs-1001",
    siteId: 1,
    siteName: "RS Components",
    siteUrl: "https://jp.rs-online.com/web/p/through-hole-fixed-resistors/7077666",
    partNumber: "RS-7077666",
    manufacturerPartNumber: "MFR-25FRF52-10K",
    description: "金属皮膜抵抗器 10kΩ 1/4W 1%",
    category: "電子部品",
    manufacturer: "Yageo",
    unitPrice: 12,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 5000,
    deliveryDays: 2,
    minOrderQuantity: 10,
    volumeDiscounts: [
      { quantity: 100, price: 10 },
      { quantity: 500, price: 8 },
      { quantity: 1000, price: 6 },
    ],
    specifications: {
      抵抗値: "10kΩ",
      許容差: "±1%",
      定格電力: "0.25W",
      温度係数: "±100ppm/°C",
      サイズ: "6.3 x 2.3mm",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-01T10:30:00Z",
    tags: ["抵抗器", "10kΩ", "1/4W", "Yageo"],
  },
  {
    id: "dk-1001",
    siteId: 2,
    siteName: "Digi-Key",
    siteUrl: "https://www.digikey.jp/product-detail/ja/yageo/MFR-25FRF52-10K/10KQBK-ND/338",
    partNumber: "10KQBK-ND",
    manufacturerPartNumber: "MFR-25FRF52-10K",
    description: "抵抗器 10kΩ 250mW 軸リード 1%",
    category: "電子部品",
    manufacturer: "Yageo",
    unitPrice: 14,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 10000,
    deliveryDays: 3,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 10, price: 13 },
      { quantity: 100, price: 11 },
      { quantity: 1000, price: 7 },
    ],
    specifications: {
      抵抗値: "10kΩ",
      許容差: "±1%",
      定格電力: "0.25W",
      温度係数: "±100ppm/°C",
      サイズ: "6.3 x 2.3mm",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-02T14:15:00Z",
    tags: ["抵抗器", "10kΩ", "1/4W", "Yageo"],
  },
  {
    id: "me-1001",
    siteId: 3,
    siteName: "Mouser Electronics",
    siteUrl: "https://www.mouser.jp/ProductDetail/Yageo/MFR-25FRF52-10K",
    partNumber: "603-MFR-25FRF52-10K",
    manufacturerPartNumber: "MFR-25FRF52-10K",
    description: "金属皮膜抵抗 10K Ohm 0.25W 1%",
    category: "電子部品",
    manufacturer: "Yageo",
    unitPrice: 13,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 7500,
    deliveryDays: 2,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 50, price: 12 },
      { quantity: 250, price: 10 },
      { quantity: 500, price: 8 },
    ],
    specifications: {
      抵抗値: "10kΩ",
      許容差: "±1%",
      定格電力: "0.25W",
      温度係数: "±100ppm/°C",
      サイズ: "6.3 x 2.3mm",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-03T09:45:00Z",
    tags: ["抵抗器", "10kΩ", "1/4W", "Yageo"],
  },

  // コンデンサ
  {
    id: "rs-2001",
    siteId: 1,
    siteName: "RS Components",
    siteUrl: "https://jp.rs-online.com/web/p/mlccs-multilayer-ceramic-capacitors/1216415",
    partNumber: "RS-1216415",
    manufacturerPartNumber: "C0805C104K5RACTU",
    description: "積層セラミックコンデンサ 0.1μF 50V X7R",
    category: "電子部品",
    manufacturer: "KEMET",
    unitPrice: 15,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 8000,
    deliveryDays: 1,
    minOrderQuantity: 10,
    volumeDiscounts: [
      { quantity: 100, price: 12 },
      { quantity: 500, price: 10 },
      { quantity: 1000, price: 8 },
    ],
    specifications: {
      容量: "0.1μF",
      電圧定格: "50V",
      誘電体: "X7R",
      サイズ: "0805",
      許容差: "±10%",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-01T11:20:00Z",
    tags: ["コンデンサ", "0.1μF", "50V", "KEMET", "X7R"],
  },
  {
    id: "dk-2001",
    siteId: 2,
    siteName: "Digi-Key",
    siteUrl: "https://www.digikey.jp/product-detail/ja/kemet/C0805C104K5RACTU/399-1170-1-ND/411445",
    partNumber: "399-1170-1-ND",
    manufacturerPartNumber: "C0805C104K5RACTU",
    description: "CAP CER 0.1UF 50V X7R 0805",
    category: "電子部品",
    manufacturer: "KEMET",
    unitPrice: 16,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 12000,
    deliveryDays: 2,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 10, price: 15 },
      { quantity: 100, price: 13 },
      { quantity: 1000, price: 9 },
    ],
    specifications: {
      容量: "0.1μF",
      電圧定格: "50V",
      誘電体: "X7R",
      サイズ: "0805",
      許容差: "±10%",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-02T15:30:00Z",
    tags: ["コンデンサ", "0.1μF", "50V", "KEMET", "X7R"],
  },

  // マイクロコントローラ
  {
    id: "rs-3001",
    siteId: 1,
    siteName: "RS Components",
    siteUrl: "https://jp.rs-online.com/web/p/microcontrollers/1823130",
    partNumber: "RS-1823130",
    manufacturerPartNumber: "ATMEGA328P-PU",
    description: "AVRマイコン ATmega328P 20MHz 32kB",
    category: "電子部品",
    manufacturer: "Microchip",
    unitPrice: 350,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 500,
    deliveryDays: 3,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 10, price: 330 },
      { quantity: 25, price: 310 },
      { quantity: 100, price: 290 },
    ],
    specifications: {
      コア: "AVR",
      フラッシュメモリ: "32kB",
      RAM: "2kB",
      EEPROM: "1kB",
      最大周波数: "20MHz",
      "I/Oピン": "23",
      パッケージ: "DIP-28",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-01T13:45:00Z",
    tags: ["マイコン", "ATmega328P", "Microchip", "Arduino"],
  },
  {
    id: "dk-3001",
    siteId: 2,
    siteName: "Digi-Key",
    siteUrl: "https://www.digikey.jp/product-detail/ja/microchip-technology/ATMEGA328P-PU/ATMEGA328P-PU-ND/1914589",
    partNumber: "ATMEGA328P-PU-ND",
    manufacturerPartNumber: "ATMEGA328P-PU",
    description: "IC MCU 8BIT 32KB FLASH 28DIP",
    category: "電子部品",
    manufacturer: "Microchip",
    unitPrice: 340,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 750,
    deliveryDays: 2,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 10, price: 325 },
      { quantity: 25, price: 305 },
      { quantity: 100, price: 285 },
    ],
    specifications: {
      コア: "AVR",
      フラッシュメモリ: "32kB",
      RAM: "2kB",
      EEPROM: "1kB",
      最大周波数: "20MHz",
      "I/Oピン": "23",
      パッケージ: "DIP-28",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-02T16:20:00Z",
    tags: ["マイコン", "ATmega328P", "Microchip", "Arduino"],
  },
  {
    id: "me-3001",
    siteId: 3,
    siteName: "Mouser Electronics",
    siteUrl: "https://www.mouser.jp/ProductDetail/Microchip-Technology/ATMEGA328P-PU",
    partNumber: "556-ATMEGA328P-PU",
    manufacturerPartNumber: "ATMEGA328P-PU",
    description: "AVR ATmega マイクロコントローラ 32KB 20MHz",
    category: "電子部品",
    manufacturer: "Microchip",
    unitPrice: 345,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 600,
    deliveryDays: 3,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 10, price: 335 },
      { quantity: 25, price: 315 },
      { quantity: 100, price: 295 },
    ],
    specifications: {
      コア: "AVR",
      フラッシュメモリ: "32kB",
      RAM: "2kB",
      EEPROM: "1kB",
      最大周波数: "20MHz",
      "I/Oピン": "23",
      パッケージ: "DIP-28",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-03T10:15:00Z",
    tags: ["マイコン", "ATmega328P", "Microchip", "Arduino"],
  },
]

// 模擬データベース: 機械部品
const mechanicalParts: ProductListing[] = [
  // ベアリング
  {
    id: "rs-4001",
    siteId: 1,
    siteName: "RS Components",
    siteUrl: "https://jp.rs-online.com/web/p/ball-bearings/6189957",
    partNumber: "RS-6189957",
    manufacturerPartNumber: "608-2Z",
    description: "深溝玉軸受 608-2Z シールドタイプ",
    category: "機械部品",
    manufacturer: "SKF",
    unitPrice: 250,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 300,
    deliveryDays: 2,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 10, price: 235 },
      { quantity: 25, price: 220 },
      { quantity: 50, price: 205 },
    ],
    specifications: {
      内径: "8mm",
      外径: "22mm",
      幅: "7mm",
      タイプ: "シールドタイプ",
      材質: "クロム鋼",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-01T14:30:00Z",
    tags: ["ベアリング", "608-2Z", "SKF", "8mm"],
  },
  {
    id: "ms-4001",
    siteId: 4,
    siteName: "Misumi",
    siteUrl: "https://jp.misumi-ec.com/vona2/detail/110300026540/",
    partNumber: "MSMI-608-2Z",
    manufacturerPartNumber: "608-2Z",
    description: "ミニチュアベアリング 608-2Z 両側シールド",
    category: "機械部品",
    manufacturer: "Misumi",
    unitPrice: 240,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 500,
    deliveryDays: 1,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 10, price: 230 },
      { quantity: 30, price: 215 },
      { quantity: 50, price: 200 },
    ],
    specifications: {
      内径: "8mm",
      外径: "22mm",
      幅: "7mm",
      タイプ: "シールドタイプ",
      材質: "クロム鋼",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-04T09:10:00Z",
    tags: ["ベアリング", "608-2Z", "Misumi", "8mm"],
  },

  // リニアガイド
  {
    id: "ms-5001",
    siteId: 4,
    siteName: "Misumi",
    siteUrl: "https://jp.misumi-ec.com/vona2/detail/110302634310/",
    partNumber: "MSMI-SSEBH8",
    manufacturerPartNumber: "SSEBH8",
    description: "リニアガイド SSEBH8 ブロック付き 200mm",
    category: "機械部品",
    manufacturer: "Misumi",
    unitPrice: 3500,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 50,
    deliveryDays: 3,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 5, price: 3400 },
      { quantity: 10, price: 3300 },
      { quantity: 20, price: 3150 },
    ],
    specifications: {
      レール長さ: "200mm",
      ブロックサイズ: "8mm",
      材質: "ステンレス鋼",
      最大荷重: "15kg",
      取付穴数: "4",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-04T10:20:00Z",
    tags: ["リニアガイド", "SSEBH8", "Misumi", "200mm"],
  },
]

// 模擬データベース: 電気部品
const electricalParts: ProductListing[] = [
  // DCモーター
  {
    id: "rs-6001",
    siteId: 1,
    siteName: "RS Components",
    siteUrl: "https://jp.rs-online.com/web/p/dc-motors/5219923",
    partNumber: "RS-5219923",
    manufacturerPartNumber: "DCM2596-12V",
    description: "DCモーター 12V 200rpm 5Nm",
    category: "電気部品",
    manufacturer: "RS PRO",
    unitPrice: 1800,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 45,
    deliveryDays: 3,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 5, price: 1750 },
      { quantity: 10, price: 1700 },
      { quantity: 20, price: 1650 },
    ],
    specifications: {
      電圧: "12V DC",
      回転数: "200rpm",
      トルク: "5Nm",
      軸径: "6mm",
      消費電流: "2A",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-01T15:45:00Z",
    tags: ["モーター", "DCモーター", "12V", "RS PRO"],
  },
  {
    id: "ms-6001",
    siteId: 4,
    siteName: "Misumi",
    siteUrl: "https://jp.misumi-ec.com/vona2/detail/110300428260/",
    partNumber: "MSMI-DCM-12V-200",
    manufacturerPartNumber: "DCM-12V-200",
    description: "DCギヤードモーター 12V 200rpm",
    category: "電気部品",
    manufacturer: "Misumi",
    unitPrice: 1850,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 30,
    deliveryDays: 2,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 5, price: 1800 },
      { quantity: 10, price: 1750 },
      { quantity: 20, price: 1700 },
    ],
    specifications: {
      電圧: "12V DC",
      回転数: "200rpm",
      トルク: "5.2Nm",
      軸径: "6mm",
      消費電流: "1.9A",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-04T11:30:00Z",
    tags: ["モーター", "DCモーター", "12V", "Misumi"],
  },

  // 電源
  {
    id: "rs-7001",
    siteId: 1,
    siteName: "RS Components",
    siteUrl: "https://jp.rs-online.com/web/p/embedded-switch-mode-power-supplies-smps/1812193",
    partNumber: "RS-1812193",
    manufacturerPartNumber: "LRS-150-24",
    description: "スイッチング電源 24V 6.5A 150W",
    category: "電気部品",
    manufacturer: "Mean Well",
    unitPrice: 4500,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 25,
    deliveryDays: 2,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 5, price: 4400 },
      { quantity: 10, price: 4300 },
      { quantity: 20, price: 4150 },
    ],
    specifications: {
      入力電圧: "100-240V AC",
      出力電圧: "24V DC",
      出力電流: "6.5A",
      出力電力: "150W",
      効率: "89%",
      サイズ: "159 x 97 x 30mm",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-01T16:30:00Z",
    tags: ["電源", "スイッチング電源", "24V", "Mean Well"],
  },
  {
    id: "dk-7001",
    siteId: 2,
    siteName: "Digi-Key",
    siteUrl: "https://www.digikey.jp/product-detail/ja/mean-well-usa-inc/LRS-150-24/1866-3313-ND/7705005",
    partNumber: "1866-3313-ND",
    manufacturerPartNumber: "LRS-150-24",
    description: "AC/DC CONVERTER 24V 150W",
    category: "電気部品",
    manufacturer: "Mean Well",
    unitPrice: 4600,
    currency: "JPY",
    stockStatus: "在庫あり",
    stockQuantity: 35,
    deliveryDays: 3,
    minOrderQuantity: 1,
    volumeDiscounts: [
      { quantity: 5, price: 4500 },
      { quantity: 10, price: 4350 },
      { quantity: 25, price: 4200 },
    ],
    specifications: {
      入力電圧: "100-240V AC",
      出力電圧: "24V DC",
      出力電流: "6.5A",
      出力電力: "150W",
      効率: "89%",
      サイズ: "159 x 97 x 30mm",
    },
    imageUrl: "/placeholder.svg?height=100&width=100",
    lastUpdated: "2023-04-02T17:15:00Z",
    tags: ["電源", "スイッチング電源", "24V", "Mean Well"],
  },
]

// すべての模擬データを結合
export const mockProductDatabase: ProductListing[] = [...electronicComponents, ...mechanicalParts, ...electricalParts]

// 検索関数
export async function searchProducts(
  query = "",
  partNumber = "",
  category = "",
  selectedSites: number[] = [],
): Promise<ProductListing[]> {
  // 検索処理を模擬的に遅延させる
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // 検索条件に基づいてフィルタリング
  let results = mockProductDatabase

  // サイトでフィルタリング
  if (selectedSites.length > 0) {
    results = results.filter((product) => selectedSites.includes(product.siteId))
  }

  // カテゴリでフィルタリング
  if (category) {
    results = results.filter((product) => product.category === category)
  }

  // 部品番号でフィルタリング
  if (partNumber) {
    const partNumberLower = partNumber.toLowerCase()
    results = results.filter(
      (product) =>
        product.partNumber.toLowerCase().includes(partNumberLower) ||
        product.manufacturerPartNumber.toLowerCase().includes(partNumberLower),
    )
  }

  // キーワード検索
  if (query) {
    const queryLower = query.toLowerCase()
    results = results.filter(
      (product) =>
        product.description.toLowerCase().includes(queryLower) ||
        product.manufacturer.toLowerCase().includes(queryLower) ||
        product.tags.some((tag) => tag.toLowerCase().includes(queryLower)),
    )
  }

  // 価格の安い順にソート
  results.sort((a, b) => a.unitPrice - b.unitPrice)

  return results
}
