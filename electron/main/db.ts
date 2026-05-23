import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

let db: Database.Database | null = null

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

export function setupDatabase(): void {
  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'invoices.db')

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#1890ff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_code TEXT,
      invoice_number TEXT,
      invoice_date TEXT,
      amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      seller_name TEXT,
      seller_tax_id TEXT,
      buyer_name TEXT,
      buyer_tax_id TEXT,
      category_id INTEGER,
      remark TEXT,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_total ON invoices(total_amount);
    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
  `)

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
  if (categoryCount.count === 0) {
    const defaultCategories = [
      { name: '餐饮', description: '餐饮类发票', color: '#f5222d' },
      { name: '交通', description: '交通类发票', color: '#fa8c16' },
      { name: '办公', description: '办公用品类发票', color: '#52c41a' },
      { name: '住宿', description: '住宿类发票', color: '#13c2c2' },
      { name: '其他', description: '其他类别发票', color: '#722ed1' }
    ]

    const insert = db.prepare('INSERT INTO categories (name, description, color) VALUES (?, ?, ?)')
    defaultCategories.forEach(cat => {
      insert.run(cat.name, cat.description, cat.color)
    })
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

export function getAllCategories(): Category[] {
  const database = getDatabase()
  return database.prepare('SELECT * FROM categories ORDER BY id').all() as Category[]
}

export function addCategory(name: string, description: string, color: string): Category {
  const database = getDatabase()
  const result = database.prepare('INSERT INTO categories (name, description, color) VALUES (?, ?, ?)').run(name, description, color)
  return database.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid) as Category
}

export function updateCategory(id: number, name: string, description: string, color: string): void {
  const database = getDatabase()
  database.prepare('UPDATE categories SET name = ?, description = ?, color = ? WHERE id = ?').run(name, description, color, id)
}

export function deleteCategory(id: number): void {
  const database = getDatabase()
  database.prepare('UPDATE invoices SET category_id = NULL WHERE category_id = ?').run(id)
  database.prepare('DELETE FROM categories WHERE id = ?').run(id)
}

export function addInvoice(invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>): Invoice {
  const database = getDatabase()
  const result = database.prepare(`
    INSERT INTO invoices (
      invoice_code, invoice_number, invoice_date, amount, tax_amount,
      total_amount, seller_name, seller_tax_id, buyer_name, buyer_tax_id,
      category_id, remark, file_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoice.invoice_code, invoice.invoice_number, invoice.invoice_date,
    invoice.amount, invoice.tax_amount, invoice.total_amount,
    invoice.seller_name, invoice.seller_tax_id,
    invoice.buyer_name, invoice.buyer_tax_id,
    invoice.category_id, invoice.remark, invoice.file_path
  )
  return database.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid) as Invoice
}

export function updateInvoice(id: number, invoice: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>): void {
  const database = getDatabase()
  const fields: string[] = []
  const values: any[] = []

  Object.entries(invoice).forEach(([key, value]) => {
    fields.push(`${key} = ?`)
    values.push(value)
  })

  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  database.prepare(`UPDATE invoices SET ${fields.join(', ')} WHERE id = ?`).run(...values)
}

export function deleteInvoice(id: number): void {
  const database = getDatabase()
  database.prepare('DELETE FROM invoices WHERE id = ?').run(id)
}

export function getInvoiceById(id: number): Invoice | undefined {
  const database = getDatabase()
  return database.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as Invoice | undefined
}

export interface SearchParams {
  keyword?: string
  category_id?: number | null
  start_date?: string | null
  end_date?: string | null
  min_amount?: number | null
  max_amount?: number | null
}

