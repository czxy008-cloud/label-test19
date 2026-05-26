import { ipcMain, dialog, shell } from 'electron'
import {
  addInvoice,
  updateInvoice,
  deleteInvoice,
  batchDeleteInvoices,
  getInvoiceById,
  searchInvoices,
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getMonthlyStats,
  getCategoryStats,
  getAvailableYears,
  getQuarterlyStats,
  getQuarterlyCategoryStats,
  getAllReimbursePersons,
  addReimbursePerson,
  updateReimbursePerson,
  deleteReimbursePerson,
  getReimbursePersonStats,
  getReimbursePersonGroupedInvoices,
  getOperationLogs,
  deleteLogsBeforeDate,
  getOperationTypes,
  getAllInvoiceSets,
  addInvoiceSet,
  updateInvoiceSet,
  deleteInvoiceSet,
  addInvoiceToSet,
  removeInvoiceFromSet,
  getInvoiceSetsForInvoice,
  setInvoiceFavorite,
  getSetStats,
  batchUpdateCategory,
  batchUpdateReimbursePerson,
  batchUpdateStatus,
  SearchParams,
  LogSearchParams
} from './db'
import * as XLSX from 'xlsx'
import fs from 'node:fs'
import path from 'node:path'
import pdfParse from 'pdf-parse'

