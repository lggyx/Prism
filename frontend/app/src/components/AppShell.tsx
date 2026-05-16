import { Outlet } from "react-router-dom";
import { BottomTabs } from "./BottomTabs";

export function AppShell() {
  return (
    <main className="app-viewport">
      <section className="device-frame">
        <div className="status-rail">
          <span>PRISM</span>
          <span>WORLDVIEW LENS</span>
        </div>
        <div className="screen-content">
          <Outlet />
        </div>
        <BottomTabs />
      </section>
    </main>
  );
}