export function searchInvoices(params: SearchParams): Invoice[] {
  const database = getDatabase()
  const conditions: string[] = []
  const values: any[] = []

  if (params.keyword) {
    conditions.push(`(
      invoice_code LIKE ? OR
      invoice_number LIKE ? OR
      seller_name LIKE ? OR
      buyer_name LIKE ? OR
      remark LIKE ?
    )`)
    const like = `%${params.keyword}%`
    values.push(like, like, like, like, like)
  }

  if (params.category_id) {
    conditions.push('category_id = ?')
    values.push(params.category_id)
  }

  if (params.start_date) {
    conditions.push('invoice_date >= ?')
    values.push(params.start_date)
  }

  if (params.end_date) {
    conditions.push('invoice_date <= ?')
    values.push(params.end_date)
  }

  if (params.min_amount) {
    conditions.push('total_amount >= ?')
    values.push(params.min_amount)
  }

  if (params.max_amount) {
    conditions.push('total_amount <= ?')
    values.push(params.max_amount)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return database.prepare(`SELECT * FROM invoices ${where} ORDER BY invoice_date DESC`).all(...values) as Invoice[]
}

export function getMonthlyStats(year: number): { month: string; total: number; count: number }[] {
  const database = getDatabase()
  return database.prepare(`
    SELECT 
      STRFTIME('%m', invoice_date) as month,
      SUM(total_amount) as total,
      COUNT(*) as count
    FROM invoices
    WHERE STRFTIME('%Y', invoice_date) = ?
    GROUP BY STRFTIME('%m', invoice_date)
    ORDER BY month
  `).all(String(year)) as { month: string; total: number; count: number }[]
}

export function getCategoryStats(startDate: string, endDate: string): { name: string; color: string; total: number }[] {
  const database = getDatabase()
  return database.prepare(`
    SELECT 
      c.name as name,
      c.color as color,
      SUM(i.total_amount) as total
    FROM invoices i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
    GROUP BY i.category_id
    ORDER BY total DESC
  `).all(startDate, endDate) as { name: string; color: string; total: number }[]
}

export function getAvailableYears(): number[] {
  const database = getDatabase()
  const result = database.prepare(`
    SELECT DISTINCT STRFTIME('%Y', invoice_date) as year
    FROM invoices
    WHERE invoice_date IS NOT NULL
    ORDER BY year DESC
  `).all() as { year: string }[]
  return result.map(r => parseInt(r.year))
}

export function getQuarterlyStats(year: number): { quarter: string; total: number; count: number }[] {
  const database = getDatabase()
  const data = database.prepare(`
    SELECT 
      CAST(STRFTIME('%m', invoice_date) AS INTEGER) as month,
      SUM(total_amount) as total,
      COUNT(*) as count
    FROM invoices
    WHERE STRFTIME('%Y', invoice_date) = ?
    GROUP BY STRFTIME('%m', invoice_date)
    ORDER BY month
  `).all(String(year)) as { month: number; total: number; count: number }[]

  const quarters: { quarter: string; total: number; count: number }[] = [
    { quarter: 'Q1', total: 0, count: 0 },
    { quarter: 'Q2', total: 0, count: 0 },
    { quarter: 'Q3', total: 0, count: 0 },
    { quarter: 'Q4', total: 0, count: 0 }
  ]

  data.forEach(item => {
    const quarterIndex = Math.floor((item.month - 1) / 3)
    if (quarterIndex >= 0 && quarterIndex < 4) {
      quarters[quarterIndex].total += item.total
      quarters[quarterIndex].count += item.count
    }
  })

  return quarters
}

export function getQuarterlyCategoryStats(year: number, quarter: number): { name: string; color: string; total: number }[] {
  const database = getDatabase()
  const startMonth = (quarter - 1) * 3 + 1
  const endMonth = startMonth + 2

  return database.prepare(`
    SELECT 
      c.name as name,
      c.color as color,
      SUM(i.total_amount) as total
    FROM invoices i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE STRFTIME('%Y', i.invoice_date) = ?
      AND CAST(STRFTIME('%m', i.invoice_date) AS INTEGER) >= ?
      AND CAST(STRFTIME('%m', i.invoice_date) AS INTEGER) <= ?
    GROUP BY i.category_id
    ORDER BY total DESC
  `).all(String(year), startMonth, endMonth) as { name: string; color: string; total: number }[]
}
