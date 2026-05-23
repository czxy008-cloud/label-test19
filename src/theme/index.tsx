import React from 'react'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

export interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

export const ThemeContext = React.createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {}
})

export const useTheme = () => React.useContext(ThemeContext)

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = React.useState(() => {
    const saved = localStorage.getItem('theme')
    return saved === 'dark'
  })

  const toggleTheme = React.useCallback(() => {
    setIsDark(prev => {
      const newValue = !prev
      localStorage.setItem('theme', newValue ? 'dark' : 'light')
      return newValue
    })
  }, [])

  const themeConfig = React.useMemo(() => ({
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 6,
      fontSize: 14
    },
    components: {
      Layout: {
        headerBg: isDark ? '#141414' : '#ffffff',
        siderBg: isDark ? '#1f1f1f' : '#fafafa'
      },
      Table: {
        headerBg: isDark ? '#1f1f1f' : '#fafafa'
      }
    }
  }), [isDark])

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  )
}
