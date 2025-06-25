import React, { useEffect, useState } from 'react';
import { convertGRID } from '../utils/geoUtil';

type ForecastItem = {
  baseDate: string;
  category: 'TMN' | 'TMX';
  fcstDate: string;
  fcstValue: string;
};

type MosquitoIndex = {
  label: string;
  tmin: number;
  tmax: number;
  index: number;
};

function MainPage() {
  const [regionName, setRegionName] = useState('');
  const [indices, setIndices] = useState<MosquitoIndex[]>([]);

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation을 지원하지 않는 브라우저입니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const { nx, ny } = convertGRID(latitude, longitude);

        // 위치 전송
        fetch('http://localhost:8080/api/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nx, ny }),
        })
          .then((res) => res.json())
          .then((items: ForecastItem[]) => {
            const result = calculateMosquitoIndex(items);
            setIndices(result);
          });

        // 카카오 역지오코딩
        const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY;
        fetch(`https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${longitude}&y=${latitude}`, {
          headers: {
            Authorization: `KakaoAK ${KAKAO_API_KEY}`,
          },
        })
          .then(res => res.json())
          .then((result) => {
            const region = result.documents[0];
            const name = `${region.region_1depth_name} ${region.region_2depth_name}`;
            setRegionName(name);
          })
          .catch(err => console.error('카카오 역지오코딩 실패', err));
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error.message);
      }
    );
  }, []);

  // 모기지수 계산 로직
  function calculateMosquitoIndex(items: ForecastItem[]): MosquitoIndex[] {
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
      const index = -10.4381 + 1.9413 * temps.tmin + 0.8029 * temps.tmax;
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

  return (
    <div>
      <h1>메인 페이지입니다!</h1>
      {regionName && <p>현재 위치는 {regionName}입니다.</p>}
      {indices.length > 0 && (
        <div>
          <h2>모기지수 예보</h2>
          <ul>
            {indices.map((item) => (
              <li key={item.label}>
                {item.label}: 최저 {item.tmin}°C / 최고 {item.tmax}°C → 모기지수 {item.index}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default MainPage;
