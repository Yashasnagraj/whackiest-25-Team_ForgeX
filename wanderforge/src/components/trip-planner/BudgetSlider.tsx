// Budget Slider for Trip Planning
import { useState } from 'react';
import { IndianRupee, Users, User } from 'lucide-react';
import type { TripBudget } from '../../services/itinerary/direct-input.types';

interface BudgetSliderProps {
  budget: TripBudget;
  onChange: (budget: Partial<TripBudget>) => void;
}

// Budget presets
const BUDGET_PRESETS = [
  { label: 'Budget', amount: 5000, color: 'text-emerald-400' },
  { label: 'Moderate', amount: 15000, color: 'text-primary-400' },
  { label: 'Comfort', amount: 30000, color: 'text-amber-400' },
  { label: 'Luxury', amount: 50000, color: 'text-purple-400' },
];

export function BudgetSlider({ budget, onChange }: BudgetSliderProps) {
  const [isCustom, setIsCustom] = useState(false);

  // Format amount with Indian numbering
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  // Get budget category
  const getBudgetCategory = (amount: number) => {
    if (amount <= 5000) return { label: 'Budget', color: 'text-emerald-400' };
    if (amount <= 15000) return { label: 'Moderate', color: 'text-primary-400' };
    if (amount <= 30000) return { label: 'Comfort', color: 'text-amber-400' };
    return { label: 'Luxury', color: 'text-purple-400' };
  };

  const category = getBudgetCategory(budget.amount);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-dark-300 text-sm font-medium">Budget</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ perPerson: true })}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
              budget.perPerson
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
            }`}
          >
            <User className="w-3 h-3" />
            Per Person
          </button>
          <button
            onClick={() => onChange({ perPerson: false })}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
              !budget.perPerson
                ? 'bg-primary-500/20 text-primary-400'
                : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
            }`}
          >
            <Users className="w-3 h-3" />
            Total
          </button>
        </div>
      </div>

      {/* Amount Display */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-primary-400" />
            <input
              type="number"
              value={budget.amount}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100000, Number(e.target.value)));
                onChange({ amount: value });
                setIsCustom(true);
              }}
              className="bg-transparent text-2xl font-bold text-white w-32 focus:outline-none"
            />
          </div>
          <div className={`px-3 py-1 rounded-full bg-dark-700 ${category.color}`}>
            {category.label}
          </div>
        </div>
        <p className="text-dark-400 text-sm mt-1">
          {budget.perPerson ? 'per person' : 'total budget'}
        </p>
      </div>

      {/* Slider */}
      <div className="relative mb-4">
        <input
          type="range"
          min="1000"
          max="100000"
          step="1000"
          value={budget.amount}
          onChange={(e) => {
            onChange({ amount: Number(e.target.value) });
            setIsCustom(true);
          }}
          className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                     [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-primary-500
                     [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-110"
        />
        <div className="flex justify-between text-xs text-dark-500 mt-1">
          <span>1K</span>
          <span>25K</span>
          <span>50K</span>
          <span>75K</span>
          <span>1L</span>
        </div>
      </div>

      {/* Presets */}
      <div className="flex gap-2">
        {BUDGET_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => {
              onChange({ amount: preset.amount });
              setIsCustom(false);
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              budget.amount === preset.amount && !isCustom
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            <span className="block">{preset.label}</span>
            <span className="block text-xs opacity-70">{formatAmount(preset.amount)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
