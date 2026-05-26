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
  reimburse_person_id: number | null
  is_favorite: number
  status: string
  remark: string
  file_path: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceSet {
  id: number
  name: string
  description: string
  color: string
  created_at: string
  invoice_count?: number
  total_amount?: number
}

export interface InvoiceSetMember {
  id: number
  set_id: number
  invoice_id: number
  created_at: string
}

export interface Category {
  id: number
  name: string
  description: string
  color: string
  created_at: string
}

export interface ReimbursePerson {
  id: number
  name: string
  department: string
  remark: string
  created_at: string
}

export interface OperationLog {
  id: number
  operation_type: string
  operation_object: string
  operation_details: string
  created_at: string
}

export interface SearchParams {
  keyword?: string
  category_id?: number | null
  reimburse_person_id?: number | null
  set_id?: number | null
  is_favorite?: number | null
  start_date?: string | null
  end_date?: string | null
  min_amount?: number | null
  max_amount?: number | null
}

export interface InvoiceSetStats {
  name: string
  color: string
  total: number
  count: number
  unique_total?: number
  normalized_total?: number
}

export interface LogSearchParams {
  operation_type?: string | null
  start_date?: string | null
  end_date?: string | null
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

export interface ReimbursePersonStats {
  name: string
  department: string
  total: number
  count: number
}
