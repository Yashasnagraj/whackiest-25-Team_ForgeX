// Date Range Picker for Trip Planning
import { Calendar, ArrowRight } from 'lucide-react';
import { calculateTripDays } from '../../services/itinerary/direct-input.types';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const days = calculateTripDays(startDate, endDate);

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  // Get max date (1 year from now)
  // eslint-disable-next-line react-hooks/purity
  const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    onChange(newStart, endDate);

    // Auto-adjust end date if it's before start
    if (endDate && newStart > endDate) {
      // Set end date to start + 2 days
      const endDateObj = new Date(newStart);
      endDateObj.setDate(endDateObj.getDate() + 2);
      onChange(newStart, endDateObj.toISOString().split('T')[0]);
    }
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(startDate, e.target.value);
  };

  return (
    <div>
      <label className="block text-dark-300 text-sm font-medium mb-2">
        When are you traveling?
      </label>

      <div className="flex items-center gap-3">
        {/* Start Date */}
        <div className="relative flex-1">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          <input
            type="date"
            value={startDate}
            min={today}
            max={maxDate}
            onChange={handleStartChange}
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl
                       text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                       transition-colors [color-scheme:dark]"
          />
        </div>

        <ArrowRight className="w-5 h-5 text-dark-500 flex-shrink-0" />

        {/* End Date */}
        <div className="relative flex-1">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          <input
            type="date"
            value={endDate}
            min={startDate || today}
            max={maxDate}
            onChange={handleEndChange}
            className="w-full pl-12 pr-4 py-3 bg-dark-800 border border-dark-700 rounded-xl
                       text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500
                       transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Days Badge */}
        {days > 0 && (
          <div className="px-4 py-3 bg-primary-500/20 border border-primary-500/30 rounded-xl
                          flex-shrink-0">
            <span className="text-primary-400 font-semibold whitespace-nowrap">
              {days} {days === 1 ? 'day' : 'days'}
            </span>
          </div>
        )}
      </div>

      {/* Quick select buttons */}
      <div className="flex gap-2 mt-3">
        {[
          { label: 'Weekend', days: 2 },
          { label: '3 Days', days: 3 },
          { label: '5 Days', days: 5 },
          { label: 'Week', days: 7 },
          { label: '2 Weeks', days: 14 },
        ].map(({ label, days: d }) => (
          <button
            key={label}
            onClick={() => {
              const start = new Date();
              // Set to next Friday for weekend
              if (d === 2) {
                const dayOfWeek = start.getDay();
                const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
                start.setDate(start.getDate() + daysUntilFriday);
              }
              const end = new Date(start);
              end.setDate(end.getDate() + d - 1);
              onChange(
                start.toISOString().split('T')[0],
                end.toISOString().split('T')[0]
              );
            }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              days === d
                ? 'bg-primary-500 text-white'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