export function setupIpcHandlers(): void {
  ipcMain.handle('invoice:add', (_event, invoice) => {
    return addInvoice(invoice)
  })

  ipcMain.handle('invoice:update', (_event, id, invoice) => {
    return updateInvoice(id, invoice)
  })

  ipcMain.handle('invoice:delete', (_event, id) => {
    return deleteInvoice(id)
  })

  ipcMain.handle('invoice:getById', (_event, id) => {
    return getInvoiceById(id)
  })

  ipcMain.handle('invoice:search', (_event, params: SearchParams) => {
    return searchInvoices(params)
  })

  ipcMain.handle('invoice:parsePdf', async (_event, filePath: string) => {
    try {
      const dataBuffer = fs.readFileSync(filePath)
      const data = await pdfParse(dataBuffer)
      const text = data.text

      const rawDate = extractField(text, /开票日期[:：]\s*(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}日?)/)
      const normalizedDate = normalizeDate(rawDate)

      const result: Record<string, string> = {
        invoice_code: extractField(text, /发票代码[:：]\s*(\d+)/),
        invoice_number: extractField(text, /发票号码[:：]\s*(\d+)/),
        invoice_date: normalizedDate,
        seller_name: extractField(text, /销售方[^名]*名称[:：]\s*(.+)/),
        seller_tax_id: extractField(text, /销售方[^税]*纳税人识别号[:：]\s*(\w+)/),
        buyer_name: extractField(text, /购买方[^名]*名称[:：]\s*(.+)/),
        buyer_tax_id: extractField(text, /购买方[^税]*纳税人识别号[:：]\s*(\w+)/),
        amount: extractField(text, /金额[^合]*合计[:：]\s*[¥￥]?\s*([\d.]+)/),
        tax_amount: extractField(text, /税额[^合]*合计[:：]\s*[¥￥]?\s*([\d.]+)/),
        total_amount: extractField(text, /价税合计[^金]*金额[:：]\s*[¥￥]?\s*([\d.]+)/)
      }

      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('invoice:openFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'PDF 文件', extensions: ['pdf'] },
        { name: '所有文件', extensions: ['*'] }
      ]
    })
    if (result.canceled) {
      return null
    }
    return result.filePaths[0]
  })

  ipcMain.handle('invoice:openPath', async (_event, filePath: string) => {
    try {
      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('invoice:export', async (_event, invoices, format: 'csv' | 'excel') => {
    const result = await dialog.showSaveDialog({
      filters: format === 'csv'
        ? [{ name: 'CSV 文件', extensions: ['csv'] }]
        : [{ name: 'Excel 文件', extensions: ['xlsx'] }],
      defaultPath: `发票数据_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`
    })

    if (result.canceled || !result.filePath) {
      return { success: false }
    }

    try {
      const exportData = invoices.map((inv: any) => ({
        '发票代码': inv.invoice_code || '',
        '发票号码': inv.invoice_number || '',
        '开票日期': inv.invoice_date || '',
        '销售方名称': inv.seller_name || '',
        '销售方税号': inv.seller_tax_id || '',
        '购买方名称': inv.buyer_name || '',
        '购买方税号': inv.buyer_tax_id || '',
        '金额': inv.amount || 0,
        '税额': inv.tax_amount || 0,
        '价税合计': inv.total_amount || 0,
        '备注': inv.remark || ''
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '发票数据')

      if (format === 'csv') {
        XLSX.writeFile(workbook, result.filePath, { bookType: 'csv' })
      } else {
        XLSX.writeFile(workbook, result.filePath, { bookType: 'xlsx' })
      }

      return { success: true, filePath: result.filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('category:getAll', () => {
    return getAllCategories()
  })

  ipcMain.handle('category:add', (_event, name, description, color) => {
    return addCategory(name, description, color)
  })

  ipcMain.handle('category:update', (_event, id, name, description, color) => {
    return updateCategory(id, name, description, color)
  })

  ipcMain.handle('category:delete', (_event, id) => {
    return deleteCategory(id)
  })

  ipcMain.handle('stats:monthly', (_event, year: number) => {
    return getMonthlyStats(year)
  })

  ipcMain.handle('stats:category', (_event, startDate: string, endDate: string) => {
    return getCategoryStats(startDate, endDate)
  })

  ipcMain.handle('stats:years', () => {
    return getAvailableYears()
  })

  ipcMain.handle('stats:quarterly', (_event, year: number) => {
    return getQuarterlyStats(year)
  })

  ipcMain.handle('stats:quarterlyCategory', (_event, year: number, quarter: number) => {
    return getQuarterlyCategoryStats(year, quarter)
  })

  ipcMain.handle('invoice:batchDelete', (_event, ids: number[]) => {
    return batchDeleteInvoices(ids)
  })

  ipcMain.handle('reimbursePerson:getAll', () => {
    return getAllReimbursePersons()
  })

  ipcMain.handle('reimbursePerson:add', (_event, name, department, remark) => {
    return addReimbursePerson(name, department, remark)
  })

  ipcMain.handle('reimbursePerson:update', (_event, id, name, department, remark) => {
    return updateReimbursePerson(id, name, department, remark)
  })

  ipcMain.handle('reimbursePerson:delete', (_event, id) => {
    return deleteReimbursePerson(id)
  })

  ipcMain.handle('stats:reimbursePerson', (_event, startDate: string, endDate: string) => {
    return getReimbursePersonStats(startDate, endDate)
  })

  ipcMain.handle('invoice:exportByReimbursePerson', async (_event, startDate: string, endDate: string, format: 'csv' | 'excel') => {
    const result = await dialog.showSaveDialog({
      filters: format === 'csv'
        ? [{ name: 'CSV 文件', extensions: ['csv'] }]
        : [{ name: 'Excel 文件', extensions: ['xlsx'] }],
      defaultPath: `按报销人分组汇总_${Date.now()}.${format === 'csv' ? 'csv' : 'xlsx'}`
    })

    if (result.canceled || !result.filePath) {
      return { success: false }
    }

    try {
      const invoices = getReimbursePersonGroupedInvoices(startDate, endDate)
      const exportData = invoices.map((inv: any) => ({
        '报销人': inv.reimburse_person || '未指定',
        '部门': inv.department || '',
        '发票代码': inv.invoice_code || '',
        '发票号码': inv.invoice_number || '',
        '开票日期': inv.invoice_date || '',
        '销售方名称': inv.seller_name || '',
        '价税合计': inv.total_amount || 0,
        '备注': inv.remark || ''
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '按报销人分组')

      if (format === 'csv') {
        XLSX.writeFile(workbook, result.filePath, { bookType: 'csv' })
      } else {
        XLSX.writeFile(workbook, result.filePath, { bookType: 'xlsx' })
      }

      return { success: true, filePath: result.filePath }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('logs:get', (_event, params: LogSearchParams) => {
    return getOperationLogs(params)
  })

  ipcMain.handle('logs:getTypes', () => {
    return getOperationTypes()
  })

  ipcMain.handle('logs:deleteBefore', (_event, beforeDate: string) => {
    return deleteLogsBeforeDate(beforeDate)
  })

  ipcMain.handle('invoiceSet:getAll', () => {
    return getAllInvoiceSets()
  })

  ipcMain.handle('invoiceSet:add', (_event, name: string, description: string, color: string) => {
    return addInvoiceSet(name, description, color)
  })

  ipcMain.handle('invoiceSet:update', (_event, id: number, name: string, description: string, color: string) => {
    return updateInvoiceSet(id, name, description, color)
  })

  ipcMain.handle('invoiceSet:delete', (_event, id: number) => {
    return deleteInvoiceSet(id)
  })

  ipcMain.handle('invoiceSet:addInvoice', (_event, setId: number, invoiceId: number) => {
    return addInvoiceToSet(setId, invoiceId)
  })

  ipcMain.handle('invoiceSet:removeInvoice', (_event, setId: number, invoiceId: number) => {
    return removeInvoiceFromSet(setId, invoiceId)
  })

  ipcMain.handle('invoiceSet:getForInvoice', (_event, invoiceId: number) => {
    return getInvoiceSetsForInvoice(invoiceId)
  })

  ipcMain.handle('invoice:setFavorite', (_event, invoiceId: number, isFavorite: number) => {
    return setInvoiceFavorite(invoiceId, isFavorite)
  })

  ipcMain.handle('stats:invoiceSet', (_event, startDate: string, endDate: string) => {
    return getSetStats(startDate, endDate)
  })

  ipcMain.handle('invoice:batchUpdateCategory', (_event, ids: number[], categoryId: number | null) => {
    return batchUpdateCategory(ids, categoryId)
  })

  ipcMain.handle('invoice:batchUpdateReimbursePerson', (_event, ids: number[], reimbursePersonId: number | null) => {
    return batchUpdateReimbursePerson(ids, reimbursePersonId)
  })

  ipcMain.handle('invoice:batchUpdateStatus', (_event, ids: number[], status: string) => {
    return batchUpdateStatus(ids, status)
  })
}

function extractField(text: string, pattern: RegExp): string {
  const match = text.match(pattern)
  return match ? match[1].trim() : ''
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return ''
  
  dateStr = dateStr.replace(/年|月|日/g, '-').replace(/\/+/g, '-')
  const parts = dateStr.split('-').filter(p => p)
  
  if (parts.length >= 3) {
    const year = parts[0].padStart(4, '0')
    const month = parts[1].padStart(2, '0')
    const day = parts[2].padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  return dateStr
}
