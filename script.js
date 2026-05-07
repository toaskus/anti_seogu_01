document.addEventListener('DOMContentLoaded', () => {
    const storeGrid = document.getElementById('storeGrid');
    const searchInput = document.getElementById('searchInput');
    const loadingText = document.getElementById('loadingText');

    let allStores = [];

    // Base64 디코딩 (한글 깨짐 방지 위해 Uint8Array 사용)
    function decodeBase64Utf8(base64Str) {
        const binaryStr = atob(base64Str);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
        }
        
        let decoder;
        try {
            // 한글 인코딩 체크 (기본 utf-8 시도)
            decoder = new TextDecoder('utf-8', {fatal: true});
            return decoder.decode(bytes);
        } catch (e) {
            // 실패시 euc-kr로 재시도
            decoder = new TextDecoder('euc-kr');
            return decoder.decode(bytes);
        }
    }

    try {
        if (typeof csvBase64 !== 'undefined') {
            const csvText = decodeBase64Utf8(csvBase64);
            
            // PapaParse를 통해 CSV 문서를 파싱
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    allStores = results.data;
                    renderCards(allStores);
                    loadingText.style.display = 'none';
                    searchInput.focus();
                }
            });
        } else {
            throw new Error('data.js 파일에서 데이터를 찾을 수 없습니다.');
        }
    } catch (err) {
        storeGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 2rem;">오류가 발생했습니다: ${err.message}</div>`;
        loadingText.style.display = 'none';
        console.error(err);
    }

    // 카드 렌더링 함수
    function renderCards(stores) {
        storeGrid.innerHTML = ''; // 초기화

        // 화면 렌더링 최적화를 위해 최대 100개만 표시
        const displayStores = stores.slice(0, 100);

        if (displayStores.length === 0) {
            storeGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 2rem;">검색 결과가 없습니다.</div>';
            return;
        }

        displayStores.forEach(store => {
            if (!store.name || !store.address) return;

            const card = document.createElement('div');
            card.className = 'store-card';
            card.style.cursor = 'pointer';
            
            // 네이버 지도 클릭 이벤트
            card.addEventListener('click', () => {
                const searchQuery = encodeURIComponent(store.address + ' ' + store.name);
                const naverMapUrl = `https://map.naver.com/v5/search/${searchQuery}`;
                window.open(naverMapUrl, '_blank');
            });
            
            card.innerHTML = `
                <div class="card-category">${store.category || '분류없음'}</div>
                <h3 class="card-title">${store.name}</h3>
                <div class="card-detail">
                    <span class="card-icon">📍</span>
                    <span>${store.address}</span>
                </div>
                <div class="card-detail">
                    <span class="card-icon">📞</span>
                    <span>${store.phone || '번호없음'}</span>
                </div>
                ${store.note ? `<div class="card-note">💡 ${store.note}</div>` : ''}
            `;

            storeGrid.appendChild(card);
        });
        
        // 데이터가 100개 이상일 경우 안내 문구 추가
        if (stores.length > 100) {
            const moreInfo = document.createElement('div');
            moreInfo.style.gridColumn = '1 / -1';
            moreInfo.style.textAlign = 'center';
            moreInfo.style.padding = '2rem';
            moreInfo.style.color = '#64748b';
            moreInfo.innerText = `현재 100개의 가게만 보여집니다. 검색 기능을 통해 더 찾아보세요! (총 ${stores.length}개 검색됨)`;
            storeGrid.appendChild(moreInfo);
        }
    }

    // 검색 기능
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            renderCards(allStores);
            return;
        }

        const filteredStores = allStores.filter(store => {
            const nameMatch = (store.name || '').toLowerCase().includes(searchTerm);
            const categoryMatch = (store.category || '').toLowerCase().includes(searchTerm);
            const addressMatch = (store.address || '').toLowerCase().includes(searchTerm);
            
            return nameMatch || categoryMatch || addressMatch;
        });

        renderCards(filteredStores);
    });
});
