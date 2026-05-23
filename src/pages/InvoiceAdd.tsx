import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  message,
  Space,
  Upload,
  Divider,
  InputNumber
} from 'antd'
import {
  UploadOutlined,
  SaveOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import type { Category, Invoice } from '../types'
import dayjs from 'dayjs'

const InvoiceAdd: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)

  const isEdit = !!id

  const loadCategories = async () => {
    try {
      const data = await window.electronAPI.category.getAll()
      setCategories(data)
    } catch (error) {
      message.error('加载分类失败')
    }
  }

  const loadInvoice = async () => {
    if (!id) return
    try {
      const data = await window.electronAPI.invoice.getById(Number(id))
      if (data) {
        form.setFieldsValue({
          ...data,
          invoice_date: data.invoice_date ? dayjs(data.invoice_date) : null
        })
      }
    } catch (error) {
      message.error('加载发票数据失败')
    }
  }

  useEffect(() => {
    loadCategories()
    loadInvoice()
  }, [id])

  const handleFileUpload = async (file: File) => {
    setParsing(true)
    try {
      const filePath = await window.electronAPI.invoice.openFile()
      if (!filePath) {
        setParsing(false)
        return
      }

      const result = await window.electronAPI.invoice.parsePdf(filePath)
      if (result.success && result.data) {
        const parsedData = {
          ...result.data,
          invoice_date: result.data.invoice_date
            ? dayjs(result.data.invoice_date)
            : null,
          amount: result.data.amount ? Number(result.data.amount) : undefined,
          tax_amount: result.data.tax_amount ? Number(result.data.tax_amount) : undefined,
          total_amount: result.data.total_amount ? Number(result.data.total_amount) : undefined,
          file_path: filePath
        }
        form.setFieldsValue(parsedData)
        message.success('PDF解析成功，请核对数据后保存')
      } else {
        message.warning('PDF解析失败，请手动录入数据')
      }
    } catch (error) {
      message.error('PDF解析出错')
    } finally {
      setParsing(false)
    }
    return false
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      const submitData = {
        ...values,
        invoice_date: values.invoice_date ? values.invoice_date.format('YYYY-MM-DD') : null,
        amount: values.amount !== undefined && values.amount !== null && values.amount !== ''
          ? Number(values.amount) : 0,
        tax_amount: values.tax_amount !== undefined && values.tax_amount !== null && values.tax_amount !== ''
          ? Number(values.tax_amount) : 0,
        total_amount: values.total_amount !== undefined && values.total_amount !== null && values.total_amount !== ''
          ? Number(values.total_amount) : 0
      }

      if (isEdit && id) {
        await window.electronAPI.invoice.update(Number(id), submitData)
        message.success('更新成功')
      } else {
        await window.electronAPI.invoice.add(submitData)
        message.success('保存成功')
      }
      navigate('/invoices')
    } catch (error: any) {
      message.error((isEdit ? '更新失败' : '保存失败') + (error?.message ? `: ${error.message}` : ''))
    } finally {
      setLoading(false)
    }
  }

  const beforeUpload = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    if (!isPdf) {
      message.error('只能上传PDF文件')
    }
    return isPdf
  }

  return (
    <div>
      <Card
        size="small"
        title={isEdit ? '编辑发票' : '新增发票'}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/invoices')}>
            返回列表
          </Button>
        }
      >
        {!isEdit && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Upload
                accept=".pdf"
                showUploadList={false}
                beforeUpload={handleFileUpload}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={parsing}
                  size="large"
                >
                  上传PDF发票自动解析
                </Button>
              </Upload>
            </div>
            <Divider>或手动填写</Divider>
          </>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            category_id: null
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="invoice_code"
                label="发票代码"
                rules={[{ required: true, message: '请输入发票代码' }]}
              >
                <Input placeholder="请输入发票代码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="invoice_number"
                label="发票号码"
                rules={[{ required: true, message: '请输入发票号码' }]}
              >
                <Input placeholder="请输入发票号码" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="invoice_date"
                label="开票日期"
                rules={[{ required: true, message: '请选择开票日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category_id"
                label="发票分类"
              >
                <Select
                  placeholder="请选择分类"
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
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="amount"
                label="金额"
                rules={[{ type: 'number', min: 0, message: '金额不能为负数' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0.00" addonBefore="¥" min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="tax_amount"
                label="税额"
                rules={[{ type: 'number', min: 0, message: '税额不能为负数' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0.00" addonBefore="¥" min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="total_amount"
                label="价税合计"
                rules={[{ required: true, message: '请输入价税合计' }, { type: 'number', min: 0, message: '金额不能为负数' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0.00" addonBefore="¥" min={0} precision={2} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>销售方信息</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="seller_name"
                label="销售方名称"
              >
                <Input placeholder="请输入销售方名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="seller_tax_id"
                label="销售方税号"
              >
                <Input placeholder="请输入销售方税号" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>购买方信息</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="buyer_name"
                label="购买方名称"
              >
                <Input placeholder="请输入购买方名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="buyer_tax_id"
                label="购买方税号"
              >
                <Input placeholder="请输入购买方税号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="remark"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                {isEdit ? '更新' : '保存'}
              </Button>
              <Button onClick={() => navigate('/invoices')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default InvoiceAdd
