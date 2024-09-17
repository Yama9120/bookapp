document.getElementById('library-search-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // フォームの入力値を取得
    const pref = document.getElementById('pref').value;
    const city = document.getElementById('city').value;

    // 図書館データの取得APIエンドポイントにリクエストを送信
    const url = `/searchLibrary?pref=${encodeURIComponent(pref)}&city=${encodeURIComponent(city)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayLibraries(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('search-results').textContent = `図書館データの取得に失敗しました: ${error.message}`;
        });
});

// 図書館データを表示する関数
function displayLibraries(data) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';

    if (data && data.length > 0) {
        data.forEach(library => {
            const libraryDiv = document.createElement('div');
            libraryDiv.textContent = `図書館名: ${library.formal}, 住所: ${library.address}`;
            resultsDiv.appendChild(libraryDiv);
        });
    } else {
        resultsDiv.textContent = '該当する図書館が見つかりませんでした。';
    }
}
