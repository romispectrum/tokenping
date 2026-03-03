"use client";

import { useEffect, useState } from "react";
import { AVAILABLE_SERVICES, DEFAULT_HEALTH_FACTOR_THRESHOLD } from "~~/constants/notifications";
import { type NotificationService, useNotificationConfig } from "~~/hooks/custom/useNotificationConfig";
import { notification } from "~~/utils/scaffold-eth";

interface NotificationConfigProps {
  chainId: number;
  chainName: string;
  currentHealthFactor: string;
}

export const NotificationConfig = ({ chainId, chainName, currentHealthFactor }: NotificationConfigProps) => {
  const { getConfig, updateConfig, deleteConfig, isLoaded } = useNotificationConfig();
  const config = getConfig(chainId);

  const [enabled, setEnabled] = useState(config?.enabled ?? false);
  const [services, setServices] = useState<NotificationService[]>(config?.services ?? []);
  const [email, setEmail] = useState(config?.email ?? "");
  const [threshold, setThreshold] = useState(config?.healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD);
  const [isEditing, setIsEditing] = useState(false); // Show create button when no config, summary when has config
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update local state when config changes (only email is supported)
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled ?? false);
      const validServices = (config.services ?? []).filter((s): s is NotificationService => s === "email");
      setServices(validServices.length > 0 ? validServices : config.enabled ? ["email"] : []);
      setEmail(config.email ?? "");
      setThreshold(config.healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD);
    }
  }, [config]);

  if (!isLoaded) return null;

  const hasConfig = config !== null;

  const hf = parseFloat(currentHealthFactor);
  const isBelowThreshold = !isNaN(hf) && hf < threshold && enabled;

  const toggleService = (serviceId: NotificationService) => {
    setServices(prev => {
      const currentServices = prev ?? [];
      return currentServices.includes(serviceId)
        ? currentServices.filter(s => s !== serviceId)
        : [...currentServices, serviceId];
    });
  };

  const saveConfig = async () => {
    const currentServices = services ?? [];
    await updateConfig(chainId, {
      enabled: true,
      services: currentServices,
      healthFactorThreshold: threshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD,
      email: currentServices.includes("email") ? (email ?? "").trim() || undefined : undefined,
    });
    setIsEditing(false);
  };

  const handleStore = async () => {
    const currentServices = services ?? [];
    if (currentServices.length === 0) {
      notification.error("Please select at least one notification service");
      return;
    }
    if (currentServices.includes("email")) {
      const trimmed = (email ?? "").trim();
      if (!trimmed) {
        notification.error("Please enter your email address");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        notification.error("Please enter a valid email address");
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveConfig();
      notification.success("Notification configuration saved.");
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save configuration";
      console.error("Failed to save notification config:", error);
      notification.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteConfig(chainId);
      setIsEditing(true);
      setEnabled(false);
      setServices([]);
      setEmail("");
      setThreshold(DEFAULT_HEALTH_FACTOR_THRESHOLD);
    } catch (error) {
      console.error("Failed to delete notification config:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (config) {
      setEnabled(config.enabled);
      setServices(config.services ?? []);
      setEmail(config.email ?? "");
      setThreshold(config.healthFactorThreshold ?? DEFAULT_HEALTH_FACTOR_THRESHOLD);
    } else {
      setEnabled(false);
      setServices([]);
      setEmail("");
      setThreshold(DEFAULT_HEALTH_FACTOR_THRESHOLD);
    }
    setIsEditing(false);
  };

  // No config and not editing: show empty state with create button
  if (!hasConfig && !isEditing) {
    return (
      <div className="mb-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-gray-900/50 backdrop-blur-xl p-4">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">Notification Settings</h3>
          <p className="text-xs text-gray-400 mb-4 max-w-[240px]">
            Get alerts when your Health Factor on {chainName} drops below a threshold you choose.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-500/20"
          >
            Create notification config
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-950/30 to-gray-900/50 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="text-sm font-semibold text-white">Notification Settings</h3>
          {hasConfig && enabled && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs px-2 py-1 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {/* Notification Services Selection */}
          <div>
            <label className="block text-sm text-gray-300 mb-3">Notification Services</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {AVAILABLE_SERVICES.map(service => {
                const isSelected = (services ?? []).includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={[
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left",
                      isSelected
                        ? "border-purple-500/40 bg-purple-500/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-300 hover:border-white/20 hover:bg-white/10",
                    ].join(" ")}
                  >
                    <span className="text-lg">{service.icon}</span>
                    <span className="text-sm font-medium">{service.name}</span>
                    {isSelected && (
                      <svg
                        className="w-4 h-4 ml-auto text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            {(services ?? []).length === 0 && (
              <p className="text-xs text-amber-400 mt-2">⚠️ Please select at least one notification service</p>
            )}
          </div>

          {/* Email input when Email service is selected */}
          {(services ?? []).includes("email") && (
            <div>
              <label className="block text-sm text-gray-300 mb-2">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Alerts will be sent to this address.</p>
            </div>
          )}

          {/* Health Factor Threshold */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Health Factor Threshold: <span className="font-semibold text-white">{threshold}</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1.0 (Critical)</span>
              <span>2.0 (Safe)</span>
              <span>3.0 (Very Safe)</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {"You'll"} be notified when your Health Factor drops below {threshold} on {chainName}.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleStore}
              disabled={
                (services ?? []).length === 0 ||
                ((services ?? []).includes("email") && !(email ?? "").trim()) ||
                isSaving
              }
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium hover:from-purple-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            {hasConfig && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 font-medium hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Services:</span>
            <div className="flex items-center gap-1.5">
              {(services ?? []).length > 0 ? (
                (services ?? []).map(serviceId => {
                  const service = AVAILABLE_SERVICES.find(s => s.id === serviceId);
                  return service ? (
                    <span
                      key={serviceId}
                      className="text-xs px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300"
                    >
                      {service.icon} {service.name}
                    </span>
                  ) : null;
                })
              ) : (
                <span className="text-xs text-gray-500">None selected</span>
              )}
            </div>
          </div>
          {(services ?? []).includes("email") && email && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Email:</span>
              <span className="text-white font-medium truncate max-w-[180px]" title={email}>
                {email}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Threshold:</span>
            <span className="text-white font-medium">{threshold}</span>
          </div>
          {isBelowThreshold && (
            <div className="mt-2 p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
              <p className="text-xs text-amber-400">
                ⚠️ Current Health Factor ({currentHealthFactor}) is below your threshold!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
