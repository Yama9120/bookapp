// 図書館のコードのようなもの
let systemIds = [];
let librariesData = [];



// 図書館検索
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
    librariesData = data; // 図書館データを保存

    if (data && data.length > 0) {
        const selectElement = document.createElement('select');
        selectElement.id = 'library-select';

        data.forEach((library, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${library.formal} (${library.systemid})`;
            selectElement.appendChild(option);
        });

        resultsDiv.appendChild(selectElement);

        // 図書館リストを表示
        // data.forEach(library => {
        //     const libraryDiv = document.createElement('div');
        //     libraryDiv.textContent = `図書館名: ${library.formal}, 住所: ${library.address}, Libkey: ${library.libkey}`;
        //     resultsDiv.appendChild(libraryDiv);
        // });
    } else {
        resultsDiv.textContent = '該当する図書館が見つかりませんでした。';
    }
}



// 叢書検索
document.getElementById('book-search-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const selectElement = document.getElementById('library-select');
    const selectedIndex = selectElement.selectedIndex;
    const selectedLibrary = librariesData[selectedIndex];

    if (!selectedLibrary) {
        document.getElementById('book-search-results').textContent = '選択された図書館が見つかりません。';
        return;
    }

    const systemid = selectedLibrary.systemid;
    const isbn = document.getElementById('isbn').value;

    // 検索中の表示
    document.getElementById('book-search-results').textContent = '検索中...';

    searchBook(isbn, systemid, selectedLibrary);
});

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
            console.log('APIレスポンス:', data);
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
            document.getElementById('book-search-results').textContent = `蔵書データの取得に失敗しました: ${error.message}`;
        });
}

function displayBookResults(data, selectedLibrary) {
    const resultsDiv = document.getElementById('book-search-results');
    resultsDiv.innerHTML = '';

    if (data.books && typeof data.books === 'object') {
        let foundMatchingLibrary = false;

        for (const isbn in data.books) {
            if (data.books.hasOwnProperty(isbn)) {
                const bookInfo = data.books[isbn];
                
                let bookDisplayed = false;
                
                for (const libraryName in bookInfo) {
                    if (bookInfo.hasOwnProperty(libraryName)) {
                        const statusInfo = bookInfo[libraryName];
                        const libraryStatuses = statusInfo.libkey || {};
                        
                        // 選択された図書館のlibkeyと一致するかチェック
                        if (libraryStatuses.hasOwnProperty(selectedLibrary.libkey)) {
                            if (!bookDisplayed) {
                                const bookDiv = document.createElement('div');
                                bookDiv.textContent = `ISBN: ${isbn}`;
                                resultsDiv.appendChild(bookDiv);
                                bookDisplayed = true;
                            }

                            const statusDiv = document.createElement('div');
                            statusDiv.textContent = `${libraryName}: ${statusInfo.status}`;
                            resultsDiv.appendChild(statusDiv);

                            const libStatusDiv = document.createElement('div');
                            libStatusDiv.textContent = `${selectedLibrary.libkey}: ${libraryStatuses[selectedLibrary.libkey]}`;
                            resultsDiv.appendChild(libStatusDiv);

                            if (statusInfo.reserveurl) {
                                const reserveLink = document.createElement('a');
                                reserveLink.href = statusInfo.reserveurl;
                                reserveLink.textContent = '予約リンク';
                                reserveLink.target = '_blank';
                                resultsDiv.appendChild(reserveLink);
                            }

                            foundMatchingLibrary = true;
                        }
                    }
                }
            }
        }

        if (!foundMatchingLibrary) {
            resultsDiv.textContent = '選択された図書館に該当する蔵書が見つかりませんでした。';
        }
    } else {
        resultsDiv.textContent = '該当する蔵書が見つかりませんでした。';
    }
}