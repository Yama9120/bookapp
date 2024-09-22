document.getElementById('library-search-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const pref = document.getElementById('pref').value;
    const city = document.getElementById('city').value;

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

            // systemidを保存
            currentSystemId = library.systemid; // 最後の図書館のsystemidを保存（必要に応じて修正）
        });
    } else {
        resultsDiv.textContent = '該当する図書館が見つかりませんでした。';
    }
}

document.getElementById('book-search-form').addEventListener('submit', function(event) {
    event.preventDefault(); // デフォルトの送信を防ぐ

    const systemid = document.getElementById('systemid').value; // システムIDをフォームから取得
    const isbn = document.getElementById('isbn').value; // ISBNをフォームから取得

    const url = `/searchBook?isbn=${encodeURIComponent(isbn)}&systemid=${encodeURIComponent(systemid)}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('APIレスポンス:', data); // ここでレスポンスを確認
            displayBookResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('book-search-results').textContent = `蔵書データの取得に失敗しました: ${error.message}`;
        });
});

function displayBookResults(data) {
    const resultsDiv = document.getElementById('book-search-results');
    resultsDiv.innerHTML = '';

    // booksがオブジェクトであることを確認
    if (data.books && typeof data.books === 'object') {
        for (const isbn in data.books) {
            if (data.books.hasOwnProperty(isbn)) {
                const bookInfo = data.books[isbn];
                
                // ISBNを表示
                const bookDiv = document.createElement('div');
                bookDiv.textContent = `ISBN: ${isbn}`;
                resultsDiv.appendChild(bookDiv);
                
                // 図書館ごとの状態を表示
                for (const library in bookInfo) {
                    if (bookInfo.hasOwnProperty(library)) {
                        const statusInfo = bookInfo[library];

                        // 各図書館の状態を表示
                        const statusDiv = document.createElement('div');
                        statusDiv.textContent = `${library}: ${statusInfo.status}`; // 状態を表示
                        resultsDiv.appendChild(statusDiv);

                        // 各図書館の貸出状況を表示
                        const libraryStatuses = statusInfo.libkey;
                        for (const lib in libraryStatuses) {
                            if (libraryStatuses.hasOwnProperty(lib)) {
                                const status = libraryStatuses[lib]; // 貸出状況を取得
                                const libStatusDiv = document.createElement('div');
                                libStatusDiv.textContent = `${lib}: ${status}`; // 図書館名と貸出状況を表示
                                resultsDiv.appendChild(libStatusDiv);
                            }
                        }

                        // 予約リンクを追加
                        if (statusInfo.reserveurl) {
                            const reserveLink = document.createElement('a');
                            reserveLink.href = statusInfo.reserveurl;
                            reserveLink.textContent = '予約リンク';
                            reserveLink.target = '_blank';
                            resultsDiv.appendChild(reserveLink);
                        }
                    }
                }
            }
        }
    } else {
        resultsDiv.textContent = '該当する蔵書が見つかりませんでした。';
    }
}
