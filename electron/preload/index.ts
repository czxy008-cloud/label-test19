import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  invoice: {
    add: (invoice: any) => ipcRenderer.invoke('invoice:add', invoice),
    update: (id: number, invoice: any) => ipcRenderer.invoke('invoice:update', id, invoice),
    delete: (id: number) => ipcRenderer.invoke('invoice:delete', id),
    batchDelete: (ids: number[]) => ipcRenderer.invoke('invoice:batchDelete', ids),
    batchUpdateCategory: (ids: number[], categoryId: number | null) => ipcRenderer.invoke('invoice:batchUpdateCategory', ids, categoryId),
    batchUpdateReimbursePerson: (ids: number[], reimbursePersonId: number | null) => ipcRenderer.invoke('invoice:batchUpdateReimbursePerson', ids, reimbursePersonId),
    batchUpdateStatus: (ids: number[], status: string) => ipcRenderer.invoke('invoice:batchUpdateStatus', ids, status),
    getById: (id: number) => ipcRenderer.invoke('invoice:getById', id),
    search: (params: any) => ipcRenderer.invoke('invoice:search', params),
    parsePdf: (filePath: string) => ipcRenderer.invoke('invoice:parsePdf', filePath),
    openFile: () => ipcRenderer.invoke('invoice:openFile'),
    openPath: (filePath: string) => ipcRenderer.invoke('invoice:openPath', filePath),
    export: (invoices: any[], format: 'csv' | 'excel') => ipcRenderer.invoke('invoice:export', invoices, format),
    exportByReimbursePerson: (startDate: string, endDate: string, format: 'csv' | 'excel') => ipcRenderer.invoke('invoice:exportByReimbursePerson', startDate, endDate, format),
    setFavorite: (invoiceId: number, isFavorite: number) => ipcRenderer.invoke('invoice:setFavorite', invoiceId, isFavorite)
  },
  category: {
    getAll: () => ipcRenderer.invoke('category:getAll'),
    add: (name: string, description: string, color: string) => ipcRenderer.invoke('category:add', name, description, color),
    update: (id: number, name: string, description: string, color: string) => ipcRenderer.invoke('category:update', id, name, description, color),
    delete: (id: number) => ipcRenderer.invoke('category:delete', id)
  },
  reimbursePerson: {
    getAll: () => ipcRenderer.invoke('reimbursePerson:getAll'),
    add: (name: string, department: string, remark: string) => ipcRenderer.invoke('reimbursePerson:add', name, department, remark),
    update: (id: number, name: string, department: string, remark: string) => ipcRenderer.invoke('reimbursePerson:update', id, name, department, remark),
    delete: (id: number) => ipcRenderer.invoke('reimbursePerson:delete', id)
  },
  invoiceSet: {
    getAll: () => ipcRenderer.invoke('invoiceSet:getAll'),
    add: (name: string, description: string, color: string) => ipcRenderer.invoke('invoiceSet:add', name, description, color),
    update: (id: number, name: string, description: string, color: string) => ipcRenderer.invoke('invoiceSet:update', id, name, description, color),
    delete: (id: number) => ipcRenderer.invoke('invoiceSet:delete', id),
    addInvoice: (setId: number, invoiceId: number) => ipcRenderer.invoke('invoiceSet:addInvoice', setId, invoiceId),
    removeInvoice: (setId: number, invoiceId: number) => ipcRenderer.invoke('invoiceSet:removeInvoice', setId, invoiceId),
    getForInvoice: (invoiceId: number) => ipcRenderer.invoke('invoiceSet:getForInvoice', invoiceId)
  },
  stats: {
    monthly: (year: number) => ipcRenderer.invoke('stats:monthly', year),
    category: (startDate: string, endDate: string) => ipcRenderer.invoke('stats:category', startDate, endDate),
    reimbursePerson: (startDate: string, endDate: string) => ipcRenderer.invoke('stats:reimbursePerson', startDate, endDate),
    invoiceSet: (startDate: string, endDate: string) => ipcRenderer.invoke('stats:invoiceSet', startDate, endDate),
    years: () => ipcRenderer.invoke('stats:years'),
    quarterly: (year: number) => ipcRenderer.invoke('stats:quarterly', year),
    quarterlyCategory: (year: number, quarter: number) => ipcRenderer.invoke('stats:quarterlyCategory', year, quarter)
  },
  logs: {
    get: (params: any) => ipcRenderer.invoke('logs:get', params),
    getTypes: () => ipcRenderer.invoke('logs:getTypes'),
    deleteBefore: (beforeDate: string) => ipcRenderer.invoke('logs:deleteBefore', beforeDate)
  }
})
