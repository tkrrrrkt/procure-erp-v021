"use server"

import { searchProducts } from "@/lib/ec-sites-data"

export async function fetchProductPrices(query: string, partNumber: string, category: string, selectedSites: number[]) {
  try {
    // 実際のスクレイピングの代わりに模擬データを検索
    const results = await searchProducts(query, partNumber, category, selectedSites)

    // 検索結果を返す
    return {
      success: true,
      data: results,
      message: `${results.length}件の結果が見つかりました`,
    }
  } catch (error) {
    console.error("価格検索エラー:", error)
    return {
      success: false,
      data: [],
      message: "データの取得中にエラーが発生しました。しばらく経ってから再度お試しください。",
    }
  }
}
