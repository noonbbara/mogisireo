import React, { useEffect } from 'react';
import { convertGRID } from '../utils/geoUtil';

function MainPage() {
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

        // 좌표 변환
        const { nx, ny } = convertGRID(latitude, longitude);
        console.log('nx:', nx);
        console.log('ny:', ny);

        // Spring 서버로 POST 요청
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
          })
          .catch((error) => {
            console.error('서버 통신 오류:', error);
          });
      },
      (error) => {
        console.error('위치 정보 가져오기 실패:', error.message);
      }
    );
  }, []);

  return (
    <div>
      <h1>메인 페이지입니다!</h1>
      <p>개발자 도구 콘솔에서 위도/경도와 nx, ny 값을 확인하세요.</p>
    </div>
  );
}

export default MainPage;
