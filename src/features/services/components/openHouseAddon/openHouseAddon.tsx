'use client'

import styles from './openHouseAddon.module.css';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  addHours,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEffect, useState } from 'react';

export interface OpenHouseData {
  selectedDate: string; // yyyy-MM-dd
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
}

interface Props {
  data: OpenHouseData;
  onChange: (data: OpenHouseData) => void;
}

export default function OpenHouseAddon({ data, onChange }: Props) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    if (!data?.startTime) return;

    const [hours, minutes] = data.startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = addHours(startDate, 2);
    const formattedEndTime = format(endDate, 'HH:mm');
    
    if (formattedEndTime !== data.endTime) {
        onChange({
        ...data,
        endTime: formattedEndTime,
        });
    }
    }, [data.startTime, data.endTime, onChange]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const daysFromPrevMonth = Array.from({ length: firstDayOfWeek }).map((_, i) =>
    new Date(monthStart.getTime() - (firstDayOfWeek - i) * 24 * 60 * 60 * 1000)
  );

  const lastDayOfWeek = monthEnd.getDay();
  const daysFromNextMonth = Array.from({ length: 6 - lastDayOfWeek }).map((_, i) =>
    new Date(monthEnd.getTime() + (i + 1) * 24 * 60 * 60 * 1000)
  );

  const allDays = [...daysFromPrevMonth, ...daysInMonth, ...daysFromNextMonth];

  return (
    <div className={styles.mainContainer}>
      <div className={styles.monthlyCalendar}>
        <div className={styles.header}>
          <h2>{format(currentMonth, 'MMMM yyyy', { locale: fr })}</h2>
          <div className={styles.navigationButtons}>
            <button type="button" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
              ← Prev
            </button>
            <button type="button" onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                onChange({ 
                ...data, 
                selectedDate: format(today, 'yyyy-MM-dd')
                });
            }}>
              Today
            </button>
            <button type="button" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
              Next →
            </button>
          </div>
        </div>

        <div className={styles.weekDays}>
          {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
            <div key={day} className={styles.weekDay}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.daysGrid}>
          {allDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const dayString = format(day, 'yyyy-MM-dd');
            const isSelected = data.selectedDate === dayString;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onChange({ ...data, selectedDate: dayString })}
                className={`${styles.day} ${!isCurrentMonth ? styles.otherMonth : ''} ${
                  isSelected ? styles.selected : ''
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.hourSelection}>
        <div>
          <label htmlFor="startTime">Heure de début:</label>
          <input
            id="startTime"
            type="time"
            value={data.startTime}
            onChange={(e) => onChange({ ...data, startTime: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="endTime">Heure de fin:</label>
          <input
            id="endTime"
            type="time"
            value={data.endTime}
            onChange={(e) => onChange({ ...data, endTime: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}