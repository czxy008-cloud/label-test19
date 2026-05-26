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
  reimburse_person_id: number | null
  is_favorite: number
  status: string
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

export interface InvoiceSet {
  id: number
  name: string
  description: string
  color: string
  created_at: string
}

export interface InvoiceSetMember {
  id: number
  set_id: number
  invoice_id: number
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
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#1890ff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reimburse_persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#1890ff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoice_set_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      set_id INTEGER NOT NULL,
      invoice_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (set_id) REFERENCES invoice_sets(id) ON DELETE CASCADE,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      UNIQUE(set_id, invoice_id)
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
      reimburse_person_id INTEGER,
      is_favorite INTEGER DEFAULT 0,
      status TEXT DEFAULT 'normal',
      remark TEXT,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (reimburse_person_id) REFERENCES reimburse_persons(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      operation_object TEXT NOT NULL,
      operation_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
    CREATE INDEX IF NOT EXISTS idx_invoices_category ON invoices(category_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_reimburse ON invoices(reimburse_person_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_total ON invoices(total_amount);
    CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoices_favorite ON invoices(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_set_members_set ON invoice_set_members(set_id);
    CREATE INDEX IF NOT EXISTS idx_set_members_invoice ON invoice_set_members(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_logs_type ON operation_logs(operation_type);
    CREATE INDEX IF NOT EXISTS idx_logs_date ON operation_logs(created_at);
  `)

  const pragma = db.prepare('PRAGMA table_info(invoices)')
  const columns = pragma.all() as { name: string }[]
  const hasReimburseColumn = columns.some(col => col.name === 'reimburse_person_id')
  if (!hasReimburseColumn) {
    db.exec('ALTER TABLE invoices ADD COLUMN reimburse_person_id INTEGER')
  }
  const hasFavoriteColumn = columns.some(col => col.name === 'is_favorite')
  if (!hasFavoriteColumn) {
    db.exec('ALTER TABLE invoices ADD COLUMN is_favorite INTEGER DEFAULT 0')
  }
  const hasStatusColumn = columns.some(col => col.name === 'status')
  if (!hasStatusColumn) {
    db.exec("ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'normal'")
  }

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

  cleanupOrphanedRecords()
}

export function cleanupOrphanedRecords(): void {
  const database = getDatabase()
  database.exec(`
    DELETE FROM invoice_set_members 
    WHERE invoice_id NOT IN (SELECT id FROM invoices)
       OR set_id NOT IN (SELECT id FROM invoice_sets);
  `)
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
      category_id, reimburse_person_id, is_favorite, status, remark, file_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    invoice.invoice_code, invoice.invoice_number, invoice.invoice_date,
    invoice.amount, invoice.tax_amount, invoice.total_amount,
    invoice.seller_name, invoice.seller_tax_id,
    invoice.buyer_name, invoice.buyer_tax_id,
    invoice.category_id, invoice.reimburse_person_id,
    invoice.is_favorite || 0, invoice.status || 'normal',
    invoice.remark, invoice.file_path
  )
  const newInvoice = database.prepare('SELECT * FROM invoices WHERE id = ?').get(result.lastInsertRowid) as Invoice
  addOperationLog('新增发票', `发票ID: ${result.lastInsertRowid}`, `发票号码: ${invoice.invoice_number}, 金额: ${invoice.total_amount}`)
  return newInvoice
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
  addOperationLog('修改发票', `发票ID: ${id}`, `修改字段: ${Object.keys(invoice).join(', ')}`)
}

export function deleteInvoice(id: number): void {
  const database = getDatabase()
  const invoice = database.prepare('SELECT invoice_number, total_amount FROM invoices WHERE id = ?').get(id) as any
  database.prepare('DELETE FROM invoice_set_members WHERE invoice_id = ?').run(id)
  database.prepare('DELETE FROM invoices WHERE id = ?').run(id)
  addOperationLog('删除发票', `发票ID: ${id}`, `发票号码: ${invoice?.invoice_number || '未知'}, 金额: ${invoice?.total_amount || 0}`)
}

export function batchDeleteInvoices(ids: number[]): void {
  const database = getDatabase()
  const deleteMemberStmt = database.prepare('DELETE FROM invoice_set_members WHERE invoice_id = ?')
  const deleteInvoiceStmt = database.prepare('DELETE FROM invoices WHERE id = ?')
  const details: string[] = []
  ids.forEach(id => {
    const invoice = database.prepare('SELECT invoice_number, total_amount FROM invoices WHERE id = ?').get(id) as any
    if (invoice) {
      details.push(`${invoice.invoice_number}(${invoice.total_amount})`)
    }
    deleteMemberStmt.run(id)
    deleteInvoiceStmt.run(id)
  })
  addOperationLog('批量删除', `发票数量: ${ids.length}`, `发票信息: ${details.join(', ')}`)
}

export function getInvoiceById(id: number): Invoice | undefined {
  const database = getDatabase()
  return database.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as Invoice | undefined
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

export function searchInvoices(params: SearchParams): Invoice[] {
  const database = getDatabase()
  const conditions: string[] = []
  const values: any[] = []

  if (params.keyword) {
    conditions.push(`(
      i.invoice_code LIKE ? OR
      i.invoice_number LIKE ? OR
      i.seller_name LIKE ? OR
      i.buyer_name LIKE ? OR
      i.remark LIKE ?
    )`)
    const like = `%${params.keyword}%`
    values.push(like, like, like, like, like)
  }

  if (params.category_id) {
    conditions.push('i.category_id = ?')
    values.push(params.category_id)
  }

  if (params.reimburse_person_id) {
    conditions.push('i.reimburse_person_id = ?')
    values.push(params.reimburse_person_id)
  }

  if (params.set_id) {
    conditions.push('EXISTS (SELECT 1 FROM invoice_set_members m WHERE m.invoice_id = i.id AND m.set_id = ?)')
    values.push(params.set_id)
  }

  if (params.is_favorite !== null && params.is_favorite !== undefined) {
    conditions.push('i.is_favorite = ?')
    values.push(params.is_favorite)
  }

  if (params.start_date) {
    conditions.push('i.invoice_date >= ?')
    values.push(params.start_date)
  }

  if (params.end_date) {
    conditions.push('i.invoice_date <= ?')
    values.push(params.end_date)
  }

  if (params.min_amount !== null && params.min_amount !== undefined) {
    conditions.push('i.total_amount >= ?')
    values.push(params.min_amount)
  }

  if (params.max_amount !== null && params.max_amount !== undefined) {
    conditions.push('i.total_amount <= ?')
    values.push(params.max_amount)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return database.prepare(`SELECT i.* FROM invoices i ${where} ORDER BY i.invoice_date DESC`).all(...values) as Invoice[]
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

export function getAllReimbursePersons(): ReimbursePerson[] {
  const database = getDatabase()
  return database.prepare('SELECT * FROM reimburse_persons ORDER BY id').all() as ReimbursePerson[]
}

export function addReimbursePerson(name: string, department: string, remark: string): ReimbursePerson {
  const database = getDatabase()
  const result = database.prepare('INSERT INTO reimburse_persons (name, department, remark) VALUES (?, ?, ?)').run(name, department, remark)
  return database.prepare('SELECT * FROM reimburse_persons WHERE id = ?').get(result.lastInsertRowid) as ReimbursePerson
}

export function updateReimbursePerson(id: number, name: string, department: string, remark: string): void {
  const database = getDatabase()
  database.prepare('UPDATE reimburse_persons SET name = ?, department = ?, remark = ? WHERE id = ?').run(name, department, remark, id)
}

export function deleteReimbursePerson(id: number): void {
  const database = getDatabase()
  database.prepare('UPDATE invoices SET reimburse_person_id = NULL WHERE reimburse_person_id = ?').run(id)
  database.prepare('DELETE FROM reimburse_persons WHERE id = ?').run(id)
}

export function getReimbursePersonStats(startDate: string, endDate: string): { name: string; department: string; total: number; count: number }[] {
  const database = getDatabase()
  return database.prepare(`
    SELECT 
      rp.name as name,
      rp.department as department,
      SUM(i.total_amount) as total,
      COUNT(*) as count
    FROM invoices i
    LEFT JOIN reimburse_persons rp ON i.reimburse_person_id = rp.id
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
      AND rp.id IS NOT NULL
    GROUP BY i.reimburse_person_id
    ORDER BY total DESC
  `).all(startDate, endDate) as { name: string; department: string; total: number; count: number }[]
}

export function getReimbursePersonGroupedInvoices(startDate: string, endDate: string): any[] {
  const database = getDatabase()
  return database.prepare(`
    SELECT 
      rp.name as reimburse_person,
      rp.department,
      i.invoice_code,
      i.invoice_number,
      i.invoice_date,
      i.seller_name,
      i.total_amount,
      i.remark
    FROM invoices i
    LEFT JOIN reimburse_persons rp ON i.reimburse_person_id = rp.id
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
    ORDER BY rp.name, i.invoice_date DESC
  `).all(startDate, endDate)
}

export function addOperationLog(operationType: string, operationObject: string, operationDetails: string): void {
  const database = getDatabase()
  database.prepare('INSERT INTO operation_logs (operation_type, operation_object, operation_details) VALUES (?, ?, ?)').run(operationType, operationObject, operationDetails)
}

export interface LogSearchParams {
  operation_type?: string | null
  start_date?: string | null
  end_date?: string | null
}

export function getOperationLogs(params: LogSearchParams): OperationLog[] {
  const database = getDatabase()
  const conditions: string[] = []
  const values: any[] = []

  if (params.operation_type) {
    conditions.push('operation_type = ?')
    values.push(params.operation_type)
  }

  if (params.start_date) {
    conditions.push('DATE(created_at) >= ?')
    values.push(params.start_date)
  }

  if (params.end_date) {
    conditions.push('DATE(created_at) <= ?')
    values.push(params.end_date)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  return database.prepare(`SELECT * FROM operation_logs ${where} ORDER BY created_at DESC`).all(...values) as OperationLog[]
}

export function deleteLogsBeforeDate(beforeDate: string): number {
  const database = getDatabase()
  const result = database.prepare('DELETE FROM operation_logs WHERE DATE(created_at) <= ?').run(beforeDate)
  return result.changes ?? 0
}

export function getOperationTypes(): string[] {
  const database = getDatabase()
  const result = database.prepare('SELECT DISTINCT operation_type FROM operation_logs ORDER BY operation_type').all() as { operation_type: string }[]
  return result.map(r => r.operation_type)
}

export function getAllInvoiceSets(): (InvoiceSet & { invoice_count: number; total_amount: number })[] {
  const database = getDatabase()
  return database.prepare(`
    SELECT 
      s.*,
      COUNT(m.invoice_id) as invoice_count,
      COALESCE(SUM(i.total_amount), 0) as total_amount
    FROM invoice_sets s
    LEFT JOIN invoice_set_members m ON s.id = m.set_id
    LEFT JOIN invoices i ON m.invoice_id = i.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all() as (InvoiceSet & { invoice_count: number; total_amount: number })[]
}

export function addInvoiceSet(name: string, description: string, color: string): InvoiceSet {
  const database = getDatabase()
  const result = database.prepare('INSERT INTO invoice_sets (name, description, color) VALUES (?, ?, ?)').run(name, description, color)
  const newSet = database.prepare('SELECT * FROM invoice_sets WHERE id = ?').get(result.lastInsertRowid) as InvoiceSet
  addOperationLog('新增发票集', `集合ID: ${result.lastInsertRowid}`, `集合名称: ${name}`)
  return newSet
}

export function updateInvoiceSet(id: number, name: string, description: string, color: string): void {
  const database = getDatabase()
  database.prepare('UPDATE invoice_sets SET name = ?, description = ?, color = ? WHERE id = ?').run(name, description, color, id)
  addOperationLog('修改发票集', `集合ID: ${id}`, `集合名称: ${name}`)
}

export function deleteInvoiceSet(id: number): void {
  const database = getDatabase()
  const set = database.prepare('SELECT name FROM invoice_sets WHERE id = ?').get(id) as any
  database.prepare('DELETE FROM invoice_set_members WHERE set_id = ?').run(id)
  database.prepare('DELETE FROM invoice_sets WHERE id = ?').run(id)
  addOperationLog('删除发票集', `集合ID: ${id}`, `集合名称: ${set?.name || '未知'}`)
}

export function addInvoiceToSet(setId: number, invoiceId: number): void {
  const database = getDatabase()
  database.prepare('INSERT OR IGNORE INTO invoice_set_members (set_id, invoice_id) VALUES (?, ?)').run(setId, invoiceId)
}

export function removeInvoiceFromSet(setId: number, invoiceId: number): void {
  const database = getDatabase()
  database.prepare('DELETE FROM invoice_set_members WHERE set_id = ? AND invoice_id = ?').run(setId, invoiceId)
}

export function getInvoiceSetsForInvoice(invoiceId: number): InvoiceSet[] {
  const database = getDatabase()
  return database.prepare(`
    SELECT s.* FROM invoice_sets s
    JOIN invoice_set_members m ON s.id = m.set_id
    WHERE m.invoice_id = ?
  `).all(invoiceId) as InvoiceSet[]
}

export function setInvoiceFavorite(invoiceId: number, isFavorite: number): void {
  const database = getDatabase()
  database.prepare('UPDATE invoices SET is_favorite = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(isFavorite, invoiceId)
}

export function getSetStats(startDate: string, endDate: string): { name: string; color: string; total: number; count: number; unique_total: number }[] {
  const database = getDatabase()

  const uniqueTotalResult = database.prepare(`
    SELECT i.total_amount
    FROM invoices i
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
      AND EXISTS (SELECT 1 FROM invoice_set_members m WHERE m.invoice_id = i.id)
    GROUP BY i.id
  `).all(startDate, endDate) as { total_amount: number }[]

  const uniqueTotal = uniqueTotalResult.reduce((sum, item) => sum + (item.total_amount || 0), 0)

  const setStats = database.prepare(`
    SELECT 
      s.name as name,
      s.color as color,
      SUM(i.total_amount) as total,
      COUNT(i.id) as count
    FROM invoice_sets s
    LEFT JOIN invoice_set_members m ON s.id = m.set_id
    LEFT JOIN invoices i ON m.invoice_id = i.id
    WHERE i.invoice_date >= ? AND i.invoice_date <= ?
    GROUP BY s.id
    ORDER BY total DESC
  `).all(startDate, endDate) as { name: string; color: string; total: number; count: number }[]

  return setStats.map(item => ({
    ...item,
    unique_total: uniqueTotal
  }))
}

export function batchUpdateCategory(ids: number[], categoryId: number | null): void {
  const database = getDatabase()
  const stmt = database.prepare('UPDATE invoices SET category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
  const details: string[] = []
  ids.forEach(id => {
    const invoice = database.prepare('SELECT invoice_number FROM invoices WHERE id = ?').get(id) as any
    if (invoice) {
      details.push(invoice.invoice_number)
    }
    stmt.run(categoryId, id)
  })
  addOperationLog('批量修改分类', `发票数量: ${ids.length}`, `发票号码: ${details.join(', ')}`)
}

export function batchUpdateReimbursePerson(ids: number[], reimbursePersonId: number | null): void {
  const database = getDatabase()
  const stmt = database.prepare('UPDATE invoices SET reimburse_person_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
  const details: string[] = []
  ids.forEach(id => {
    const invoice = database.prepare('SELECT invoice_number FROM invoices WHERE id = ?').get(id) as any
    if (invoice) {
      details.push(invoice.invoice_number)
    }
    stmt.run(reimbursePersonId, id)
  })
  addOperationLog('批量修改报销人', `发票数量: ${ids.length}`, `发票号码: ${details.join(', ')}`)
}

export function batchUpdateStatus(ids: number[], status: string): void {
  const database = getDatabase()
  const stmt = database.prepare('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
  const details: string[] = []
  ids.forEach(id => {
    const invoice = database.prepare('SELECT invoice_number FROM invoices WHERE id = ?').get(id) as any
    if (invoice) {
      details.push(invoice.invoice_number)
    }
    stmt.run(status, id)
  })
  addOperationLog('批量修改状态', `发票数量: ${ids.length}`, `新状态: ${status}, 发票号码: ${details.join(', ')}`)
}
