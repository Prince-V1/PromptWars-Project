"use client";

import React from "react";
import { Search, ArrowUpDown, X, Zap, MapPin } from "lucide-react";

interface FoodFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedDietary: string;
  onDietaryChange: (diet: string) => void;
  maxDistance: number;
  onDistanceChange: (dist: number) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  urgentOnly?: boolean;
  onUrgentToggle?: (val: boolean) => void;
  sortBy?: string;
  onSortChange?: (val: string) => void;
}

const categories = [
  { label: "All Items", value: "" },
  { label: "🥘 Cooked Meals", value: "cooked_meals" },
  { label: "🥖 Bakery & Breads", value: "bakery" },
  { label: "📦 Packaged Groceries", value: "packaged_groceries" },
  { label: "🥗 Fresh Produce", value: "fresh_produce" },
  { label: "🥛 Dairy", value: "dairy" },
  { label: "🐾 Animal Feed", value: "animal_feed" },
];

export function FoodFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDietary,
  onDietaryChange,
  maxDistance,
  onDistanceChange,
  statusFilter,
  onStatusChange,
  urgentOnly = false,
  onUrgentToggle,
  sortBy = "priority",
  onSortChange,
}: FoodFiltersProps) {
  const isPureVeg = selectedDietary === "veg";

  return (
    <div className="bg-white rounded-3xl border border-freshBorder p-4 sm:p-5 space-y-4 mb-6 shadow-subtle">
      {/* ======================================================== */}
      {/* ZOMATO-STYLE SEARCH & LOCATION BAR                       */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Location Indicator (like Zomato header) */}
        <div className="flex items-center gap-2 px-3.5 py-3 bg-freshBg border border-freshBorder rounded-2xl text-xs font-semibold text-freshText-primary shrink-0 w-full sm:w-auto">
          <MapPin className="w-4 h-4 text-freshSuccess shrink-0" />
          <span className="truncate">Delhi NCR</span>
          <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-freshText-secondary border border-freshBorder ml-auto sm:ml-1">
            Central
          </span>
        </div>

        {/* Search Input with Clear Button */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-freshText-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for donor hotel, dish name, or cuisine (e.g. Dal Makhani, Bread, Biryani)..."
            className="w-full pl-11 pr-10 py-3 bg-freshBg border border-freshBorder rounded-2xl text-xs sm:text-sm text-freshText-primary placeholder:text-freshText-secondary focus:outline-none focus:ring-2 focus:ring-lime-400 focus:bg-white transition-all font-medium"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-freshBorder flex items-center justify-center text-freshText-secondary hover:text-freshText-primary"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* ZOMATO-SIGNATURE HORIZONTAL FILTER CHIPS ROW             */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
        {/* Zomato-Signature Pure Veg Toggle Pill */}
        <button
          onClick={() => onDietaryChange(isPureVeg ? "" : "veg")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
            isPureVeg
              ? "bg-[#258A54] text-white border-[#258A54] shadow-md"
              : "bg-white text-freshText-primary border-freshBorder hover:bg-freshBg"
          }`}
        >
          <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center border-2 border-[#258A54]">
            <div className="w-2 h-2 rounded-full bg-[#258A54]" />
          </div>
          <span>Pure Veg</span>
        </button>

        {/* Zomato-Style Urgent / High Priority Rescue Pill */}
        {onUrgentToggle && (
          <button
            onClick={() => onUrgentToggle(!urgentOnly)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border shrink-0 ${
              urgentOnly
                ? "bg-amber-500 text-white border-amber-500 shadow-md"
                : "bg-white text-freshText-primary border-freshBorder hover:bg-freshBg"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${urgentOnly ? "fill-white text-white" : "text-amber-500"}`} />
            <span>High Urgency</span>
          </button>
        )}

        {/* Category Pills */}
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              selectedCategory === cat.value
                ? "bg-lime text-freshText-primary border-lime-400 shadow-sm font-extrabold"
                : "bg-white text-freshText-secondary hover:text-freshText-primary hover:bg-freshBg border-freshBorder"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* SECONDARY QUICK CONTROLS: RADIUS & SORTING               */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-freshBorder text-xs">
        {/* Distance Range */}
        <div className="flex items-center gap-1.5">
          <span className="text-freshText-secondary font-medium">Radius:</span>
          {[5, 15, 30, 50].map((km) => (
            <button
              key={km}
              onClick={() => onDistanceChange(km)}
              className={`px-3 py-1 rounded-full font-semibold transition-colors ${
                maxDistance === km
                  ? "bg-freshText-primary text-white font-bold shadow-xs"
                  : "bg-freshBg text-freshText-secondary hover:text-freshText-primary border border-freshBorder"
              }`}
            >
              {km} km
            </button>
          ))}
        </div>

        {/* Sort & Status Filters */}
        <div className="flex items-center gap-2 ml-auto">
          {onSortChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-freshText-secondary font-medium hidden sm:inline flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="bg-freshBg border border-freshBorder rounded-xl px-3 py-1 text-xs text-freshText-primary focus:outline-none focus:ring-1 focus:ring-lime-400 font-semibold"
              >
                <option value="priority">Urgency (Expiring Soon)</option>
                <option value="distance">Nearest Distance</option>
                <option value="quantity">Largest Batch</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-freshBg border border-freshBorder rounded-xl px-3 py-1 text-xs text-freshText-primary focus:outline-none focus:ring-1 focus:ring-lime-400 font-semibold"
            >
              <option value="available">Available Now</option>
              <option value="">All Statuses</option>
              <option value="reserved">Reserved</option>
              <option value="completed">Delivered</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
