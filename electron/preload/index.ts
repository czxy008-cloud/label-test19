import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  invoice: {
    add: (invoice: any) => ipcRenderer.invoke('invoice:add', invoice),
    update: (id: number, invoice: any) => ipcRenderer.invoke('invoice:update', id, invoice),
    delete: (id: number) => ipcRenderer.invoke('invoice:delete', id),
    getById: (id: number) => ipcRenderer.invoke('invoice:getById', id),
    search: (params: any) => ipcRenderer.invoke('invoice:search', params),
    parsePdf: (filePath: string) => ipcRenderer.invoke('invoice:parsePdf', filePath),
    openFile: () => ipcRenderer.invoke('invoice:openFile'),
    export: (invoices: any[], format: 'csv' | 'excel') => ipcRenderer.invoke('invoice:export', invoices, format)
  },
  category: {
    getAll: () => ipcRenderer.invoke('category:getAll'),
    add: (name: string, description: string, color: string) => ipcRenderer.invoke('category:add', name, description, color),
    update: (id: number, name: string, description: string, color: string) => ipcRenderer.invoke('category:update', id, name, description, color),
    delete: (id: number) => ipcRenderer.invoke('category:delete', id)
  },
  stats: {
    monthly: (year: number) => ipcRenderer.invoke('stats:monthly', year),
    category: (startDate: string, endDate: string) => ipcRenderer.invoke('stats:category', startDate, endDate),
    years: () => ipcRenderer.invoke('stats:years'),
    quarterly: (year: number) => ipcRenderer.invoke('stats:quarterly', year),
    quarterlyCategory: (year: number, quarter: number) => ipcRenderer.invoke('stats:quarterlyCategory', year, quarter)
  }
})
