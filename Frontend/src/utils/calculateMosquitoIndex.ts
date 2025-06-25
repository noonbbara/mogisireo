export interface ForecastItem {
  baseDate: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
}

export interface MosquitoIndex {
  label: string;
  tmin: number;
  tmax: number;
  index: number;
}

export function calculateMosquitoIndex(items: ForecastItem[]): MosquitoIndex[] {
  const baseDateStr = items[0]?.baseDate;
  if (!baseDateStr) return [];

  const baseDate = new Date(
    `${baseDateStr.substring(0, 4)}-${baseDateStr.substring(4, 6)}-${baseDateStr.substring(6, 8)}`
  );

  const dateMap: Record<string, { tmin?: number; tmax?: number }> = {};

  items.forEach((item) => {
    const { category, fcstDate, fcstValue } = item;
    if (!['TMN', 'TMX'].includes(category)) return;
    if (!dateMap[fcstDate]) dateMap[fcstDate] = {};
    const temp = parseFloat(fcstValue);
    if (category === 'TMN') dateMap[fcstDate].tmin = temp;
    if (category === 'TMX') dateMap[fcstDate].tmax = temp;
  });

  const results: MosquitoIndex[] = [];

  Object.entries(dateMap).forEach(([fcstDateStr, temps]) => {
    const fcstDate = new Date(
      `${fcstDateStr.substring(0, 4)}-${fcstDateStr.substring(4, 6)}-${fcstDateStr.substring(6, 8)}`
    );
    const diffDays = Math.round((fcstDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

    const label =
      diffDays === 1
        ? '오늘'
        : diffDays === 2
        ? '내일'
        : diffDays === 3
        ? '모레'
        : diffDays === 4
        ? '글피'
        : null;

    if (label && temps.tmin !== undefined && temps.tmax !== undefined) {
      let index = -10.4381 + 1.9413 * temps.tmin + 0.8029 * temps.tmax;
      // 0 미만이면 0으로, 100 이상이면 100으로 제한
        if (index < 0) {
        index = 0;
        } else if (index > 100) {
        index = 100;
        }
      const rounded = parseFloat(index.toFixed(2));

      console.log(
        `[${label}] TMN: ${temps.tmin}, TMX: ${temps.tmax} → 모기지수: ${rounded}`
      );

      results.push({
        label,
        tmin: temps.tmin,
        tmax: temps.tmax,
        index: rounded,
      });
    }
  });

  return results;
}