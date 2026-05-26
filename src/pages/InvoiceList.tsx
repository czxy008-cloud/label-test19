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
  Dropdown,
  Checkbox,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  StarOutlined,
  StarFilled,
  FolderAddOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  SettingOutlined,
  FileOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { Invoice, Category, ReimbursePerson, SearchParams, InvoiceSet } from '../types'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

const statusOptions = [
  { value: 'normal', label: '正常', color: '#52c41a' },
  { value: 'pending', label: '待报销', color: '#fa8c16' },
  { value: 'reimbursed', label: '已报销', color: '#1677ff' },
  { value: 'void', label: '已作废', color: '#f5222d' }
]

const getStatusInfo = (status: string) => {
  return statusOptions.find(s => s.value === status) || statusOptions[0]
}

const InvoiceList: React.FC = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [reimbursePersons, setReimbursePersons] = useState<ReimbursePerson[]>([])
  const [invoiceSets, setInvoiceSets] = useState<InvoiceSet[]>([])
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [reimbursePersonId, setReimbursePersonId] = useState<number | null>(null)
  const [setId, setSetId] = useState<number | null>(null)
  const [isFavorite, setIsFavorite] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [amountRange, setAmountRange] = useState<[number | null, number | null]>([null, null])

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [categoryModalVisible, setCategoryModalVisible] = useState(false)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [addToSetModalVisible, setAddToSetModalVisible] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null)
  const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null)
  const [invoiceSetsMap, setInvoiceSetsMap] = useState<Record<number, InvoiceSet[]>>({})

  const loadData = async (searchParams?: Partial<SearchParams>) => {
    setLoading(true)
    try {
      const params: SearchParams = searchParams || {
        keyword: keyword || undefined,
        category_id: categoryId || undefined,
        reimburse_person_id: reimbursePersonId || undefined,
        set_id: setId || undefined,
        is_favorite: isFavorite ?? undefined,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
        min_amount: amountRange[0] !== null && amountRange[0] !== undefined ? amountRange[0] : undefined,
        max_amount: amountRange[1] !== null && amountRange[1] !== undefined ? amountRange[1] : undefined
      }
      const data = await window.electronAPI.invoice.search(params)
      setInvoices(data)
      setSelectedRowKeys([])
      loadInvoiceSetsForInvoices(data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadInvoiceSetsForInvoices = async (invoiceList: Invoice[]) => {
    const map: Record<number, InvoiceSet[]> = {}
    for (const inv of invoiceList) {
      try {
        const sets = await window.electronAPI.invoiceSet.getForInvoice(inv.id)
        map[inv.id] = sets
      } catch (e) {
        map[inv.id] = []
      }
    }
    setInvoiceSetsMap(map)
  }

  const loadCategories = async () => {
    try {
      const data = await window.electronAPI.category.getAll()
      setCategories(data)
    } catch (error) {
      message.error('加载分类失败')
    }
  }

  const loadReimbursePersons = async () => {
    try {
      const data = await window.electronAPI.reimbursePerson.getAll()
      setReimbursePersons(data)
    } catch (error) {
      message.error('加载报销人失败')
    }
  }

  const loadInvoiceSets = async () => {
    try {
      const data = await window.electronAPI.invoiceSet.getAll()
      setInvoiceSets(data)
    } catch (error) {
      message.error('加载发票集失败')
    }
  }

  useEffect(() => {
    loadCategories()
    loadReimbursePersons()
    loadInvoiceSets()
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
    setReimbursePersonId(null)
    setSetId(null)
    setIsFavorite(null)
    setDateRange(null)
    setAmountRange([null, null])
    loadData({})
  }

  const getReimbursePersonName = (personId: number | null) => {
    const person = reimbursePersons.find(p => p.id === personId)
    return person?.name || '未指定'
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

  const handleToggleFavorite = async (record: Invoice) => {
    try {
      const newFavorite = record.is_favorite ? 0 : 1
      await window.electronAPI.invoice.setFavorite(record.id, newFavorite)
      message.success(newFavorite ? '已添加关注' : '已取消关注')
      loadData()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleSelectAll = () => {
    if (invoices.length > 0) {
      setSelectedRowKeys(invoices.map(inv => inv.id))
    }
  }

  const handleSelectInvert = () => {
    const currentKeys = new Set(selectedRowKeys)
    const inverted = invoices
      .map(inv => inv.id)
      .filter(id => !currentKeys.has(id))
    setSelectedRowKeys(inverted)
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的发票')
      return
    }
    try {
      await window.electronAPI.invoice.batchDelete(selectedRowKeys.map(k => Number(k)))
      message.success(`成功删除 ${selectedRowKeys.length} 条发票记录`)
      loadData()
    } catch (error) {
      message.error('批量删除失败')
    }
  }

  const handleBatchUpdateCategory = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要修改的发票')
      return
    }
    setSelectedCategoryId(null)
    setCategoryModalVisible(true)
  }

  const confirmBatchUpdateCategory = async () => {
    try {
      await window.electronAPI.invoice.batchUpdateCategory(
        selectedRowKeys.map(k => Number(k)),
        selectedCategoryId
      )
      message.success(`成功修改 ${selectedRowKeys.length} 条发票的分类`)
      setCategoryModalVisible(false)
      loadData()
    } catch (error) {
      message.error('批量修改分类失败')
    }
  }

  const handleBatchUpdateStatus = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要修改的发票')
      return
    }
    setSelectedStatus('')
    setStatusModalVisible(true)
  }

  const confirmBatchUpdateStatus = async () => {
    if (!selectedStatus) {
      message.warning('请选择状态')
      return
    }
    try {
      await window.electronAPI.invoice.batchUpdateStatus(
        selectedRowKeys.map(k => Number(k)),
        selectedStatus
      )
      message.success(`成功修改 ${selectedRowKeys.length} 条发票的状态`)
      setStatusModalVisible(false)
      loadData()
    } catch (error) {
      message.error('批量修改状态失败')
    }
  }

  const handleAddToSet = (invoiceId: number) => {
    setCurrentInvoiceId(invoiceId)
    setSelectedSetId(null)
    setAddToSetModalVisible(true)
  }

  const confirmAddToSet = async () => {
    if (!selectedSetId || !currentInvoiceId) {
      message.warning('请选择发票集')
      return
    }
    try {
      await window.electronAPI.invoiceSet.addInvoice(selectedSetId, currentInvoiceId)
      message.success('已添加到发票集')
      setAddToSetModalVisible(false)
      loadInvoiceSetsForInvoices(invoices)
    } catch (error) {
      message.error('添加失败')
    }
  }

  const handleRemoveFromSet = async (invoiceId: number, setId: number) => {
    try {
      await window.electronAPI.invoiceSet.removeInvoice(setId, invoiceId)
      message.success('已从发票集移除')
      loadInvoiceSetsForInvoices(invoices)
    } catch (error) {
      message.error('移除失败')
    }
  }

  const handleOpenAttachment = async (record: Invoice) => {
    if (!record.file_path) {
      message.warning('该发票没有附件')
      return
    }
    try {
      await window.electronAPI.invoice.openPath(record.file_path)
    } catch (error) {
      message.error('打开附件失败')
    }
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    }
  }

  const columns = [
    {
      title: '关注',
      key: 'favorite',
      width: 60,
      render: (_: any, record: Invoice) => (
        <Tooltip title={record.is_favorite ? '取消关注' : '添加关注'}>
          <Button
            type="text"
            size="small"
            icon={record.is_favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            onClick={() => handleToggleFavorite(record)}
            style={{ padding: 0 }}
          />
        </Tooltip>
      )
    },
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const info = getStatusInfo(status)
        return <Tag color={info.color}>{info.label}</Tag>
      }
    },
    {
      title: '所属集合',
      dataIndex: 'id',
      key: 'sets',
      width: 150,
      render: (id: number) => {
        const sets = invoiceSetsMap[id] || []
        return (
          <Space wrap size={4}>
            {sets.map(set => (
              <Tag
                key={set.id}
                color={set.color}
                closable
                onClose={(e) => {
                  e.preventDefault()
                  handleRemoveFromSet(id, set.id)
                }}
              >
                {set.name}
              </Tag>
            ))}
          </Space>
        )
      }
    },
    {
      title: '报销人',
      dataIndex: 'reimburse_person_id',
      key: 'reimburse_person_id',
      width: 100,
      render: (personId: number | null) => getReimbursePersonName(personId)
    },
    {
      title: '附件',
      dataIndex: 'file_path',
      key: 'file_path',
      width: 80,
      render: (filePath: string | null, record: Invoice) => (
        filePath ? (
          <Tooltip title="打开附件">
            <Button
              type="link"
              size="small"
              icon={<FileOutlined />}
              onClick={() => handleOpenAttachment(record)}
            />
          </Tooltip>
        ) : null
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: Invoice) => (
        <Space size="small">
          <Tooltip title="添加到发票集">
            <Button
              type="link"
              size="small"
              icon={<FolderAddOutlined />}
              onClick={() => handleAddToSet(record.id)}
            />
          </Tooltip>
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
  const hasSelected = selectedRowKeys.length > 0

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
          <Col span={5}>
            <Input
              placeholder="搜索发票号码/代码/销售方/购买方"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col span={3}>
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
          <Col span={3}>
            <Select
              placeholder="选择报销人"
              value={reimbursePersonId || undefined}
              onChange={setReimbursePersonId}
              style={{ width: '100%' }}
              allowClear
              options={reimbursePersons.map(p => ({
                value: p.id,
                label: p.name
              }))}
            />
          </Col>
          <Col span={3}>
            <Select
              placeholder="选择发票集"
              value={setId || undefined}
              onChange={setSetId}
              style={{ width: '100%' }}
              allowClear
              options={invoiceSets.map(s => ({
                value: s.id,
                label: (
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: s.color,
                        marginRight: 8
                      }}
                    />
                    {s.name}
                  </span>
                )
              }))}
            />
          </Col>
          <Col span={2}>
            <Select
              placeholder="关注状态"
              value={isFavorite ?? undefined}
              onChange={(v) => setIsFavorite(v ?? null)}
              style={{ width: '100%' }}
              allowClear
              options={[
                { value: 1, label: '已关注' },
                { value: 0, label: '未关注' }
              ]}
            />
          </Col>
          <Col span={5}>
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
          <Col offset={16} span={8}>
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
              icon={<CheckSquareOutlined />}
              onClick={handleSelectAll}
              disabled={invoices.length === 0}
            >
              全选
            </Button>
            <Button
              icon={<CloseSquareOutlined />}
              onClick={handleSelectInvert}
              disabled={invoices.length === 0}
            >
              反选
            </Button>
            {hasSelected && (
              <Space>
                <span style={{ color: '#666' }}>已选择 {selectedRowKeys.length} 项</span>
                <Divider type="vertical" />
                <Popconfirm
                  title={`确定删除选中的 ${selectedRowKeys.length} 条发票记录吗？`}
                  onConfirm={handleBatchDelete}
                  okText="确定删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    批量删除
                  </Button>
                </Popconfirm>
                <Button
                  icon={<SettingOutlined />}
                  onClick={handleBatchUpdateCategory}
                >
                  批量改分类
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={handleBatchUpdateStatus}
                >
                  批量改状态
                </Button>
              </Space>
            )}
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
          rowSelection={rowSelection}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title="批量修改分类"
        open={categoryModalVisible}
        onOk={confirmBatchUpdateCategory}
        onCancel={() => setCategoryModalVisible(false)}
        okText="确定修改"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 16 }}>
          即将修改 <strong>{selectedRowKeys.length}</strong> 条发票的分类，请选择目标分类：
        </p>
        <Select
          placeholder="选择分类（不选则清空分类）"
          value={selectedCategoryId || undefined}
          onChange={setSelectedCategoryId}
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
        <p style={{ marginTop: 16, color: '#fa8c16' }}>
          ⚠️ 此操作不可撤销，请谨慎操作。
        </p>
      </Modal>

      <Modal
        title="批量修改状态"
        open={statusModalVisible}
        onOk={confirmBatchUpdateStatus}
        onCancel={() => setStatusModalVisible(false)}
        okText="确定修改"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 16 }}>
          即将修改 <strong>{selectedRowKeys.length}</strong> 条发票的状态，请选择目标状态：
        </p>
        <Select
          placeholder="选择状态"
          value={selectedStatus || undefined}
          onChange={setSelectedStatus}
          style={{ width: '100%' }}
          options={statusOptions.map(s => ({
            value: s.value,
            label: (
              <span>
                <Tag color={s.color}>{s.label}</Tag>
              </span>
            )
          }))}
        />
        <p style={{ marginTop: 16, color: '#fa8c16' }}>
          ⚠️ 此操作不可撤销，请谨慎操作。
        </p>
      </Modal>

      <Modal
        title="添加到发票集"
        open={addToSetModalVisible}
        onOk={confirmAddToSet}
        onCancel={() => setAddToSetModalVisible(false)}
        okText="确定添加"
        cancelText="取消"
      >
        <p style={{ marginBottom: 16 }}>选择要添加到的发票集：</p>
        <Select
          placeholder="选择发票集"
          value={selectedSetId || undefined}
          onChange={setSelectedSetId}
          style={{ width: '100%' }}
          options={invoiceSets.map(s => ({
            value: s.id,
            label: (
              <span>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: s.color,
                    marginRight: 8
                  }}
                />
                {s.name}
              </span>
            )
          }))}
        />
      </Modal>
    </div>
  )
}

const Divider: React.FC<{ type: 'vertical' }> = ({ type }) => (
  <div style={{
    width: type === 'vertical' ? 1 : '100%',
    height: type === 'vertical' ? '1em' : 1,
    background: '#f0f0f0',
    margin: type === 'vertical' ? '0 8px' : '8px 0'
  }} />
)

export default InvoiceList
