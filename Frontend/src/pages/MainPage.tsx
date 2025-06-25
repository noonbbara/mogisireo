import React, { useEffect, useState } from 'react';
import { convertGRID } from '../utils/geoUtil';
import { calculateMosquitoIndex } from '../utils/calculateMosquitoIndex';
import type { ForecastItem, MosquitoIndex } from '../utils/calculateMosquitoIndex';

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
        console.log('위도:', latitude, '경도:', longitude);
        console.log('nx:', nx, 'ny:', ny);

        fetch('http://localhost:8080/api/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nx, ny }),
        })
          .then((res) => res.json())
          .then((items: ForecastItem[]) => {
            console.log('받은 예보 데이터:', items);
            const result = calculateMosquitoIndex(items);
            setIndices(result);
          })
          .catch((err) => console.error('예보 데이터 요청 실패:', err));

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
            console.log('현재 행정구역:', name);
            setRegionName(name);
          })
          .catch(err => console.error('카카오 역지오코딩 실패', err));
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error.message);
      }
    );
  }, []);

  return (
  <div
    style={{
      maxWidth: 480,
      margin: '2rem auto',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '0 1rem',
      color: '#333',
    }}
  >
    <h1
      style={{
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '1.5rem',
        textAlign: 'center',
      }}
    >
      모기지수 예보
    </h1>

    {regionName && (
      <p
        style={{
          fontSize: '1.2rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        현재 위치는 <strong>{regionName}</strong>입니다.
      </p>
    )}

    {indices.length > 0 && (
      <section>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {indices.map((item) => {
            let bgColor = '';
            let status = '';

            if (item.index < 25) {
              bgColor = '#a8d5a3'; // 연한 초록
              status = '쾌적';
            } else if (item.index < 50) {
              bgColor = '#f7e48b'; // 연한 노랑
              status = '관심';
            } else if (item.index < 75) {
              bgColor = '#fbcf9c'; // 연한 주황
              status = '주의';
            } else {
              bgColor = '#f5a7a7'; // 연한 빨강
              status = '불쾌';
            }

            return (
              <div
                key={item.label}
                style={{
                  backgroundColor: bgColor,
                  borderRadius: 12,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  padding: '1.2rem 1rem',
                  minWidth: 120,
                  textAlign: 'center',
                  userSelect: 'none',
                  transition: 'transform 0.2s',
                  cursor: 'default',
                  color: '#333',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: '700',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontWeight: '800',
                    fontSize: '1.5rem',
                  }}
                >
                  {status}
                </div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    marginTop: 4,
                  }}
                >
                  {item.index}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    )}
  </div>
);

}

export default MainPage;
