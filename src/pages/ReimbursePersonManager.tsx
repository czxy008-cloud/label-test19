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
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import type { ReimbursePerson } from '../types'

const ReimbursePersonManager: React.FC = () => {
  const [persons, setPersons] = useState<ReimbursePerson[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingPerson, setEditingPerson] = useState<ReimbursePerson | null>(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await window.electronAPI.reimbursePerson.getAll()
      setPersons(data)
    } catch (error) {
      message.error('加载报销人失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = () => {
    setEditingPerson(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (person: ReimbursePerson) => {
    setEditingPerson(person)
    form.setFieldsValue(person)
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await window.electronAPI.reimbursePerson.delete(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingPerson) {
        await window.electronAPI.reimbursePerson.update(editingPerson.id, values.name, values.department || '', values.remark || '')
        message.success('更新成功')
      } else {
        await window.electronAPI.reimbursePerson.add(values.name, values.department || '', values.remark || '')
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      render: (text: string) => text || '-'
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => text || '-'
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
      render: (_: any, record: ReimbursePerson) => (
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
            title="确定删除这个报销人吗？"
            description="关联的发票将解除与此报销人的关联"
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
        title="报销人管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增报销人
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={persons}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
        />
      </Card>

      <Modal
        title={editingPerson ? '编辑报销人' : '新增报销人'}
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
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="department"
            label="部门"
          >
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReimbursePersonManager
