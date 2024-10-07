let globalLatitude, globalLongitude;  // グローバル変数として宣言

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

        // グローバル変数にセット
        globalLatitude = latitude;
        globalLongitude = longitude;

        resultDiv.innerHTML = `
            <h3>検索結果</h3>
            <p>緯度,経度</p>
            <p>${latitude},${longitude}</p>
        `;
    }

    function displayError(message) {
        resultDiv.innerHTML = `<p class="error">${message}</p>`;
    }
});
