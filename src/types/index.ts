export interface Invoice {
  id: number
  invoice_code: string
  invoice_number: string
  invoice_date: string
  amount: number
  tax_amount: number
  total_amount: number
  seller_name: string
  seller_tax_id: string
  buyer_name: string
  buyer_tax_id: string
  category_id: number | null
  remark: string
  file_path: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  description: string
  color: string
  created_at: string
}

export interface SearchParams {
  keyword?: string
  category_id?: number | null
  start_date?: string | null
  end_date?: string | null
  min_amount?: number | null
  max_amount?: number | null
}

export interface MonthlyStats {
  month: string
  total: number
  count: number
}

export interface CategoryStats {
  name: string
  color: string
  total: number
}
