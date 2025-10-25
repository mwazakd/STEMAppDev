import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ChemistryEngine } from '../lib/chemistry/engine'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface GraphProps {
  chemistryEngine: ChemistryEngine
  isActive: boolean
}

export default function Graph({ chemistryEngine, isActive }: GraphProps) {
  const [chartData, setChartData] = useState({
    labels: [] as string[],
    datasets: [
      {
        label: 'pH',
        data: [] as number[],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true
      }
    ]
  })

  useEffect(() => {
    const interval = setInterval(() => {
      if (isActive) {
        const points = chemistryEngine.getTitrationPoints()
        if (points.length > 0) {
          const labels = points.map((_, index) => `Point ${index + 1}`)
          const data = points.map(point => point.pH)
          
          setChartData({
            labels,
            datasets: [
              {
                label: 'pH',
                data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
              }
            ]
          })
        }
      }
    }, 500)

    return () => clearInterval(interval)
  }, [chemistryEngine, isActive])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Titration Curve - pH vs Volume Added'
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const point = chemistryEngine.getTitrationPoints()[context.dataIndex]
            return [
              `pH: ${point.pH.toFixed(2)}`,
              `Volume: ${(point.volumeAdded * 1000).toFixed(1)} mL`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Titration Points'
        }
      },
      y: {
        title: {
          display: true,
          text: 'pH'
        },
        min: 0,
        max: 14
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6
      }
    }
  }

  const exportData = () => {
    const points = chemistryEngine.getTitrationPoints()
    const csvContent = [
      'Volume Added (mL),pH,Timestamp',
      ...points.map(point => 
        `${(point.volumeAdded * 1000).toFixed(3)},${point.pH.toFixed(3)},${new Date(point.timestamp).toISOString()}`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `titration_data_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="graph-panel">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0 }}>Titration Curve</h3>
        <button 
          className="button" 
          onClick={exportData}
          disabled={chartData.datasets[0].data.length === 0}
          style={{ 
            padding: '8px 16px',
            fontSize: '12px',
            background: chartData.datasets[0].data.length > 0 ? 
              'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' : '#ccc'
          }}
        >
          Export CSV
        </button>
      </div>
      
      <div style={{ height: '200px', width: '100%' }}>
        <Line data={chartData} options={options} />
      </div>
      
      <div className="info-display" style={{ marginTop: '10px', fontSize: '12px' }}>
        <p><strong>Data Points:</strong> {chartData.datasets[0].data.length}</p>
        {chartData.datasets[0].data.length > 0 && (
          <>
            <p><strong>Current pH:</strong> {chartData.datasets[0].data[chartData.datasets[0].data.length - 1].toFixed(2)}</p>
            <p><strong>Total Volume:</strong> {(chemistryEngine.getCurrentState().volumeL * 1000).toFixed(1)} mL</p>
          </>
        )}
      </div>
    </div>
  )
}
