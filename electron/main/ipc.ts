import { ipcMain, dialog } from 'electron'
import {
  addInvoice,
  updateInvoice,
  deleteInvoice,
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
  SearchParams
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

      const result: Record<string, string> = {
        invoice_code: extractField(text, /发票代码[:：]\s*(\d+)/),
        invoice_number: extractField(text, /发票号码[:：]\s*(\d+)/),
        invoice_date: extractField(text, /开票日期[:：]\s*(\d{4}[-\/年]\d{1,2}[-\/月]\d{1,2}日?)/),
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
}

function extractField(text: string, pattern: RegExp): string {
  const match = text.match(pattern)
  return match ? match[1].trim() : ''
}
