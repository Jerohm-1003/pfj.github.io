import { Redirect, Route } from "react-router-dom";
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
  IonMenu,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

import SideMenu from "./components/layout/SideMenu";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <SideMenu />

      <IonRouterOutlet id="main-content">
        <Route exact path="/dashboard" component={Dashboard} />
        <Route exact path="/inventory" component={Inventory} />
        <Redirect exact from="/" to="/dashboard" />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
