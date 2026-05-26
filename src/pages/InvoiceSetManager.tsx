import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Card,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Tag
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined
} from '@ant-design/icons'
import type { InvoiceSet } from '../types'

const presetColors = [
  '#f5222d', '#fa8c16', '#faad14', '#52c41a', '#13c2c2',
  '#1677ff', '#722ed1', '#eb2f96', '#fa541c', '#a0d911'
]

const InvoiceSetManager: React.FC = () => {
  const [invoiceSets, setInvoiceSets] = useState<InvoiceSet[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingSet, setEditingSet] = useState<InvoiceSet | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await window.electronAPI.invoiceSet.getAll()
      setInvoiceSets(data)
    } catch (error) {
      message.error('加载发票集失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setEditingSet(null)
    form.resetFields()
    const defaultColor = presetColors[Math.floor(Math.random() * presetColors.length)]
    form.setFieldsValue({
      color: defaultColor
    })
    setSelectedColor(defaultColor)
    setModalVisible(true)
  }

  const handleEdit = (set: InvoiceSet) => {
    setEditingSet(set)
    form.setFieldsValue(set)
    setSelectedColor(set.color)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.invoiceSet.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingSet) {
        await window.electronAPI.invoiceSet.update(editingSet.id, values.name, values.description, values.color)
        message.success('更新成功')
      } else {
        await window.electronAPI.invoiceSet.add(values.name, values.description, values.color)
        message.success('添加成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error: any) {
      if (error.message) {
        message.error(error.message)
      }
    }
  }

  const columns = [
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color: string) => (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: color,
            display: 'inline-block'
          }}
        />
      )
    },
    {
      title: '集合名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: InvoiceSet) => (
        <Space>
          <FolderOutlined style={{ color: record.color }} />
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '发票数量',
      dataIndex: 'invoice_count',
      key: 'invoice_count',
      width: 100,
      render: (count: number) => count || 0
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => `¥${(amount || 0).toFixed(2)}`
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => text?.replace('T', ' ').split('.')[0] || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: InvoiceSet) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个发票集吗？"
            description="删除后，发票集内的发票不会被删除，只是会从该集合中移除。"
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

  return (
    <div>
      <Card
        size="small"
        title="发票集管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增发票集
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={invoiceSets}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingSet ? '编辑发票集' : '新增发票集'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="集合名称"
            rules={[{ required: true, message: '请输入集合名称' }]}
          >
            <Input placeholder="例如：2024年差旅费、设备采购凭证" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={2} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item
            name="color"
            label="颜色"
            rules={[{ required: true, message: '请选择颜色' }]}
          >
            <div>
              {presetColors.map(color => (
                <Tag
                  key={color}
                  color={color}
                  style={{
                    cursor: 'pointer',
                    margin: 4,
                    padding: '8px 16px',
                    borderRadius: 4,
                    border: selectedColor === color ? '2px solid #1677ff' : 'none'
                  }}
                  onClick={() => {
                    setSelectedColor(color)
                    form.setFieldValue('color', color)
                  }}
                >
                  &nbsp;&nbsp;&nbsp;&nbsp;
                </Tag>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InvoiceSetManager
