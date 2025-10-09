import { useState, useCallback, useEffect } from 'react';

import { cn } from '@/lib/utils';
import { writeCloud } from '@/lib/firebase';
import type { CloudConfig } from '@/lib/firebase';

interface AdminPanelProps {
  currentStartTime: string;
  currentEndTime: string;
  onSave: (startTime: string, endTime: string, hackathonName: string) => void;
}

interface AdminConfig {
  hackathonName: string;
  hackathonStartTime: string;
  hackathonEndTime: string;
  adminPassword: string;
  isConfigured: boolean;
  lastUpdated: number;
}

export const AdminPanel = ({
  currentStartTime,
  currentEndTime,
  onSave
}: AdminPanelProps) => {
  const [startDateTime, setStartDateTime] = useState(currentStartTime.slice(0, 16));
  const [endDateTime, setEndDateTime] = useState(currentEndTime.slice(0, 16));
  const [hackathonName, setHackathonName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing admin config
  useEffect(() => {
    const savedConfig = localStorage.getItem('adminConfig');
    if (savedConfig) {
      try {
        const config: AdminConfig = JSON.parse(savedConfig);
        setHackathonName(config.hackathonName || '');
        setStartDateTime(config.hackathonStartTime?.slice(0, 16) || currentStartTime.slice(0, 16));
        setEndDateTime(config.hackathonEndTime?.slice(0, 16) || currentEndTime.slice(0, 16));
        setAdminPassword(config.adminPassword || '');
      } catch (error) {
        console.error('Error loading admin config:', error);
      }
    }
  }, [currentStartTime, currentEndTime]);

  // Validate form inputs
  const validateForm = useCallback(() => {
    const newErrors: string[] = [];
    
    if (!hackathonName.trim()) {
      newErrors.push('Hackathon name is required');
    }
    
    if (!startDateTime) {
      newErrors.push('Start date and time is required');
    }
    
    if (!endDateTime) {
      newErrors.push('End date and time is required');
    }
    
    if (startDateTime && endDateTime) {
      const startTime = new Date(startDateTime).getTime();
      const endTime = new Date(endDateTime).getTime();
      
      if (startTime >= endTime) {
        newErrors.push('End time must be after start time');
      }
      
      const duration = endTime - startTime;
      const minDuration = 30 * 60 * 1000; // 30 minutes
      const maxDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (duration < minDuration) {
        newErrors.push('Hackathon duration must be at least 30 minutes');
      }
      
      if (duration > maxDuration) {
        newErrors.push('Hackathon duration cannot exceed 7 days');
      }
    }
    
    if (!adminPassword.trim()) {
      newErrors.push('Admin password is required');
    } else if (adminPassword.length < 6) {
      newErrors.push('Admin password must be at least 6 characters');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  }, [hackathonName, startDateTime, endDateTime, adminPassword]);

  // Handle authentication
  const handleAuth = useCallback(() => {
    const savedConfig = localStorage.getItem('adminConfig');
    if (savedConfig) {
      try {
        const config: AdminConfig = JSON.parse(savedConfig);
        if (config.adminPassword === passwordInput) {
          setIsAuthenticated(true);
          setPasswordInput('');
          return;
        }
      } catch (error) {
        console.error('Error checking password:', error);
      }
    }
    
    // For demo purposes, also allow a default password
    if (passwordInput === 'admin123' || passwordInput === adminPassword) {
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      setErrors(['Invalid admin password']);
    }
  }, [passwordInput, adminPassword]);

  // Handle save configuration
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const config: AdminConfig = {
        hackathonName: hackathonName.trim(),
        hackathonStartTime: startDateTime + '+05:30', // Add IST timezone
        hackathonEndTime: endDateTime + '+05:30', // Add IST timezone
        adminPassword: adminPassword,
        isConfigured: true,
        lastUpdated: Date.now()
      };
      
      // Save to Firebase FIRST (this will trigger listener in Index.tsx)
      console.log('🔄 Saving to Firebase...');
      await writeCloud(config as CloudConfig);
      console.log('✅ Saved to Firebase');
      
      // Save to localStorage as backup
      localStorage.setItem('adminConfig', JSON.stringify(config));
      console.log('✅ Saved to localStorage');
      
      // Call the onSave callback
      onSave(config.hackathonStartTime, config.hackathonEndTime, config.hackathonName);
      
      console.log('✅ Admin configuration saved to Firebase + localStorage:', config);
      
    } catch (error) {
      console.error('❌ Error saving admin config:', error);
      setErrors(['Failed to save configuration to Firebase. Please check your connection and try again.']);
    } finally {
      setIsLoading(false);
    }
  }, [validateForm, hackathonName, startDateTime, endDateTime, adminPassword, onSave]);

  // Quick preset configurations
  const presetConfigs = [
    {
      name: '24 Hour Hackathon',
      duration: 24 * 60 * 60 * 1000,
      description: 'Classic 24-hour hackathon'
    },
    {
      name: '48 Hour Hackathon',
      duration: 48 * 60 * 60 * 1000,
      description: 'Extended 48-hour hackathon'
    },
    {
      name: '72 Hour Hackathon',
      duration: 72 * 60 * 60 * 1000,
      description: 'Marathon 72-hour hackathon'
    },
    {
      name: 'This Weekend',
      duration: 48 * 60 * 60 * 1000,
      description: 'Start this Saturday 9 AM'
    }
  ];

  const applyPreset = useCallback((preset: typeof presetConfigs[0]) => {
    const now = new Date();
    let startTime: Date;
    
    if (preset.name === 'This Weekend') {
      // Next Saturday at 9 AM
      const daysUntilSaturday = (6 - now.getDay()) % 7 || 7;
      startTime = new Date(now);
      startTime.setDate(now.getDate() + daysUntilSaturday);
      startTime.setHours(9, 0, 0, 0);
    } else {
      // Start tomorrow at 9 AM
      startTime = new Date(now);
      startTime.setDate(now.getDate() + 1);
      startTime.setHours(9, 0, 0, 0);
    }
    
    const endTime = new Date(startTime.getTime() + preset.duration);
    
    setStartDateTime(startTime.toISOString().slice(0, 16));
    setEndDateTime(endTime.toISOString().slice(0, 16));
  }, []);

  return (
    <div className="bg-card border border-cyber-cyan/30 rounded-lg shadow-cyber-glow max-w-2xl w-full mx-auto my-8">
          {!isAuthenticated ? (
            // Authentication Screen
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-cyber font-bold text-cyber-cyan mb-2">
                  🔐 ADMIN ACCESS REQUIRED
                </h2>
                <p className="text-cyber-cyan-dim text-sm">
                  Enter admin password to configure hackathon settings
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cyber-cyan mb-2">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                    className="w-full px-3 py-2 bg-black/50 border border-cyber-cyan/30 rounded text-cyber-cyan focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                    placeholder="Enter admin password"
                  />
                  <p className="text-xs text-cyber-cyan-dim mt-1">
                    Demo password: admin123
                  </p>
                </div>

                {errors.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded p-3">
                    {errors.map((error, index) => (
                      <p key={index} className="text-red-400 text-sm">
                        ⚠ {error}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleAuth}
                    disabled={!passwordInput.trim()}
                    className="flex-1 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 px-4 py-2 rounded hover:bg-cyber-cyan/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    🔓 AUTHENTICATE
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Admin Configuration Screen
            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-cyber font-bold text-cyber-cyan mb-2">
                  ⚙ HACKATHON ADMIN PANEL
                </h2>
                <p className="text-cyber-cyan-dim text-sm">
                  Configure hackathon start and end times
                </p>
              </div>

              <div className="space-y-6">
                {/* Hackathon Name */}
                <div>
                  <label className="block text-sm font-medium text-cyber-cyan mb-2">
                    Hackathon Name
                  </label>
                  <input
                    type="text"
                    value={hackathonName}
                    onChange={(e) => setHackathonName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-cyber-cyan/30 rounded text-cyber-cyan focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                    placeholder="e.g., AI Innovation Hackathon 2025"
                  />
                </div>

                {/* Quick Presets */}
                <div>
                  <label className="block text-sm font-medium text-cyber-cyan mb-2">
                    Quick Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {presetConfigs.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => applyPreset(preset)}
                        className="p-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded hover:bg-purple-500/30 transition-colors text-left"
                      >
                        <div className="font-medium text-sm">{preset.name}</div>
                        <div className="text-xs opacity-75">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date and Time Inputs */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-cyber-cyan mb-2">
                      🚀 Start Date & Time (IST)
                    </label>
                    <input
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-cyber-cyan/30 rounded text-cyber-cyan focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                    />
                    {startDateTime && (
                      <p className="text-xs text-cyber-cyan-dim mt-1">
                        {new Date(startDateTime).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cyber-cyan mb-2">
                      🏁 End Date & Time (IST)
                    </label>
                    <input
                      type="datetime-local"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      className="w-full px-3 py-2 bg-black/50 border border-cyber-cyan/30 rounded text-cyber-cyan focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                    />
                    {endDateTime && (
                      <p className="text-xs text-cyber-cyan-dim mt-1">
                        {new Date(endDateTime).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration Display */}
                {startDateTime && endDateTime && (
                  <div className="bg-blue-500/20 border border-blue-500/30 rounded p-4">
                    <h4 className="text-blue-400 font-medium mb-2">📊 Hackathon Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-300">Duration:</span>
                        <span className="text-blue-400 ml-2">
                          {Math.round((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (1000 * 60 * 60))} hours
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-300">Days:</span>
                        <span className="text-blue-400 ml-2">
                          {Math.ceil((new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Password */}
                <div>
                  <label className="block text-sm font-medium text-cyber-cyan mb-2">
                    🔐 Admin Password (for future access)
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-black/50 border border-cyber-cyan/30 rounded text-cyber-cyan focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan"
                    placeholder="Set admin password (min 6 characters)"
                  />
                </div>

                {/* Error Display */}
                {errors.length > 0 && (
                  <div className="bg-red-500/20 border border-red-500/30 rounded p-3">
                    {errors.map((error, index) => (
                      <p key={index} className="text-red-400 text-sm">
                        ⚠ {error}
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={isLoading || errors.length > 0}
                    className={cn(
                      "flex-1 px-4 py-3 rounded font-medium transition-all",
                      isLoading
                        ? "bg-gray-600/20 text-gray-400 cursor-not-allowed"
                        : "bg-cyber-green/20 text-cyber-green border border-cyber-green/30 hover:bg-cyber-green/30 hover:scale-105"
                    )}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        SAVING...
                      </span>
                    ) : (
                      '💾 SAVE CONFIGURATION'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
  );
};