import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Card,
  Row,
  Col,
  Tag,
  Modal,
  message,
  Popconfirm,
  Dropdown
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Invoice, Category, SearchParams } from '../types'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

const InvoiceList: React.FC = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [amountRange, setAmountRange] = useState<[number | null, number | null]>([null, null])

  const loadData = async (searchParams?: Partial<SearchParams>) => {
    setLoading(true)
    try {
      const params: SearchParams = searchParams || {
        keyword: keyword || undefined,
        category_id: categoryId || undefined,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        min_amount: amountRange[0] || undefined,
        max_amount: amountRange[1] || undefined
      }
      const data = await window.electronAPI.invoice.search(params)
      setInvoices(data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await window.electronAPI.category.getAll()
      setCategories(data)
    } catch (error) {
      message.error('加载分类失败')
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = () => {
    loadData()
  }

  const handleReset = () => {
    setKeyword('')
    setCategoryId(null)
    setDateRange(null)
    setAmountRange([null, null])
    loadData({})
  }

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.invoice.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const result = await window.electronAPI.invoice.export(invoices, format)
      if (result.success) {
        message.success('导出成功')
      } else if (result.error) {
        message.error(result.error)
      }
    } catch (error) {
      message.error('导出失败')
    }
  }

  const getCategoryColor = (categoryId: number | null) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.color || '#999'
  }

  const getCategoryName = (categoryId: number | null) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.name || '未分类'
  }

  const columns = [
    {
      title: '发票号码',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      width: 120
    },
    {
      title: '发票代码',
      dataIndex: 'invoice_code',
      key: 'invoice_code',
      width: 120
    },
    {
      title: '开票日期',
      dataIndex: 'invoice_date',
      key: 'invoice_date',
      width: 120,
      render: (text: string) => text ? dayjs(text).format('YYYY-MM-DD') : '-'
    },
    {
      title: '销售方',
      dataIndex: 'seller_name',
      key: 'seller_name',
      ellipsis: true
    },
    {
      title: '购买方',
      dataIndex: 'buyer_name',
      key: 'buyer_name',
      ellipsis: true
    },
    {
      title: '价税合计',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (value: number) => `¥${value?.toFixed(2) || '0.00'}`
    },
    {
      title: '分类',
      dataIndex: 'category_id',
      key: 'category_id',
      width: 100,
      render: (categoryId: number | null) => (
        <Tag color={getCategoryColor(categoryId)}>
          {getCategoryName(categoryId)}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Invoice) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/invoices/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这条发票记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">{invoices.length}</div>
            <div className="stat-label">发票总数</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">¥{totalAmount.toFixed(2)}</div>
            <div className="stat-label">总金额</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">{categories.length}</div>
            <div className="stat-label">分类数量</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">
              {invoices.length > 0
                ? `¥${(totalAmount / invoices.length).toFixed(2)}`
                : '¥0.00'}
            </div>
            <div className="stat-label">平均金额</div>
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索发票号码/代码/销售方/购买方"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="选择分类"
              value={categoryId || undefined}
              onChange={setCategoryId}
              style={{ width: '100%' }}
              allowClear
              options={categories.map(c => ({
                value: c.id,
                label: (
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: c.color,
                        marginRight: 8
                      }}
                    />
                    {c.name}
                  </span>
                )
              }))}
            />
          </Col>
          <Col span={6}>
            <RangePicker
              value={dateRange}
              onChange={dates => setDateRange(dates as [Dayjs, Dayjs] | null)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Space>
              <Input
                type="number"
                placeholder="最小金额"
                value={amountRange[0]?.toString()}
                onChange={e => setAmountRange([e.target.value ? Number(e.target.value) : null, amountRange[1]])}
                style={{ width: 100 }}
                allowClear
              />
              <span>-</span>
              <Input
                type="number"
                placeholder="最大金额"
                value={amountRange[1]?.toString()}
                onChange={e => setAmountRange([amountRange[0], e.target.value ? Number(e.target.value) : null])}
                style={{ width: 100 }}
                allowClear
              />
            </Space>
          </Col>
        </Row>
        <Row style={{ marginTop: 12 }}>
          <Col offset={18} span={6}>
            <Space style={{ float: 'right' }}>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        size="small"
        title="发票列表"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/invoices/add')}
            >
              新增发票
            </Button>
            <Dropdown
              menu={{
                items: [
                  { key: 'csv', label: '导出 CSV', onClick: () => handleExport('csv') },
                  { key: 'excel', label: '导出 Excel', onClick: () => handleExport('excel') }
                ]
              }}
            >
              <Button icon={<ExportOutlined />}>
                导出
              </Button>
            </Dropdown>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={invoices}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
        />
      </Card>
    </div>
  )
}

export default InvoiceList
