import { IconAperture, IconPhotoSensor, IconRadar2, IconStack2, IconUserHexagon } from "@tabler/icons-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/collection", label: "COLLECT", icon: IconStack2 },
  { to: "/lenses", label: "LENSES", icon: IconAperture },
  { to: "/capture", label: "CAPTURE", icon: IconPhotoSensor, primary: true },
  { to: "/discover", label: "DISCOVER", icon: IconRadar2 },
  { to: "/profile", label: "PROFILE", icon: IconUserHexagon }
];

export function BottomTabs() {
  return (
    <nav className="bottom-tabs" aria-label="Main navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink key={`${tab.to}-${tab.label}`} to={tab.to} className={({ isActive }) => `tab-item ${isActive && !tab.primary ? "active" : ""} ${tab.primary ? "capture-tab" : ""}`}>
            <span className="tab-icon"><Icon size={tab.primary ? 24 : 20} stroke={1.8} /></span>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
