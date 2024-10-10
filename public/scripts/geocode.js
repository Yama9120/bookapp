document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('geocode-form');
    const keywordInput = document.getElementById('keyword-input');
    const resultDiv = document.getElementById('geocode-result');

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const keyword = keywordInput.value;

            if (keyword) {
                getGeocode(keyword)
                    .then(displayResult)
                    .then(({ longitude, latitude }) => searchLibrary(longitude, latitude))  // 緯度・経度を使って図書館検索
                    .catch(displayError);
            } else {
                displayError('キーワードを入力してください。');
            }
        });
    }

    function getGeocode(keyword) {
        return fetch(`/geocode?keyword=${encodeURIComponent(keyword)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('ネットワークレスポンスが正常ではありません');
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                return data.geocode;
            });
    }

    function displayResult(geocode) {
        const [longitude, latitude] = geocode.split(',');

        // 結果を表示しない
        // resultDiv.innerHTML = `
        //     <h3>検索結果</h3>
        //     <p>緯度,経度</p>
        //     <p>${latitude},${longitude}</p>
        // `;

        return { longitude, latitude }; // 緯度・経度をオブジェクトとして返す
    }

    function searchLibrary(longitude, latitude) {
        const geocode = `${longitude},${latitude}`;
        return fetch(`/searchLibrary?geocode=${encodeURIComponent(geocode)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('図書館データの取得に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                console.log('Library Search Results:', data);
                displayLibraryResults(data); // 図書館データの表示処理を追加
            })
            .catch(error => {
                console.error('Library search failed:', error);
                displayError('図書館データの取得に失敗しました');
            });
    }

    function displayLibraryResults(libraries) {
        // 結果をクリア
        resultDiv.innerHTML = '';

        const libraryResultDiv = document.createElement('div');
        libraryResultDiv.innerHTML = `<h3>近くの図書館</h3>`;
        libraries.forEach(library => {
            const libraryDiv = document.createElement('div');
            libraryDiv.innerHTML = `
                <p>名前: ${library.formal}</p>
                <p>住所: ${library.address}</p>
            `;
            libraryResultDiv.appendChild(libraryDiv);
        });
        resultDiv.appendChild(libraryResultDiv);
    }

    function displayError(message) {
        resultDiv.innerHTML = `<p class="error">${message}</p>`;
    }
});
