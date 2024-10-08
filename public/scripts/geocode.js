document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('geocode-form');
    const keywordInput = document.getElementById('keyword-input');
    const resultDiv = document.getElementById('geocode-result');

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const keyword = keywordInput.value;

            if (keyword) {
                // Submitボタンを無効にする
                const submitButton = form.querySelector('button[type="submit"]');
                submitButton.disabled = true;

                getGeocode(keyword)
                    .then(geocode => {
                        displayResult(geocode);
                        const [longitude, latitude] = geocode.split(',');
                        return searchLibrary(longitude, latitude); // searchLibraryをPromiseチェーンの中で呼び出す
                    })
                    .catch(displayError)
                    .finally(() => {
                        // 最後にSubmitボタンを再度有効にする
                        submitButton.disabled = false;
                    });
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
                return data.geocode; // geocodeを返す
            });
    }

    function displayResult(geocode) {
        const [longitude, latitude] = geocode.split(',');

        // グローバル変数にセット
        globalLatitude = latitude;
        globalLongitude = longitude;

        // 結果を表示
        resultDiv.innerHTML = `
            <h3>検索結果</h3>
            <p>緯度,経度</p>
            <p>${latitude},${longitude}</p>
        `;
    }

    function searchLibrary(longitude, latitude) {
        // 緯度・経度を使ってAPIリクエストを送る
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
                // 図書館データの表示処理を追加
                displayLibraryResults(data);
            })
            .catch(error => {
                console.error('Library search failed:', error);
                displayError('図書館データの取得に失敗しました');
            });
    }

    function displayLibraryResults(libraries) {
        const libraryResultDiv = document.createElement('div');
        libraryResultDiv.innerHTML = `<h3>近くの図書館</h3>`;
        libraries.forEach(library => {
            const libraryDiv = document.createElement('div');
            libraryDiv.innerHTML = `
                <p>名前: ${library.libkey}</p>
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
