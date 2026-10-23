import {
  LuCircleHelp,
  LuMonitor,
  LuSmartphone,
  LuTablet,
} from "react-icons/lu";
import { DEVICE_LABELS } from "../../utils/adminFormat";

const DEVICE_ICONS = {
  desktop: LuMonitor,
  mobile: LuSmartphone,
  tablet: LuTablet,
  unknown: LuCircleHelp,
};

const AdminDeviceChips = ({
  devices = [],
  limit = 2,
  emptyLabel = "No device data yet",
}) => {
  if (!devices.length) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {emptyLabel}
      </span>
    );
  }

  const visible = devices.slice(0, limit);
  const remaining = devices.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((device, index) => {
        const Icon = DEVICE_ICONS[device.type] || LuCircleHelp;
        const typeLabel = DEVICE_LABELS[device.type] || "Unknown";
        const detail = [device.os, device.browser].filter(Boolean).join(" · ");

        return (
          <span
            key={`${device.type}-${device.os}-${device.browser}-${index}`}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
            title={detail || typeLabel}
          >
            <Icon className="shrink-0 text-xs text-slate-500 dark:text-slate-400" />
            <span className="truncate">
              {typeLabel}
              {device.os ? ` · ${device.os}` : ""}
            </span>
          </span>
        );
      })}

      {remaining > 0 ? (
        <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
          +{remaining}
        </span>
      ) : null}
    </div>
  );
};

export default AdminDeviceChips;
