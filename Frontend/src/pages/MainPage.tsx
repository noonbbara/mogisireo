import React, { useEffect, useState } from 'react';
import { convertGRID } from '../utils/geoUtil';

function MainPage() {
  const [regionName, setRegionName] = useState('');

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation을 지원하지 않는 브라우저입니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('위도:', latitude);
        console.log('경도:', longitude);

        const { nx, ny } = convertGRID(latitude, longitude);
        console.log('nx:', nx, 'ny:', ny);

        // 서버에 nx, ny 전송
        fetch('http://localhost:8080/api/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ nx, ny }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log('서버 응답:', data);
          });

        // 카카오 역지오코딩 호출
        const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY; // 실제 키로 대체

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
    <div>
      <h1>메인 페이지입니다!</h1>
      {regionName && <p>현재 위치는 {regionName}입니다.</p>}
    </div>
  );
}

export default MainPage;
