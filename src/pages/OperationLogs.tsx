import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Card,
  Form,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Modal
} from 'antd'
import {
  ReloadOutlined,
  DeleteOutlined,
  ClearOutlined
} from '@ant-design/icons'
import type { OperationLog, LogSearchParams } from '../types'
import dayjs from 'dayjs'

const operationTypeColors: Record<string, string> = {
  '新增发票': 'green',
  '修改发票': 'blue',
  '删除发票': 'red',
  '批量删除': 'orange',
  '批量操作': 'orange'
}

const OperationLogs: React.FC = () => {
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [loading, setLoading] = useState(false)
  const [operationTypes, setOperationTypes] = useState<string[]>([])
  const [form] = Form.useForm()

  const loadData = async (params?: LogSearchParams) => {
    setLoading(true)
    try {
      const data = await window.electronAPI.logs.get(params || {})
      setLogs(data)
    } catch (error) {
      message.error('加载日志失败')
    } finally {
      setLoading(false)
    }
  }

  const loadOperationTypes = async () => {
    try {
      const types = await window.electronAPI.logs.getTypes()
      setOperationTypes(types)
    } catch (error) {
      console.error('加载操作类型失败')
    }
  }

  useEffect(() => {
    loadData()
    loadOperationTypes()
  }, [])

  const handleSearch = () => {
    const values = form.getFieldsValue()
    const params: LogSearchParams = {
      operation_type: values.operation_type || null,
      start_date: values.date_range ? values.date_range[0].format('YYYY-MM-DD') : null,
      end_date: values.date_range ? values.date_range[1].format('YYYY-MM-DD') : null
    }
    loadData(params)
  }

  const handleReset = () => {
    form.resetFields()
    loadData()
  }

  const confirmClearLogs = (days: number) => {
    const beforeDate = dayjs().subtract(days, 'day').format('YYYY-MM-DD')
    let content = ''
    if (days === 0) {
      content = '确定要清除全部日志吗？此操作不可恢复。'
    } else {
      content = `确定要清除 ${beforeDate} 及之前的日志吗？此操作不可恢复。`
    }

    Modal.confirm({
      title: '确认清除日志',
      content: content,
      okText: '确定清除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const count = await window.electronAPI.logs.deleteBefore(beforeDate)
          message.success(`已清除 ${count} 条日志`)
          loadData()
          loadOperationTypes()
        } catch (error) {
          message.error('清除日志失败')
        }
      }
    })
  }

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      width: 120,
      render: (type: string) => (
        <Tag color={operationTypeColors[type] || 'default'}>
          {type}
        </Tag>
      )
    },
    {
      title: '操作对象',
      dataIndex: 'operation_object',
      key: 'operation_object',
      width: 200
    },
    {
      title: '操作详情',
      dataIndex: 'operation_details',
      key: 'operation_details'
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => text?.replace('T', ' ').split('.')[0] || '-'
    }
  ]

  return (
    <div>
      <Card
        size="small"
        title="操作日志"
        extra={
          <Space>
            <Select
              placeholder="一键清除日志"
              style={{ width: 160 }}
              value={undefined}
              onSelect={(value: number | undefined) => {
                if (value !== undefined) {
                  confirmClearLogs(value)
                }
              }}
            >
              <Select.Option value={7}>清除7天前</Select.Option>
              <Select.Option value={30}>清除30天前</Select.Option>
              <Select.Option value={90}>清除90天前</Select.Option>
              <Select.Option value={0}>清除全部</Select.Option>
            </Select>
            <Button
              icon={<ClearOutlined />}
              onClick={handleReset}
            >
              重置
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleSearch}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Row gutter={16} style={{ width: '100%' }}>
            <Col span={8}>
              <Form.Item name="operation_type" label="操作类型">
                <Select
                  placeholder="请选择操作类型"
                  style={{ width: '100%' }}
                  allowClear
                >
                  {operationTypes.map(type => (
                    <Select.Option key={type} value={type}>
                      {type}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="date_range" label="时间范围">
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Space>
                <Button type="primary" onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>
    </div>
  )
}

export default OperationLogs
