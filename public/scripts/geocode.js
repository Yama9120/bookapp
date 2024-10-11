document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('geocode-form');
    const keywordInput = document.getElementById('keyword-input');
    const resultDiv = document.getElementById('geocode-result');
    const baseUrl = "<%= baseUrl %>";

    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            const keyword = keywordInput.value;

            if (keyword) {
                getGeocode(keyword)
                    .then(displayResult)
                    .then(geocode => searchLibrary(geocode))  // geocodeをそのまま渡す
                    .catch(displayError);
            } else {
                displayError('キーワードを入力してください。');
            }
        });
    }

    function getGeocode(keyword) {
        return fetch(`${baseUrl}geocode?keyword=${encodeURIComponent(keyword)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('ネットワークレスポンスが正常ではありません');
                }
                return response.json();
            })
            .then(data => {
                console.log('APIからのレスポンス:', data);
                if (data.error) {
                    throw new Error(data.error);
                }
                return data.geocode; // geocodeをそのまま返す
            });
    }

    function displayResult(geocode) {
        console.log('取得したgeocode:', geocode); // 追加: 取得したgeocodeを確認
        return geocode; // geocodeをそのまま返す
    }

    function searchLibrary(geocode) {
        // ここではgeocodeをそのまま使う
        const encodedGeocode = encodeURIComponent(geocode);
        return fetch(`${baseUrl}searchLibrary?geocode=${encodedGeocode}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('図書館データの取得に失敗しました');
                }
                return response.json();
            })
            .then(data => {
                console.log('Library Search Results:', data);
                displayLibraryResults(data);
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
