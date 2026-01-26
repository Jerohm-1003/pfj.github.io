import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonMenuButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonButton,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonFab,
  IonFabButton,
  IonChip,
  IonProgressBar,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  IonPopover,
  IonToggle,
  IonCheckbox,
  useIonAlert,
} from "@ionic/react";
import {
  cubeOutline,
  alertCircleOutline,
  addOutline,
  trashOutline,
  createOutline,
  downloadOutline,
  settingsOutline,
  statsChartOutline,
  filterOutline,
  closeOutline,
} from "ionicons/icons";
import { useState, useRef, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import "./Inventory.css";
import { inventoryService, InventoryItem } from "../services/inventoryService";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const Inventory: React.FC = () => {
  const [presentAlert] = useIonAlert();
  const modalRef = useRef<HTMLIonModalElement>(null);
  const popoverRef = useRef<HTMLIonPopoverElement>(null);

  // State Management
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPPO, setFilterPPO] = useState("all");
  const [sortBy, setSortBy] = useState<
    "name" | "stock" | "category" | "price" | "ppo"
  >("name");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showStats, setShowStats] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [statFilter, setStatFilter] = useState<
    "all" | "validated" | "unvalidated" | "stations"
  >("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    ppo: "",
    station: "",
    type_parent: "",
    type_child: "",
    make_parent: "",
    make_child: "",
    serial_number: "",
    model: "",
    name: "",
    status: "",
    disposition: "",
    issuance_type: "",
    validated: false,
  });

  // Load data from database
  useEffect(() => {
    loadInventoryItems();
  }, []);

  const loadInventoryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await inventoryService.getAllItems();
      setItems(data);
    } catch (err) {
      console.error("Failed to load inventory items:", err);
      setError(
        "Failed to load inventory items. Please check your database connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "All",
    ...new Set(items.map((i) => i.type_parent).filter(Boolean)),
  ];

  const ppoCategories = [
    "All PPO",
    "PPO CAVITE",
    "PPO LAGUNA",
    "PPO BATANGAS",
    "PPO RIZAL",
    "PPO QUEZON",
  ];

  // Filtering & Sorting Logic
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        (item.name &&
          item.name.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.serial_number &&
          item.serial_number
            .toLowerCase()
            .includes(searchText.toLowerCase())) ||
        (item.model &&
          item.model.toLowerCase().includes(searchText.toLowerCase()));
      const matchesCategory =
        filterCategory === "all" || item.type_parent === filterCategory;
      const matchesPPO =
        filterPPO === "all" ||
        item.ppo?.trim().toUpperCase() === filterPPO.toUpperCase();

      // Apply stat filter
      let matchesStatFilter = true;
      if (statFilter === "validated") {
        matchesStatFilter = item.validated === true;
      } else if (statFilter === "unvalidated") {
        matchesStatFilter = item.validated === false;
      }
      // Note: "stations" filter shows all items since it's just a count

      return (
        matchesSearch && matchesCategory && matchesStatFilter && matchesPPO
      );
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "stock")
        return (a.status || "").localeCompare(b.status || "");
      if (sortBy === "price")
        return (a.type_parent || "").localeCompare(b.type_parent || "");
      if (sortBy === "ppo") return (a.ppo || "").localeCompare(b.ppo || "");
      return (a.station || "").localeCompare(b.station || "");
    });

  // Statistics
  const totalItems = items.length;
  const validatedItems = items.filter((item) => item.validated).length;
  const unvalidatedItems = items.length - validatedItems;
  const uniqueStations = new Set(items.map((i) => i.station).filter(Boolean))
    .size;
  const uniqueTypes = new Set(items.map((i) => i.type_parent).filter(Boolean))
    .size;

  // Chart Data
  const typeDistribution = items.reduce(
    (acc, item) => {
      const type = item.type_parent || "Unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statusDistribution = items.reduce(
    (acc, item) => {
      const status = item.status || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const makeDistribution = items.reduce(
    (acc, item) => {
      const make = item.make_parent || "Unknown";
      acc[make] = (acc[make] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const ppoDistribution = items.reduce(
    (acc, item) => {
      const ppo = item.ppo || "Unknown";
      acc[ppo] = (acc[ppo] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const dispositionDistribution = items.reduce(
    (acc, item) => {
      const disposition = item.disposition || "Unknown";
      acc[disposition] = (acc[disposition] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const chartData = {
    labels: Object.keys(typeDistribution),
    datasets: [
      {
        data: Object.values(typeDistribution),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#FF6384",
          "#C9CBCF",
          "#4BC0C0",
          "#FF6384",
        ],
        hoverBackgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#FF6384",
          "#C9CBCF",
          "#4BC0C0",
          "#FF6384",
        ],
      },
    ],
  };

  const statusChartData = {
    labels: Object.keys(statusDistribution),
    datasets: [
      {
        data: Object.values(statusDistribution),
        backgroundColor: [
          "#10dc60",
          "#ffce00",
          "#f04141",
          "#3880ff",
          "#8c68cd",
          "#28ba62",
        ],
        hoverBackgroundColor: [
          "#10dc60",
          "#ffce00",
          "#f04141",
          "#3880ff",
          "#8c68cd",
          "#28ba62",
        ],
      },
    ],
  };

  const makeChartData = {
    labels: Object.keys(makeDistribution),
    datasets: [
      {
        data: Object.values(makeDistribution),
        backgroundColor: [
          "#92949c",
          "#f4a261",
          "#e76f51",
          "#2a9d8f",
          "#264653",
          "#e9c46a",
        ],
        hoverBackgroundColor: [
          "#92949c",
          "#f4a261",
          "#e76f51",
          "#2a9d8f",
          "#264653",
          "#e9c46a",
        ],
      },
    ],
  };

  const ppoChartData = {
    labels: Object.keys(ppoDistribution),
    datasets: [
      {
        data: Object.values(ppoDistribution),
        backgroundColor: [
          "#6a994e",
          "#a7c957",
          "#f2e8cf",
          "#386641",
          "#bc4749",
          "#f77f00",
        ],
        hoverBackgroundColor: [
          "#6a994e",
          "#a7c957",
          "#f2e8cf",
          "#386641",
          "#bc4749",
          "#f77f00",
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 10,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: {
            size: 9,
          },
          boxWidth: 10,
          padding: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
  };

  // Modal Handlers
  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingId(item.quicklook_id);
      setFormData(item);
    } else {
      setEditingId(null);
      setFormData({
        ppo: "",
        station: "",
        type_parent: "",
        type_child: "",
        make_parent: "",
        make_child: "",
        serial_number: "",
        model: "",
        name: "",
        status: "",
        disposition: "",
        issuance_type: "",
        validated: false,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    modalRef.current?.dismiss();
  };

  const saveItem = async () => {
    if (!formData.name || formData.name.trim() === "") {
      presentAlert({
        header: "Validation Error",
        message: "Please enter an equipment name",
        buttons: ["OK"],
      });
      return;
    }

    try {
      if (editingId) {
        const updatedItem = await inventoryService.updateItem({
          quicklook_id: editingId,
          ...formData,
        } as any);
        setItems(
          items.map((item) =>
            item.quicklook_id === editingId ? updatedItem : item,
          ),
        );
        showToastMessage("Equipment updated successfully!");
      } else {
        const newItem = await inventoryService.createItem(formData as any);
        setItems([...items, newItem]);
        showToastMessage("Equipment added successfully!");
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save item:", err);
      presentAlert({
        header: "Error",
        message: "Failed to save equipment. Please try again.",
        buttons: ["OK"],
      });
    }
  };

  const deleteItem = async () => {
    if (deleteItemId) {
      try {
        const deletedItem = items.find((i) => i.quicklook_id === deleteItemId);
        await inventoryService.deleteItem(deleteItemId);
        setItems(items.filter((item) => item.quicklook_id !== deleteItemId));
        showToastMessage(`${deletedItem?.name || "Equipment"} deleted!`);
        setShowDeleteAlert(false);
        setDeleteItemId(null);
      } catch (err) {
        console.error("Failed to delete item:", err);
        presentAlert({
          header: "Error",
          message: "Failed to delete equipment. Please try again.",
          buttons: ["OK"],
        });
      }
    }
  };

  // Note: adjustStock function removed as it's not applicable to equipment inventory
  // const adjustStock = async (itemId: number, amount: number) => {
  //   // This function is not needed for equipment inventory
  // };

  // Note: Stock status functions removed as they're not applicable to equipment inventory
  // const getStockStatus = (item: InventoryItem) => {
  //   // Not applicable for equipment
  // };

  // const getStockStatusLabel = (item: InventoryItem) => {
  //   // Not applicable for equipment
  // };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleRefresh = async (event: any) => {
    setIsRefreshing(true);
    try {
      await loadInventoryItems();
      showToastMessage("Inventory refreshed!");
    } catch (err) {
      console.error("Failed to refresh inventory:", err);
      showToastMessage("Failed to refresh inventory");
    } finally {
      setIsRefreshing(false);
      event.detail.complete();
    }
  };

  const downloadReport = () => {
    const report = items
      .map(
        (item) =>
          `${item.name || ""},${item.serial_number || ""},${item.model || ""},${item.station || ""},${item.type_parent || ""},${item.status || ""},${item.validated ? "Yes" : "No"}`,
      )
      .join("\n");
    const csv = `Equipment Name,Serial Number,Model,Station,Type,Status,Validated\n${report}`;
    console.log("Report generated:", csv);
    showToastMessage("Report downloaded!");
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Inventory</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => popoverRef.current?.present()}>
              <IonIcon slot="icon-only" icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <IonIcon icon={cubeOutline} />
            <p>Loading inventory...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <IonIcon icon={alertCircleOutline} />
            <p>{error}</p>
            <IonButton onClick={loadInventoryItems}>Retry</IonButton>
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="stats-section">
          <IonGrid>
            <IonRow>
              <IonCol size="6" sizeSm="6" sizeMd="3">
                <IonCard
                  className={`stat-card primary ${statFilter === "all" ? "active" : ""}`}
                  onClick={() => setStatFilter("all")}
                >
                  <IonCardContent>
                    <div className="stat-number">{totalItems}</div>
                    <div className="stat-label">Total Items</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" sizeSm="6" sizeMd="3">
                <IonCard
                  className={`stat-card success ${statFilter === "validated" ? "active" : ""}`}
                  onClick={() => setStatFilter("validated")}
                >
                  <IonCardContent>
                    <div className="stat-number">{validatedItems}</div>
                    <div className="stat-label">Validated</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" sizeSm="6" sizeMd="3">
                <IonCard
                  className={`stat-card warning ${statFilter === "unvalidated" ? "active" : ""}`}
                  onClick={() => setStatFilter("unvalidated")}
                >
                  <IonCardContent>
                    <div className="stat-number">{unvalidatedItems}</div>
                    <div className="stat-label">Unvalidated</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="6" sizeSm="6" sizeMd="3">
                <IonCard
                  className={`stat-card danger ${statFilter === "stations" ? "active" : ""}`}
                  onClick={() => setStatFilter("all")}
                >
                  <IonCardContent>
                    <div className="stat-number">{uniqueStations}</div>
                    <div className="stat-label">Stations</div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

          {showStats && (
            <>
              <IonCard className="detailed-stats">
                <IonCardContent>
                  <h3>Inventory Summary</h3>
                  <div className="stat-item">
                    <span>Validation Rate:</span>
                    <strong>
                      {totalItems > 0
                        ? Math.round((validatedItems / totalItems) * 100)
                        : 0}
                      %
                    </strong>
                  </div>
                  <div className="stat-item">
                    <span>Unique Equipment Types:</span>
                    <strong>{uniqueTypes}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Stations Covered:</span>
                    <strong>{uniqueStations}</strong>
                  </div>
                </IonCardContent>
              </IonCard>

              <IonCard className="detailed-stats">
                <IonCardContent>
                  <h3>Top PPO Codes</h3>
                  {Object.entries(ppoDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([ppo, count]) => (
                      <div key={ppo} className="stat-item">
                        <span>{ppo}:</span>
                        <strong>{count} items</strong>
                      </div>
                    ))}
                </IonCardContent>
              </IonCard>

              <IonGrid>
                <IonRow>
                  <IonCol size="12" sizeMd="6">
                    <IonCard className="detailed-stats">
                      <IonCardContent>
                        <h3>Status Breakdown</h3>
                        {Object.entries(statusDistribution)
                          .sort(([, a], [, b]) => b - a)
                          .map(([status, count]) => (
                            <div key={status} className="stat-item">
                              <span>{status}:</span>
                              <strong>
                                {count} (
                                {((count / totalItems) * 100).toFixed(1)}%)
                              </strong>
                            </div>
                          ))}
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                  <IonCol size="12" sizeMd="6">
                    <IonCard className="detailed-stats">
                      <IonCardContent>
                        <h3>Top Manufacturers</h3>
                        {Object.entries(makeDistribution)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([make, count]) => (
                            <div key={make} className="stat-item">
                              <span>{make}:</span>
                              <strong>{count} items</strong>
                            </div>
                          ))}
                      </IonCardContent>
                    </IonCard>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </>
          )}
        </div>

        {/* Equipment Analytics Dashboard */}
        {showChart && items.length > 0 && (
          <div className="chart-section">
            <IonCard className="chart-container">
              <IonCardContent>
                <h3>Equipment Analytics Dashboard</h3>
                <div className="chart-grid">
                  <div className="mini-chart">
                    <h4>By PPO</h4>
                    <div className="chart-wrapper">
                      <Pie data={ppoChartData} options={miniChartOptions} />
                    </div>
                  </div>
                  <div className="mini-chart">
                    <h4>By Type</h4>
                    <div className="chart-wrapper">
                      <Pie data={chartData} options={miniChartOptions} />
                    </div>
                  </div>
                  <div className="mini-chart">
                    <h4>By Status</h4>
                    <div className="chart-wrapper">
                      <Pie data={statusChartData} options={miniChartOptions} />
                    </div>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Search & Controls */}
        <div className="controls-section">
          {statFilter !== "all" && (
            <div className="active-filter-indicator">
              <IonChip color="primary">
                <IonLabel>
                  Showing{" "}
                  {statFilter === "validated" ? "Validated" : "Unvalidated"}{" "}
                  Items Only
                </IonLabel>
                <IonIcon
                  icon={closeOutline}
                  onClick={() => setStatFilter("all")}
                  style={{ cursor: "pointer" }}
                />
              </IonChip>
            </div>
          )}

          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value || "")}
            placeholder="Search by name, serial number, or model..."
            debounce={300}
          />

          <div className="filter-bar">
            <IonSelect
              value={filterCategory}
              onIonChange={(e) => setFilterCategory(e.detail.value)}
              interfaceOptions={{ header: "Select Category" }}
              className="category-select"
            >
              <IonSelectOption value="all">All Categories</IonSelectOption>
              {categories
                .filter((c) => c !== "All")
                .map((cat) => (
                  <IonSelectOption key={cat} value={cat}>
                    {cat}
                  </IonSelectOption>
                ))}
            </IonSelect>

            <IonSelect
              value={filterPPO}
              onIonChange={(e) => setFilterPPO(e.detail.value)}
              interfaceOptions={{ header: "Select PPO" }}
              className="ppo-select"
            >
              <IonSelectOption value="all">All PPO</IonSelectOption>
              {ppoCategories
                .filter((p) => p !== "All PPO")
                .map((ppo) => (
                  <IonSelectOption key={ppo} value={ppo}>
                    {ppo
                      .split(" ")
                      .map((word) =>
                        word === "PPO"
                          ? word
                          : word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase(),
                      )
                      .join(" ")}
                  </IonSelectOption>
                ))}
            </IonSelect>

            <IonSegment
              value={sortBy}
              onIonChange={(e) =>
                setSortBy(
                  e.detail.value as
                    | "name"
                    | "stock"
                    | "category"
                    | "price"
                    | "ppo",
                )
              }
              className="sort-segment"
            >
              <IonSegmentButton value="name">Name</IonSegmentButton>
              <IonSegmentButton value="stock">Status</IonSegmentButton>
              <IonSegmentButton value="price">Type</IonSegmentButton>
              <IonSegmentButton value="ppo">PPO</IonSegmentButton>
            </IonSegment>
          </div>

          <div className="view-controls">
            <IonButton
              fill={viewMode === "grid" ? "solid" : "outline"}
              onClick={() => setViewMode("grid")}
              size="small"
            >
              Grid
            </IonButton>
            <IonButton
              fill={viewMode === "list" ? "solid" : "outline"}
              onClick={() => setViewMode("list")}
              size="small"
            >
              List
            </IonButton>
            <IonButton
              fill={showChart ? "solid" : "outline"}
              onClick={() => setShowChart(!showChart)}
              size="small"
              color="secondary"
            >
              <IonIcon icon={statsChartOutline} />
            </IonButton>
          </div>
        </div>

        {/* Inventory Items */}
        {viewMode === "grid" ? (
          <IonGrid className="items-grid">
            <IonRow>
              {filteredItems.map((item) => (
                <IonCol key={item.id} size="12" sizeSm="6" sizeMd="4">
                  <IonCard className="item-card">
                    <IonCardHeader>
                      <div className="card-header-top">
                        <IonCardTitle>
                          {item.name || "Unnamed Equipment"}
                        </IonCardTitle>
                        <IonBadge
                          color={item.validated ? "success" : "warning"}
                        >
                          {item.validated ? "Validated" : "Unvalidated"}
                        </IonBadge>
                      </div>
                    </IonCardHeader>
                    <IonCardContent>
                      <div className="equipment-info">
                        <div className="info-row">
                          <span className="label">Serial:</span>
                          <span className="value">
                            {item.serial_number || "N/A"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="label">Model:</span>
                          <span className="value">{item.model || "N/A"}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Station:</span>
                          <span className="value">{item.station || "N/A"}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">PPO:</span>
                          <span className="value">{item.ppo || "N/A"}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Type:</span>
                          <span className="value">
                            {item.type_parent || "N/A"}
                          </span>
                        </div>
                        <div className="info-row">
                          <span className="label">Status:</span>
                          <span className="value">{item.status || "N/A"}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Disposition:</span>
                          <span className="value">
                            {item.disposition || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="card-actions">
                        <IonButton size="small" onClick={() => openModal(item)}>
                          <IonIcon icon={createOutline} />
                        </IonButton>
                        <IonButton
                          size="small"
                          color="danger"
                          onClick={() => {
                            setDeleteItemId(item.quicklook_id);
                            setShowDeleteAlert(true);
                          }}
                        >
                          <IonIcon icon={trashOutline} />
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        ) : (
          <IonList className="items-list">
            {filteredItems.map((item) => (
              <IonItem key={item.quicklook_id} className="item-list-card">
                <div className="list-item-content">
                  <div className="list-item-header">
                    <h3>{item.name || "Unnamed Equipment"}</h3>
                    <IonBadge color={item.validated ? "success" : "warning"}>
                      {item.validated ? "Validated" : "Unvalidated"}
                    </IonBadge>
                  </div>
                  <div className="list-item-details">
                    <span className="serial">
                      Serial: {item.serial_number || "N/A"}
                    </span>
                    <span className="model">Model: {item.model || "N/A"}</span>
                    <span className="station">
                      Station: {item.station || "N/A"}
                    </span>
                    <span className="ppo">PPO: {item.ppo || "N/A"}</span>
                    <span className="type">
                      Type: {item.type_parent || "N/A"}
                    </span>
                    <span className="status">
                      Status: {item.status || "N/A"}
                    </span>
                  </div>
                  <div className="list-item-actions">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => openModal(item)}
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      color="danger"
                      onClick={() => {
                        setDeleteItemId(item.quicklook_id);
                        setShowDeleteAlert(true);
                      }}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                </div>
              </IonItem>
            ))}
          </IonList>
        )}

        {filteredItems.length === 0 && (
          <div className="empty-state">
            <IonIcon icon={cubeOutline} />
            <p>No items found</p>
            <small>Try adjusting your search or filters</small>
          </div>
        )}

        {/* FAB Button */}
        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => openModal()}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Add/Edit Modal */}
        <IonModal
          ref={modalRef}
          isOpen={showModal}
          onDidDismiss={closeModal}
          initialBreakpoint={0.75}
          breakpoints={[0, 0.75, 1]}
        >
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={closeModal}>Cancel</IonButton>
              </IonButtons>
              <IonTitle>{editingId ? "Edit Item" : "Add New Item"}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={saveItem} strong>
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">Equipment Name *</IonLabel>
              <IonInput
                value={formData.name}
                onIonInput={(e) =>
                  setFormData({ ...formData, name: e.detail.value as string })
                }
                placeholder="Enter equipment name"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Serial Number</IonLabel>
              <IonInput
                value={formData.serial_number}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    serial_number: e.detail.value as string,
                  })
                }
                placeholder="Enter serial number"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Model</IonLabel>
              <IonInput
                value={formData.model}
                onIonInput={(e) =>
                  setFormData({ ...formData, model: e.detail.value as string })
                }
                placeholder="Enter model"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">PPO</IonLabel>
              <IonInput
                value={formData.ppo}
                onIonInput={(e) =>
                  setFormData({ ...formData, ppo: e.detail.value as string })
                }
                placeholder="Enter PPO"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Station</IonLabel>
              <IonInput
                value={formData.station}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    station: e.detail.value as string,
                  })
                }
                placeholder="Enter station"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Type Parent</IonLabel>
              <IonInput
                value={formData.type_parent}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    type_parent: e.detail.value as string,
                  })
                }
                placeholder="Enter type parent"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Type Child</IonLabel>
              <IonInput
                value={formData.type_child}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    type_child: e.detail.value as string,
                  })
                }
                placeholder="Enter type child"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Make Parent</IonLabel>
              <IonInput
                value={formData.make_parent}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    make_parent: e.detail.value as string,
                  })
                }
                placeholder="Enter make parent"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Make Child</IonLabel>
              <IonInput
                value={formData.make_child}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    make_child: e.detail.value as string,
                  })
                }
                placeholder="Enter make child"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Status</IonLabel>
              <IonInput
                value={formData.status}
                onIonInput={(e) =>
                  setFormData({ ...formData, status: e.detail.value as string })
                }
                placeholder="Enter status"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Disposition</IonLabel>
              <IonInput
                value={formData.disposition}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    disposition: e.detail.value as string,
                  })
                }
                placeholder="Enter disposition"
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Issuance Type</IonLabel>
              <IonInput
                value={formData.issuance_type}
                onIonInput={(e) =>
                  setFormData({
                    ...formData,
                    issuance_type: e.detail.value as string,
                  })
                }
                placeholder="Enter issuance type"
              />
            </IonItem>

            <IonItem>
              <IonLabel>Validated</IonLabel>
              <IonCheckbox
                checked={formData.validated || false}
                onIonChange={(e) =>
                  setFormData({ ...formData, validated: e.detail.checked })
                }
              />
            </IonItem>
          </IonContent>
        </IonModal>

        {/* Delete Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Item"
          message="Are you sure you want to delete this item? This action cannot be undone."
          buttons={[
            {
              text: "Cancel",
              role: "cancel",
              handler: () => {
                setShowDeleteAlert(false);
              },
            },
            {
              text: "Delete",
              role: "destructive",
              handler: deleteItem,
            },
          ]}
        />

        {/* Settings Popover */}
        <IonPopover ref={popoverRef} trigger="settings-btn">
          <IonContent>
            <div className="popover-content">
              <div className="popover-item">
                <IonLabel>Show Statistics</IonLabel>
                <IonToggle
                  checked={showStats}
                  onIonChange={(e) => setShowStats(e.detail.checked)}
                />
              </div>
              <div className="popover-item">
                <IonLabel>Show Chart</IonLabel>
                <IonToggle
                  checked={showChart}
                  onIonChange={(e) => setShowChart(e.detail.checked)}
                />
              </div>
              <div className="popover-item">
                <IonButton
                  expand="block"
                  onClick={() => {
                    downloadReport();
                    popoverRef.current?.dismiss();
                  }}
                >
                  <IonIcon slot="start" icon={downloadOutline} />
                  Download Report
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonPopover>

        {/* Toast Notification */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default Inventory;
