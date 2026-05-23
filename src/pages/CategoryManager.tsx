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
  DeleteOutlined
} from '@ant-design/icons'
import type { Category } from '../types'

const presetColors = [
  '#f5222d', '#fa8c16', '#faad14', '#52c41a', '#13c2c2',
  '#1677ff', '#722ed1', '#eb2f96', '#fa541c', '#a0d911'
]

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await window.electronAPI.category.getAll()
      setCategories(data)
    } catch (error) {
      message.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setEditingCategory(null)
    form.resetFields()
    form.setFieldsValue({
      color: presetColors[Math.floor(Math.random() * presetColors.length)]
    })
    setModalVisible(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.setFieldsValue(category)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.category.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingCategory) {
        await window.electronAPI.category.update(editingCategory.id, values.name, values.description, values.color)
        message.success('更新成功')
      } else {
        await window.electronAPI.category.add(values.name, values.description, values.color)
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
      title: '分类名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
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
      render: (_: any, record: Category) => (
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
            title="确定删除这个分类吗？"
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
        title="分类管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增分类
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={categories}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
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
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input placeholder="请输入分类名称" />
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
                    border: form.getFieldValue('color') === color ? '2px solid #1677ff' : 'none'
                  }}
                  onClick={() => form.setFieldValue('color', color)}
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

export default CategoryManager
