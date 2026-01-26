import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonText,
  IonAvatar,
  IonList,
  IonItem,
  IonLabel,
  IonSpinner,
} from "@ionic/react";
import {
  cubeOutline,
  alertCircleOutline,
  logOutOutline,
  trendingUpOutline,
  trendingDownOutline,
  timeOutline,
  megaphoneOutline,
} from "ionicons/icons";

import { useEffect, useState } from "react";
import "./Dashboard.css";
import { inventoryService, InventoryItem } from "../services/inventoryService";

// Chart.js imports
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Pie, Bar, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const logos = [
  "public/CAVITE.png",
  "public/LAGUNA.png",
  "public/BATANGAS.png",
  "public/RIZAL.png",
  "public/QUEZON.png",
  "public/RHQ.png",
  "public/RMFB4A.png",
];

const Dashboard: React.FC = () => {
  const [logoIndex, setLogoIndex] = useState(0);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogoIndex((prev) => (prev + 1) % logos.length);
    }, 3000); // change every 3s

    return () => clearInterval(interval);
  }, []);

  // Load inventory data
  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getAllItems();
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory data:", err);
      setError(
        "Failed to load inventory data. Please check your database connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalItems = items.length;
  const validatedItems = items.filter((item) => item.validated).length;
  const unvalidatedItems = totalItems - validatedItems;
  const issuedItems = items.filter(
    (item) =>
      item.disposition?.toLowerCase() === "issued" ||
      item.status?.toLowerCase() === "issued" ||
      item.issuance_type,
  ).length;
  const availableItems = items.filter(
    (item) =>
      item.status?.toLowerCase() === "available" ||
      item.status?.toLowerCase() === "active",
  ).length;

  // Chart data
  const categoryLabels = [
    ...new Set(items.map((i) => i.type_parent).filter(Boolean)),
  ];
  const categoryData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryLabels.map(
          (cat) => items.filter((i) => i.type_parent === cat).length,
        ),
        backgroundColor: [
          "#39ffff",
          "#00c4c4",
          "#009090",
          "#005252",
          "#76ffff",
          "#affefe",
          "#daffff",
        ],
        borderColor: "#00ffff",
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBorderColor: "#fff",
        hoverBackgroundColor: [
          "#00c4c4",
          "#009090",
          "#005252",
          "#39ffff",
          "#00ffff",
          "#76ffff",
          "#affefe",
        ],
      },
    ],
  };

  const categoryOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: "bold" as const,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.95)",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "#00ffff",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
    },
  };

  const statusLabels = [...new Set(items.map((i) => i.status).filter(Boolean))];
  const statusData = {
    labels: statusLabels,
    datasets: [
      {
        label: "Items by Status",
        data: statusLabels.map(
          (status) => items.filter((i) => i.status === status).length,
        ),
        backgroundColor: "#39ffff",
        borderColor: "#00ffff",
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        hoverBackgroundColor: "#00c4c4",
        hoverBorderColor: "#009090",
        hoverBorderWidth: 2,
      },
    ],
  };

  const statusOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.95)",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "#00ffff",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            return `Count: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          precision: 0,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeInOutCubic" as const,
    },
  };

  const stationLabels = [
    ...new Set(items.map((i) => i.station).filter(Boolean)),
  ];
  const stationData = {
    labels: stationLabels,
    datasets: [
      {
        label: "Items by Station",
        data: stationLabels.map(
          (station) => items.filter((i) => i.station === station).length,
        ),
        backgroundColor: [
          "#39ffff",
          "#00c4c4",
          "#009090",
          "#005252",
          "#76ffff",
          "#affefe",
        ],
        borderColor: "#00ffff",
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
        hoverBackgroundColor: [
          "#00c4c4",
          "#009090",
          "#005252",
          "#39ffff",
          "#00ffff",
          "#76ffff",
        ],
        hoverBorderWidth: 2,
      },
    ],
  };

  const stationOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.95)",
        titleColor: "#333",
        bodyColor: "#333",
        borderColor: "#00ffff",
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function (context: any) {
            return `Count: ${context.parsed.x}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          precision: 0,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          minRotation: 0,
        },
      },
    },
    animation: {
      duration: 2000,
      easing: "easeInOutCubic" as const,
      delay: function (context: any) {
        return context.dataIndex * 200;
      },
    },
  };
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Inventory Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
            }}
          >
            <IonSpinner name="crescent" />
          </div>
        ) : error ? (
          <IonText color="danger">{error}</IonText>
        ) : (
          <IonGrid>
            <IonRow>
              {/* Total Items */}
              <IonCol size="12" sizeMd="4">
                <IonCard button className="kpi-card">
                  <IonCardHeader>
                    <div className="kpi-header">
                      <IonIcon icon={cubeOutline} />
                      <IonCardTitle>Total Items</IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText className="kpi-value">
                      {totalItems.toLocaleString()}
                    </IonText>
                    <div className="kpi-trend positive">
                      <IonIcon icon={trendingUpOutline} />
                      <span>Real-time data</span>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Low Stock */}
              <IonCol size="12" sizeMd="4">
                <IonCard button className="kpi-card success">
                  <IonCardHeader>
                    <div className="kpi-header">
                      <IonIcon icon={alertCircleOutline} />
                      <IonCardTitle>Validated Items</IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText className="kpi-value">{validatedItems}</IonText>
                    <p className="kpi-sub">Verified in system</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              {/* Issued Today */}
              <IonCol size="12" sizeMd="4">
                <IonCard button className="kpi-card">
                  <IonCardHeader>
                    <div className="kpi-header">
                      <IonIcon icon={logOutOutline} />
                      <IonCardTitle>Issued Items</IonCardTitle>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText className="kpi-value">{issuedItems}</IonText>
                    <div className="kpi-trend neutral">
                      <IonIcon icon={timeOutline} />
                      <span>Currently issued</span>
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            {/* Charts Row */}
            <IonRow className="ion-margin-top">
              <IonCol size="12" sizeMd="6">
                <IonCard className="chart-card">
                  <IonCardHeader>
                    <IonCardTitle>Items by Category</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ height: "350px", position: "relative" }}>
                      <Doughnut data={categoryData} options={categoryOptions} />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" sizeMd="6">
                <IonCard className="chart-card">
                  <IonCardHeader>
                    <IonCardTitle>Items by Status</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ height: "350px", position: "relative" }}>
                      <Bar data={statusData} options={statusOptions} />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            {/* Station Chart Row */}
            <IonRow className="ion-margin-top">
              <IonCol size="12">
                <IonCard className="chart-card">
                  <IonCardHeader>
                    <IonCardTitle>Items by Station</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ height: "350px", position: "relative" }}>
                      <Bar data={stationData} options={stationOptions} />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            {/* PEOPLE + SIDE INFO */}
            <IonRow className="ion-margin-top">
              {/* Inventory Handlers – MAIN */}
              <IonCol size="12" sizeMd="8">
                <IonCard className="section-card main-section">
                  <IonCardHeader>
                    <IonCardTitle>Inventory Handlers</IonCardTitle>
                  </IonCardHeader>

                  <IonCardContent className="people-grid">
                    <div className="person-card">
                      <IonAvatar>
                        <img src="https://i.pravatar.cc/100?img=12" />
                      </IonAvatar>
                      <div>
                        <h3>Juan Dela Cruz</h3>
                        <p>Warehouse Officer</p>
                      </div>
                    </div>

                    <div className="person-card">
                      <IonAvatar>
                        <img src="https://i.pravatar.cc/100?img=32" />
                      </IonAvatar>
                      <div>
                        <h3>Maria Santos</h3>
                        <p>Inventory Auditor</p>
                      </div>
                    </div>

                    <div className="person-card">
                      <IonAvatar>
                        <img src="https://i.pravatar.cc/100?img=45" />
                      </IonAvatar>
                      <div>
                        <h3>Pedro Reyes</h3>
                        <p>Issuance Officer</p>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
                {/* BANNER / STRIP CARD */}
                <IonCard className="strip-card big-strip">
                  <div className="strip-container">
                    {/* LOGO */}
                    <div className="strip-logo">
                      <img
                        key={logoIndex}
                        src={logos[logoIndex]}
                        alt="logo"
                        className="rotating-logo"
                      />
                    </div>

                    {/* BIG CARD CONTENT */}
                    <div className="strip-content big-content">
                      <h3>Inventory System Status</h3>
                      <p>
                        All handlers active • Last sync 10 mins ago • No
                        critical alerts
                      </p>

                      <div className="strip-meta">
                        <span>✔ Operational</span>
                        <span>📦 1,245 items tracked</span>
                        <span>👥 3 handlers on duty</span>
                      </div>
                    </div>
                  </div>
                </IonCard>
              </IonCol>

              {/* RIGHT SIDE STACK */}
              <IonCol size="12" sizeMd="4">
                {/* Dues */}
                <IonCard className="section-card side-card">
                  <IonCardHeader>
                    <div className="section-header">
                      <IonIcon icon={timeOutline} />
                      <IonCardTitle>Dues</IonCardTitle>
                    </div>
                  </IonCardHeader>

                  <IonCardContent>
                    <div className="status-item danger">
                      12 items for reorder
                    </div>
                    <div className="status-item warning">3 pending audits</div>
                    <div className="status-item neutral">
                      5 unreturned items
                    </div>
                  </IonCardContent>
                </IonCard>

                {/* Announcements */}
                <IonCard className="section-card side-card">
                  <IonCardHeader>
                    <div className="section-header">
                      <IonIcon icon={megaphoneOutline} />
                      <IonCardTitle>Announcements</IonCardTitle>
                    </div>
                  </IonCardHeader>

                  <IonCardContent>
                    <p>📢 Annual inventory on Feb 10</p>
                    <p>⚠ System maintenance tonight</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
