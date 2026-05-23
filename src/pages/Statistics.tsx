import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  Empty,
  Spin,
  Radio
} from 'antd'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts'
import type { MonthlyStats, CategoryStats } from '../types'
import dayjs, { Dayjs } from 'dayjs'

const { RangePicker } = DatePicker

interface QuarterlyStats {
  quarter: string
  total: number
  count: number
}

const Statistics: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(dayjs().year())
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil(dayjs().month() / 3) || 1)
  const [years, setYears] = useState<number[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([])
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyStats[]>([])
  const [categoryData, setCategoryData] = useState<CategoryStats[]>([])
  const [quarterlyCategoryData, setQuarterlyCategoryData] = useState<CategoryStats[]>([])
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf('year'),
    dayjs().endOf('year')
  ])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly')

  const loadYears = async () => {
    try {
      const data = await window.electronAPI.stats.years()
      const currentYear = dayjs().year()
      if (!data.includes(currentYear)) {
        data.unshift(currentYear)
      }
      setYears(data.length > 0 ? data : [currentYear])
    } catch (error) {
      setYears([dayjs().year()])
    }
  }

  const loadMonthlyStats = async (year: number) => {
    try {
      const data = await window.electronAPI.stats.monthly(year)
      const allMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
      const filledData = allMonths.map(month => {
        const found = data.find((d: any) => d.month === month)
        return {
          month: `${month}月`,
          month_num: parseInt(month),
          total: found?.total || 0,
          count: found?.count || 0
        }
      })
      setMonthlyData(filledData)
    } catch (error) {
      setMonthlyData([])
    }
  }

  const loadQuarterlyStats = async (year: number) => {
    try {
      const data = await window.electronAPI.stats.quarterly(year)
      const filledData = data.map((item: any) => ({
        quarter: item.quarter,
        total: item.total || 0,
        count: item.count || 0
      }))
      setQuarterlyData(filledData)
    } catch (error) {
      setQuarterlyData([])
    }
  }

  const loadQuarterlyCategoryStats = async (year: number, quarter: number) => {
    try {
      const data = await window.electronAPI.stats.quarterlyCategory(year, quarter)
      const processedData = data.map((item: any) => ({
        ...item,
        name: item.name || '未分类',
        color: item.color || '#999'
      }))
      setQuarterlyCategoryData(processedData)
    } catch (error) {
      setQuarterlyCategoryData([])
    }
  }

  const loadCategoryStats = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return
    setLoading(true)
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD')
      const endDate = dateRange[1].format('YYYY-MM-DD')
      const data = await window.electronAPI.stats.category(startDate, endDate)
      const processedData = data.map((item: any) => ({
        ...item,
        name: item.name || '未分类',
        color: item.color || '#999'
      }))
      setCategoryData(processedData)
    } catch (error) {
      setCategoryData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadYears()
  }, [])

  useEffect(() => {
    if (selectedYear) {
      loadMonthlyStats(selectedYear)
      loadQuarterlyStats(selectedYear)
    }
  }, [selectedYear])

  useEffect(() => {
    if (selectedYear && selectedQuarter) {
      loadQuarterlyCategoryStats(selectedYear, selectedQuarter)
    }
  }, [selectedYear, selectedQuarter])

  useEffect(() => {
    loadCategoryStats()
  }, [dateRange])

  const totalAmount = monthlyData.reduce((sum, item) => sum + item.total, 0)
  const totalCount = monthlyData.reduce((sum, item) => sum + item.count, 0)
  const quarterlyTotal = quarterlyData.reduce((sum, item) => sum + item.total, 0)
  const quarterlyCount = quarterlyData.reduce((sum, item) => sum + item.count, 0)

  const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, total, data }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const totalAll = data.reduce((sum: number, item: any) => sum + item.total, 0)
    const percent = totalAll > 0 ? ((total / totalAll) * 100).toFixed(1) : 0

    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11}>
        {`${name} ${percent}%`}
      </text>
    )
  }

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">{viewMode === 'monthly' ? totalCount : quarterlyCount}</div>
            <div className="stat-label">{viewMode === 'monthly' ? '全年发票总数' : '全年发票总数'}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">¥{(viewMode === 'monthly' ? totalAmount : quarterlyTotal).toFixed(2)}</div>
            <div className="stat-label">全年总金额</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">
              {totalCount > 0 ? `¥${(totalAmount / totalCount).toFixed(2)}` : '¥0.00'}
            </div>
            <div className="stat-label">平均金额</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" className="stat-card">
            <div className="stat-value">
              {totalAmount > 0 ? `¥${(totalAmount / 12).toFixed(2)}` : '¥0.00'}
            </div>
            <div className="stat-label">月均金额</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card
            size="small"
            title={
              <Space>
                <span>支出趋势</span>
                <Radio.Group
                  size="small"
                  value={viewMode}
                  onChange={e => setViewMode(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                >
                  <Radio.Button value="monthly">月度</Radio.Button>
                  <Radio.Button value="quarterly">季度</Radio.Button>
                </Radio.Group>
              </Space>
            }
            extra={
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 120 }}
                options={years.map(y => ({ value: y, label: `${y}年` }))}
              />
            }
            style={{ height: 380 }}
          >
            {viewMode === 'monthly' ? (
              monthlyData.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="金额"
                      stroke="#1677ff"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="暂无数据" style={{ marginTop: 80 }} />
              )
            ) : (
              quarterlyData.some(d => d.total > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']} />
                    <Legend />
                    <Bar
                      dataKey="total"
                      name="金额"
                      fill="#1677ff"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="暂无数据" style={{ marginTop: 80 }} />
              )
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            size="small"
            title="分类支出占比"
            extra={
              <RangePicker
                value={dateRange}
                onChange={dates => setDateRange(dates as [Dayjs, Dayjs] | null)}
              />
            }
            style={{ height: 380 }}
          >
            <Spin spinning={loading}>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(props: any) => renderCustomPieLabel({ ...props, data: categoryData })}
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="暂无数据" style={{ marginTop: 80 }} />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card
            size="small"
            title="季度分类支出明细"
            extra={
              <Space>
                <Select
                  value={selectedYear}
                  onChange={setSelectedYear}
                  style={{ width: 100 }}
                  options={years.map(y => ({ value: y, label: `${y}年` }))}
                />
                <Select
                  value={selectedQuarter}
                  onChange={setSelectedQuarter}
                  style={{ width: 100 }}
                  options={[
                    { value: 1, label: 'Q1' },
                    { value: 2, label: 'Q2' },
                    { value: 3, label: 'Q3' },
                    { value: 4, label: 'Q4' }
                  ]}
                />
              </Space>
            }
            style={{ height: 380 }}
          >
            {quarterlyCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={quarterlyCategoryData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props: any) => renderCustomPieLabel({ ...props, data: quarterlyCategoryData })}
                  >
                    {quarterlyCategoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`¥${value.toFixed(2)}`, '金额']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无数据" style={{ marginTop: 80 }} />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="季度统计详情">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>季度</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>发票数量</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>总金额</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>平均金额</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>占比</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyData.map((item) => (
                  <tr key={item.quarter} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 12 }}>{item.quarter}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{item.count}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>¥{item.total.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {item.count > 0 ? `¥${(item.total / item.count).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                          style={{
                            width: `${quarterlyTotal > 0 ? (item.total / quarterlyTotal) * 100 : 0}%`,
                            minWidth: 4,
                            height: 8,
                            background: '#1677ff',
                            borderRadius: 4
                          }}
                        />
                        <span style={{ marginLeft: 8 }}>
                          {quarterlyTotal > 0 ? `${((item.total / quarterlyTotal) * 100).toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card size="small" title="月度统计详情">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: 12, textAlign: 'left' }}>月份</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>发票数量</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>总金额</th>
                  <th style={{ padding: 12, textAlign: 'right' }}>平均金额</th>
                  <th style={{ padding: 12, textAlign: 'left' }}>占比</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((item) => (
                  <tr key={item.month} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: 12 }}>{item.month}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>{item.count}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>¥{item.total.toFixed(2)}</td>
                    <td style={{ padding: 12, textAlign: 'right' }}>
                      {item.count > 0 ? `¥${(item.total / item.count).toFixed(2)}` : '-'}
                    </td>
                    <td style={{ padding: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                          style={{
                            width: `${totalAmount > 0 ? (item.total / totalAmount) * 100 : 0}%`,
                            minWidth: 4,
                            height: 8,
                            background: '#1677ff',
                            borderRadius: 4
                          }}
                        />
                        <span style={{ marginLeft: 8 }}>
                          {totalAmount > 0 ? `${((item.total / totalAmount) * 100).toFixed(1)}%` : '0%'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Statistics
