declare global {
  interface Window {
    electronAPI: {
      invoice: {
        add: (invoice: any) => Promise<any>
        update: (id: number, invoice: any) => Promise<void>
        delete: (id: number) => Promise<void>
        getById: (id: number) => Promise<any>
        search: (params: any) => Promise<any[]>
        parsePdf: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>
        openFile: () => Promise<string | null>
        export: (invoices: any[], format: 'csv' | 'excel') => Promise<{ success: boolean; filePath?: string; error?: string }>
      }
      category: {
        getAll: () => Promise<any[]>
        add: (name: string, description: string, color: string) => Promise<any>
        update: (id: number, name: string, description: string, color: string) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      stats: {
        monthly: (year: number) => Promise<any[]>
        category: (startDate: string, endDate: string) => Promise<any[]>
        years: () => Promise<number[]>
        quarterly: (year: number) => Promise<any[]>
        quarterlyCategory: (year: number, quarter: number) => Promise<any[]>
      }
    }
  }
}

export {}
