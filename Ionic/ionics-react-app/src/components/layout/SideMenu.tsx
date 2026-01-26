import React, { useState, useEffect } from "react";
import {
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react";
import { homeOutline, cubeOutline } from "ionicons/icons";
import "./SideMenu.css";

const logos = [
  "BATANGAS.png",
  "CAVITE.png",
  "LAGUNA.png",
  "QUEZON.png",
  "RIZAL.png",
  "RMFB4A.png",
  "RHQ.png",
];

const SideMenu: React.FC = () => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoIndex((prevIndex) => (prevIndex + 1) % logos.length);
    }, 3000); // Change logo every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <IonMenu contentId="main-content" className="side-menu">
      <IonHeader className="side-menu-header">
        <IonToolbar>
          <div className="title-with-logo">
            <img
              src={`/${logos[currentLogoIndex]}`}
              alt="PNP Logo"
              className="rotating-logo"
            />
            <h2>PNP</h2>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="side-menu-content">
        <IonList className="side-menu-list">
          <IonItem
            routerLink="/dashboard"
            routerDirection="none"
            className="side-menu-item"
            lines="none"
          >
            <IonIcon icon={homeOutline} slot="start" />
            <IonLabel>Dashboard</IonLabel>
          </IonItem>

          <IonItem
            routerLink="/inventory"
            routerDirection="none"
            className="side-menu-item"
            lines="none"
          >
            <IonIcon icon={cubeOutline} slot="start" />
            <IonLabel>Inventory</IonLabel>
          </IonItem>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default SideMenu;
