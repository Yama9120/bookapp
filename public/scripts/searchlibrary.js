let librariesData = []; // 図書館データを保存

// 図書館検索フォームの送信イベント
document.getElementById('library-search-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const geocode = `${encodeURIComponent(globalLongitude)},${encodeURIComponent(globalLatitude)}`;
    const url = `/searchLibrary?geocode=${geocode}`;

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

// 図書館データを表示し、蔵書検索を開始する
function displayLibraries(data) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = ''; // 前の結果をクリア
    librariesData = data; // 図書館データを保存

    if (data && data.length > 0) {
        console.log('図書館データを取得しました。');
    } else {
        resultsDiv.textContent = '該当する図書館が見つかりませんでした。';
    }
}

// 蔵書検索フォームの送信イベント
document.getElementById('book-search-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const isbn = document.getElementById('isbn').value;

    if (!librariesData || librariesData.length === 0) {
        document.getElementById('book-search-results').textContent = '検索する図書館が見つかりません。';
        return;
    }

    // 検索中の表示
    document.getElementById('book-search-results').textContent = '検索中...';

    // すべての図書館でISBN検索を行う
    librariesData.forEach(library => {
        searchBook(isbn, library.systemid, library);
    });
});

// ISBNを使って蔵書を検索する関数
function searchBook(isbn, systemid, selectedLibrary, session = null) {
    let url = `/searchBook?isbn=${encodeURIComponent(isbn)}&systemid=${encodeURIComponent(systemid)}`;
    if (session) {
        url += `&session=${encodeURIComponent(session)}`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTPエラー! ステータスコード: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.continue === 1) {
                // 2秒後に再度リクエストを送信
                setTimeout(() => {
                    searchBook(isbn, systemid, selectedLibrary, data.session);
                }, 2000);
            } else {
                displayBookResults(data, selectedLibrary);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const resultsDiv = document.getElementById('book-search-results');
            const errorDiv = document.createElement('div');
            errorDiv.textContent = `${selectedLibrary.formal}: 蔵書データの取得に失敗しました: ${error.message}`;
            resultsDiv.appendChild(errorDiv);
        });
}

// 蔵書データを表示する関数
function displayBookResults(data, selectedLibrary) {
    const resultsDiv = document.getElementById('book-search-results');
    
    const libraryDiv = document.createElement('div');
    libraryDiv.classList.add('library-result'); // 新しいクラスを追加

    const libraryNameDiv = document.createElement('div');
    libraryNameDiv.textContent = selectedLibrary.formal; // 図書館名

    const availabilityDiv = document.createElement('div');
    if (data.books && typeof data.books === 'object') {
        let foundMatchingLibrary = false;

        for (const isbn in data.books) {
            if (data.books.hasOwnProperty(isbn)) {
                const bookInfo = data.books[isbn];

                for (const libraryName in bookInfo) {
                    if (bookInfo.hasOwnProperty(libraryName)) {
                        const statusInfo = bookInfo[libraryName];
                        const libraryStatuses = statusInfo.libkey || {};

                        if (libraryStatuses.hasOwnProperty(selectedLibrary.libkey)) {
                            const availability = libraryStatuses[selectedLibrary.libkey] === '貸出可' ? '貸出可' : '貸出不可';
                            availabilityDiv.textContent = availability;

                            if (statusInfo.reserveurl && libraryStatuses[selectedLibrary.libkey] === '貸出可') {
                                const reserveLinkDiv = document.createElement('div');
                                const reserveLink = document.createElement('a');
                                reserveLink.href = statusInfo.reserveurl;
                                reserveLink.textContent = '予約する';
                                reserveLink.target = '_blank'; // 別タブで開く
                                reserveLinkDiv.appendChild(reserveLink);

                                libraryDiv.appendChild(reserveLinkDiv);
                            }

                            foundMatchingLibrary = true;
                        }
                    }
                }
            }
        }

        if (!foundMatchingLibrary) {
            availabilityDiv.textContent = '該当する蔵書が見つかりませんでした。';
        }
    } else {
        availabilityDiv.textContent = '該当する蔵書が見つかりませんでした。';
    }

    libraryDiv.appendChild(libraryNameDiv);  // 図書館名
    libraryDiv.appendChild(availabilityDiv); // 貸出状況

    resultsDiv.appendChild(libraryDiv); // 結果を追加
}
