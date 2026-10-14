import { describe, expect, it } from "vitest";
import { replayDays } from "./health-replay";
import type { AppData, GlucoseReading } from "./types";
const now = new Date(2026, 9, 14, 12);
const reading = (day: number, hour: number, value: number, context: GlucoseReading['context'] = 'fasting'): GlucoseReading => ({ id: `${day}-${hour}`, timestamp: new Date(2026,9,day,hour).toISOString(), value, context, unit: 'mmol/L', source: 'user' });
describe('three-day replay', () => {
  it('keeps missing calendar days and excludes future and non-fasting readings', () => {
    const data = { readings: [reading(12,7,8),reading(12,9,9),reading(14,7,10),reading(14,15,12),reading(13,8,11,'random')], logs: [] } as unknown as AppData;
    const result = replayDays(data,now);
    expect(result.map(d=>d.reading?.value)).toEqual([9,undefined,10]);
    expect(result[1]!.date.getDate()).toBe(13);
  });
  it('groups context by local calendar day without modifying records', () => {
    const data = { readings: [], logs: [{ id:'meal',category:'meal',title:'Dinner',timestamp:new Date(2026,9,13,20).toISOString(),source:'user' }] } as unknown as AppData;
    const before=JSON.stringify(data);
    const result=replayDays(data,now);
    expect(result[1]!.logs[0]?.title).toBe('Dinner');
    expect(result[0]!.logs).toEqual([]);
    expect(JSON.stringify(data)).toBe(before);
  });
});
