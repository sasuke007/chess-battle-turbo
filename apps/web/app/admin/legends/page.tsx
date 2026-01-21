"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/app/components/Navbar";
import { Plus, Edit2, Save, X, Trash2 } from "lucide-react";

interface Legend {
  id: string;
  referenceId: string;
  name: string;
  era: string;
  profilePhotoUrl: string | null;
  peakRating: number | null;
  nationality: string | null;
  shortDescription: string;
  playingStyle: string | null;
  birthYear: number | null;
  deathYear: number | null;
  achievements: string[] | null;
  famousGames: { fen: string; description?: string }[] | null;
  isActive: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LegendFormData {
  name: string;
  era: string;
  profilePhotoUrl: string;
  peakRating: string;
  nationality: string;
  shortDescription: string;
  playingStyle: string;
  birthYear: string;
  deathYear: string;
  achievements: string;
  isActive: boolean;
  isVisible: boolean;
}

const initialFormData: LegendFormData = {
  name: "",
  era: "",
  profilePhotoUrl: "",
  peakRating: "",
  nationality: "",
  shortDescription: "",
  playingStyle: "",
  birthYear: "",
  deathYear: "",
  achievements: "",
  isActive: true,
  isVisible: false,
};

export default function LegendsAdmin() {
  const [legends, setLegends] = useState<Legend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LegendFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLegends();
  }, []);

  const fetchLegends = async () => {
    try {
      const response = await fetch("/api/legends");
      const data = await response.json();
      if (data.success) {
        setLegends(data.data.legends);
      }
    } catch (error) {
      console.error("Error fetching legends:", error);
      alert("Failed to fetch legends");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (legend: Legend) => {
    setEditingId(legend.id);
    setFormData({
      name: legend.name,
      era: legend.era,
      profilePhotoUrl: legend.profilePhotoUrl || "",
      peakRating: legend.peakRating?.toString() || "",
      nationality: legend.nationality || "",
      shortDescription: legend.shortDescription,
      playingStyle: legend.playingStyle || "",
      birthYear: legend.birthYear?.toString() || "",
      deathYear: legend.deathYear?.toString() || "",
      achievements: legend.achievements?.join(", ") || "",
      isActive: legend.isActive ?? true,
      isVisible: legend.isVisible ?? false,
    });
    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleDelete = async (legendId: string, legendName: string) => {
    if (!confirm(`Are you sure you want to delete ${legendName}? This will remove the legend and unlink any associated chess positions.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/legends/${legendId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Server error response:", text);
        throw new Error(`Server error: ${response.status} - ${text}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(`Legend deleted successfully. ${data.data.deletedLegend.gamesAffected} chess positions were unlinked.`);
        fetchLegends();
      } else {
        console.error("API Error:", data);
        alert(data.error || "Failed to delete legend");
      }
    } catch (error) {
      console.error("Error deleting legend:", error);
      alert(`Failed to delete legend: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        era: formData.era,
        profilePhotoUrl: formData.profilePhotoUrl || null,
        peakRating: formData.peakRating ? parseInt(formData.peakRating) : null,
        nationality: formData.nationality || null,
        shortDescription: formData.shortDescription,
        playingStyle: formData.playingStyle || null,
        birthYear: formData.birthYear ? parseInt(formData.birthYear) : null,
        deathYear: formData.deathYear ? parseInt(formData.deathYear) : null,
        achievements: formData.achievements
          ? formData.achievements.split(",").map((a) => a.trim()).filter(Boolean)
          : null,
        isActive: formData.isActive,
        isVisible: formData.isVisible,
      };

      console.log("Sending payload:", payload);

      const url = editingId ? `/api/legends/${editingId}` : "/api/legends/create";
      const method = editingId ? "PUT" : "POST";

      console.log("Making request to:", url, "with method:", method);

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      // Check if response is ok first
      if (!response.ok) {
        const text = await response.text();
        console.error("Server error response:", text);
        throw new Error(`Server error: ${response.status} - ${text}`);
      }

      const data = await response.json();

      if (data.success) {
        alert(editingId ? "Legend updated successfully" : "Legend created successfully");
        handleCancel();
        fetchLegends();
      } else {
        console.error("API Error:", data);
        const errorMsg = data.details
          ? `${data.error}: ${JSON.stringify(data.details)}`
          : data.error;
        alert(errorMsg || "Failed to save legend");
      }
    } catch (error) {
      console.error("Error saving legend:", error);
      alert(`Failed to save legend: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#141414] to-[#1a1a1a] pt-20">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500">
                  Manage Legends
                </span>
              </h1>
              <p className="text-neutral-400">Add and edit chess legends</p>
            </div>
            {!showForm && (
              <button
                onClick={handleCreateNew}
                className={cn(
                  "flex items-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all duration-200",
                  "bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800",
                  "text-white border border-white/20 hover:border-white/30",
                  "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.04)]",
                  "hover:scale-[1.02]"
                )}
              >
                <Plus className="w-5 h-5" />
                Add Legend
              </button>
            )}
          </div>

          {/* Separator */}
          <div className="border-t border-white/10 mb-8"></div>

          {/* Form */}
          {showForm && (
            <div className="mb-8 p-6 rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingId ? "Edit Legend" : "Create New Legend"}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border border-white/10",
                        "bg-white/5 text-white placeholder-neutral-500",
                        "focus:outline-none focus:border-white/20 transition-colors"
                      )}
                      placeholder="Magnus Carlsen"
                    />
                  </div>

                  {/* Era */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Era *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.era}
                      onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border border-white/10",
                        "bg-white/5 text-white placeholder-neutral-500",
                        "focus:outline-none focus:border-white/20 transition-colors"
                      )}
                      placeholder="Modern Era"
                    />
                  </div>

                  {/* Profile Photo URL */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Profile Photo URL
                    </label>
                    <input
                      type="url"
                      value={formData.profilePhotoUrl}
                      onChange={(e) => setFormData({ ...formData, profilePhotoUrl: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border border-white/10",
                        "bg-white/5 text-white placeholder-neutral-500",
                        "focus:outline-none focus:border-white/20 transition-colors"
                      )}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>

                  {/* Peak Rating */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Peak Rating
                    </label>
                    <input
                      type="number"
                      value={formData.peakRating}
                      onChange={(e) => setFormData({ ...formData, peakRating: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border border-white/10",
                        "bg-white/5 text-white placeholder-neutral-500",
                        "focus:outline-none focus:border-white/20 transition-colors"
                      )}
                      placeholder="2882"
                    />
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border border-white/10",
                        "bg-white/5 text-white placeholder-neutral-500",
                        "focus:outline-none focus:border-white/20 transition-colors"
                      )}
                      placeholder="NOR"
                    />
                  </div>

                  {/* Birth Year */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Birth Year
                    </label>
                    <input
                      type="number"
                      value={formData.birthYear}
                      onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border border-white/10",
                        "bg-white/5 text-white placeholder-neutral-500",
                        "focus:outline-none focus:border-white/20 transition-colors"
                      )}
                      placeholder="1990"
                    />
                  </div>

                  {/* Death Year */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Death Year
                    </label>
                    <input
                      type="number"
                      value={formData.deathYear}
                      onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border border-white/10",
                        "bg-white/5 text-white placeholder-neutral-500",
                        "focus:outline-none focus:border-white/20 transition-colors"
                      )}
                      placeholder="Leave empty if alive"
                    />
                  </div>

                  {/* Is Active */}
                  <div className="flex items-center gap-3 mt-8">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-neutral-300">
                      Active (Enable in system)
                    </label>
                  </div>

                  {/* Is Visible */}
                  <div className="flex items-center gap-3 mt-8">
                    <input
                      type="checkbox"
                      id="isVisible"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                      className="w-5 h-5 rounded border-white/20 bg-white/5"
                    />
                    <label htmlFor="isVisible" className="text-sm font-medium text-neutral-300">
                      Visible on UI (Show in legend selection)
                    </label>
                  </div>
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Short Description * (max 500 chars)
                  </label>
                  <textarea
                    required
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    maxLength={500}
                    rows={3}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border border-white/10",
                      "bg-white/5 text-white placeholder-neutral-500",
                      "focus:outline-none focus:border-white/20 transition-colors resize-none"
                    )}
                    placeholder="Greatest player of all time with exceptional endgame technique"
                  />
                </div>

                {/* Playing Style */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Playing Style
                  </label>
                  <textarea
                    value={formData.playingStyle}
                    onChange={(e) => setFormData({ ...formData, playingStyle: e.target.value })}
                    rows={2}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border border-white/10",
                      "bg-white/5 text-white placeholder-neutral-500",
                      "focus:outline-none focus:border-white/20 transition-colors resize-none"
                    )}
                    placeholder="Positional mastery with exceptional endgame technique"
                  />
                </div>

                {/* Achievements */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Achievements (comma-separated)
                  </label>
                  <textarea
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    rows={2}
                    className={cn(
                      "w-full px-4 py-3 rounded-lg border border-white/10",
                      "bg-white/5 text-white placeholder-neutral-500",
                      "focus:outline-none focus:border-white/20 transition-colors resize-none"
                    )}
                    placeholder="5-time World Champion, Longest #1 ranking in history"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={cn(
                      "flex items-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all duration-200",
                      "bg-gradient-to-b from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800",
                      "text-white border border-white/20 hover:border-white/30",
                      "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_8px_32px_0_rgba(255,255,255,0.04)]",
                      "hover:scale-[1.02]",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    )}
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? "Saving..." : editingId ? "Update Legend" : "Create Legend"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={cn(
                      "py-3 px-6 rounded-xl font-semibold transition-all duration-200",
                      "border border-white/10 hover:border-white/20",
                      "text-neutral-300 hover:text-white",
                      "hover:bg-white/5"
                    )}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Legends List */}
          {isLoading ? (
            <div className="text-center text-white py-12">Loading...</div>
          ) : legends.length === 0 ? (
            <div className="text-center text-neutral-400 py-12">
              No legends found. Create your first legend!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {legends.map((legend) => (
                <div
                  key={legend.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-200",
                    "bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl",
                    "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{legend.name}</h3>
                      <p className="text-sm text-neutral-400">{legend.era}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(legend)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Edit legend"
                      >
                        <Edit2 className="w-4 h-4 text-neutral-400 hover:text-white" />
                      </button>
                      <button
                        onClick={() => handleDelete(legend.id, legend.name)}
                        className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Delete legend"
                      >
                        <Trash2 className="w-4 h-4 text-neutral-400 hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-300 mb-3 line-clamp-2">
                    {legend.shortDescription}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    {legend.peakRating && <span>Rating: {legend.peakRating}</span>}
                    {legend.nationality && <span>{legend.nationality}</span>}
                    <div className="ml-auto flex gap-2">
                      <span className={cn(
                        "px-2 py-1 rounded",
                        legend.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {legend.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded",
                        legend.isVisible ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"
                      )}>
                        {legend.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
