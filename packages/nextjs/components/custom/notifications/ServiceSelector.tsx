import { useId } from "react";
import { getSelectableServices } from "~~/constants/notifications";
import type { NotificationService } from "~~/types/notifications";

const SERVICE_BUTTON_CLASS = "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left";
const SELECTED_SERVICE_CLASS =
  "border-primary/40 bg-primary/20 text-primary-content dark:border-purple-500/40 dark:bg-purple-500/20 dark:text-white";
const UNSELECTED_SERVICE_CLASS =
  "border-base-300 bg-base-200 text-base-content dark:border-white/10 dark:bg-white/5 dark:text-gray-300 hover:border-base-content/20 hover:bg-base-300 dark:hover:border-white/20 dark:hover:bg-white/10";

type ServiceSelectorProps = {
  services: NotificationService[];
  onToggle: (service: NotificationService) => void;
};

export const ServiceSelector = ({ services, onToggle }: ServiceSelectorProps) => {
  const headingId = useId();
  return (
    <div role="group" aria-labelledby={headingId}>
      <p id={headingId} className="block text-sm text-base-content dark:text-gray-300 mb-3">
        Notification Services
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {getSelectableServices(services).map(service => {
          const isSelected = services.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(service.id)}
              className={`${SERVICE_BUTTON_CLASS} ${isSelected ? SELECTED_SERVICE_CLASS : UNSELECTED_SERVICE_CLASS}`}
            >
              <span className="text-lg">{service.icon}</span>
              <span className="text-sm font-medium">{service.name}</span>
              {isSelected && (
                <svg
                  className="w-4 h-4 ml-auto text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {services.length === 0 && (
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
          ⚠️ Please select at least one notification service
        </p>
      )}
    </div>
  );
};
