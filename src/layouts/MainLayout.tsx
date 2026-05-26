import React from 'react'
import { Layout, Menu, Button, Space } from 'antd'
import {
  FileTextOutlined,
  PlusOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BulbOutlined,
  BulbFilled,
  UserOutlined,
  HistoryOutlined,
  FolderOutlined
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../theme'

const { Header, Sider, Content } = Layout

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false)
  const { isDark, toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    {
      key: '/invoices',
      icon: <FileTextOutlined />,
      label: <Link to="/invoices">发票列表</Link>
    },
    {
      key: '/invoices/add',
      icon: <PlusOutlined />,
      label: <Link to="/invoices/add">新增发票</Link>
    },
    {
      key: '/categories',
      icon: <AppstoreOutlined />,
      label: <Link to="/categories">分类管理</Link>
    },
    {
      key: '/reimburse-persons',
      icon: <UserOutlined />,
      label: <Link to="/reimburse-persons">报销人管理</Link>
    },
    {
      key: '/invoice-sets',
      icon: <FolderOutlined />,
      label: <Link to="/invoice-sets">发票集管理</Link>
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: <Link to="/statistics">数据统计</Link>
    },
    {
      key: '/operation-logs',
      icon: <HistoryOutlined />,
      label: <Link to="/operation-logs">操作日志</Link>
    }
  ]

  const selectedKeys = location.pathname.includes('/invoices/edit')
    ? ['/invoices/add']
    : [location.pathname]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={200}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 14 : 18,
          fontWeight: 'bold',
          background: 'rgba(255,255,255,0.05)'
        }}>
          {collapsed ? '发票' : '电子发票管理器'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <Space>
            <Button
              type="text"
              icon={isDark ? <BulbFilled /> : <BulbOutlined />}
              onClick={toggleTheme}
            >
              {isDark ? '浅色' : '深色'}模式
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 16, padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
