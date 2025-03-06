import { Injectable } from '@nestjs/common';

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
}

@Injectable()
export class ScheduleService {
  private scheduleData: ScheduleEvent[] = [];
  private lastGenerated: number = 0; // ms

  getSchedule(): ScheduleEvent[] {
    const now = Date.now();
    const TWO_MINUTES = 2 * 60 * 1000;

    if (now - this.lastGenerated <= TWO_MINUTES) {
      return this.scheduleData;
    }

    // generate new
    this.scheduleData = this.generateScheduleEvents();
    this.lastGenerated = now;
    return this.scheduleData;
  }

  private generateScheduleEvents(): ScheduleEvent[] {
    const eventCount = Math.floor(Math.random() * 5) + 1; // 1..5
    const events: ScheduleEvent[] = [];
    for (let i = 1; i <= eventCount; i++) {
      events.push({
        id: `evt-${Date.now()}-${i}`,
        title: `Event #${i}`,
        description: `Generated at ${new Date().toISOString()}`,
      });
    }
    return events;
  }

  getEventDetail(eventId: string): ScheduleEvent | null {
    return this.scheduleData.find((e) => e.id === eventId) || null;
  }
}
