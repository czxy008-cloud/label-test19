declare global {
  interface Window {
    electronAPI: {
      invoice: {
        add: (invoice: any) => Promise<any>
        update: (id: number, invoice: any) => Promise<void>
        delete: (id: number) => Promise<void>
        batchDelete: (ids: number[]) => Promise<void>
        batchUpdateCategory: (ids: number[], categoryId: number | null) => Promise<void>
        batchUpdateReimbursePerson: (ids: number[], reimbursePersonId: number | null) => Promise<void>
        batchUpdateStatus: (ids: number[], status: string) => Promise<void>
        getById: (id: number) => Promise<any>
        search: (params: any) => Promise<any[]>
        parsePdf: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>
        openFile: () => Promise<string | null>
        openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>
        export: (invoices: any[], format: 'csv' | 'excel') => Promise<{ success: boolean; filePath?: string; error?: string }>
        exportByReimbursePerson: (startDate: string, endDate: string, format: 'csv' | 'excel') => Promise<{ success: boolean; filePath?: string; error?: string }>
        setFavorite: (invoiceId: number, isFavorite: number) => Promise<void>
      }
      category: {
        getAll: () => Promise<any[]>
        add: (name: string, description: string, color: string) => Promise<any>
        update: (id: number, name: string, description: string, color: string) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      reimbursePerson: {
        getAll: () => Promise<any[]>
        add: (name: string, department: string, remark: string) => Promise<any>
        update: (id: number, name: string, department: string, remark: string) => Promise<void>
        delete: (id: number) => Promise<void>
      }
      invoiceSet: {
        getAll: () => Promise<any[]>
        add: (name: string, description: string, color: string) => Promise<any>
        update: (id: number, name: string, description: string, color: string) => Promise<void>
        delete: (id: number) => Promise<void>
        addInvoice: (setId: number, invoiceId: number) => Promise<void>
        removeInvoice: (setId: number, invoiceId: number) => Promise<void>
        getForInvoice: (invoiceId: number) => Promise<any[]>
      }
      stats: {
        monthly: (year: number) => Promise<any[]>
        category: (startDate: string, endDate: string) => Promise<any[]>
        reimbursePerson: (startDate: string, endDate: string) => Promise<any[]>
        invoiceSet: (startDate: string, endDate: string) => Promise<any[]>
        years: () => Promise<number[]>
        quarterly: (year: number) => Promise<any[]>
        quarterlyCategory: (year: number, quarter: number) => Promise<any[]>
      }
      logs: {
        get: (params: any) => Promise<any[]>
        getTypes: () => Promise<string[]>
        deleteBefore: (beforeDate: string) => Promise<number>
      }
    }
  }
}

export {}
