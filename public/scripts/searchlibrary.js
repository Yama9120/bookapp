// 図書館のコードのようなもの
let systemIds = [];
let librariesData = [];

// 都道府県と市区町村のデータ
let prefecturesData = {};

const prefSelect = document.getElementById('pref');
const citySelect = document.getElementById('city');

// デフォルト値の設定
const DEFAULT_PREFECTURE = "広島県";
const DEFAULT_CITY = "東広島市";

// JSONファイルを読み込む
fetch('../pref_and_city.json')
.then(response => response.json())
.then(data => {
    prefecturesData = data;
    populatePrefectures();
    setDefaultValues();
})
.catch(error => console.error('Error loading the JSON file:', error));

// 都道府県の選択
function populatePrefectures() {
    Object.keys(prefecturesData).forEach(pref => {
        const option = document.createElement('option');
        option.value = pref;
        option.textContent = pref;
        prefSelect.appendChild(option);
    });
}

// 市区町村の選択
function populateCities(prefecture) {
    citySelect.innerHTML = '<option value="">市区町村を選択してください</option>';
    
    if (prefecture && prefecturesData[prefecture]) {
        prefecturesData[prefecture].forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        });
    }
}

// デフォルト値を選択
function setDefaultValues() {
    if (prefecturesData[DEFAULT_PREFECTURE]) {
        prefSelect.value = DEFAULT_PREFECTURE;
        populateCities(DEFAULT_PREFECTURE);
        
        if (prefecturesData[DEFAULT_PREFECTURE].includes(DEFAULT_CITY)) {
            citySelect.value = DEFAULT_CITY;
        }
    }
}

// 都道府県選択時に市町村を更新
prefSelect.addEventListener('change', function() {
    const selectedPref = this.value;
    populateCities(selectedPref);
});


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

// 図書館データを表示する関数（蔵書検索を統合）
function displayLibraries(data) {
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = ''; // 前の結果をクリア
    librariesData = data; // 図書館データを保存

    if (data && data.length > 0) {
        // プルダウンを作成しないので、図書館データのみ保存
        console.log('図書館データを取得しました。');
    } else {
        resultsDiv.textContent = '該当する図書館が見つかりませんでした。';
    }
}


// 叢書検索（全ての取得した図書館で検索）
document.getElementById('book-search-form').addEventListener('submit', function(event) {
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


// ISBNを使って蔵書を検索する関数（各図書館ごとに）
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

// 蔵書データを表示する関数（図書館名、貸し出し可否、予約リンクを表示）
function displayBookResults(data, selectedLibrary) {
    const resultsDiv = document.getElementById('book-search-results');
    
    // 図書館ごとの蔵書結果表示領域
    const libraryDiv = document.createElement('div');
    libraryDiv.innerHTML = `<h4>${selectedLibrary.formal}</h4>`;  // 図書館名

    if (data.books && typeof data.books === 'object') {
        let foundMatchingLibrary = false;

        for (const isbn in data.books) {
            if (data.books.hasOwnProperty(isbn)) {
                const bookInfo = data.books[isbn];
                
                for (const libraryName in bookInfo) {
                    if (bookInfo.hasOwnProperty(libraryName)) {
                        const statusInfo = bookInfo[libraryName];
                        const libraryStatuses = statusInfo.libkey || {};
                        
                        // 選択された図書館のlibkeyと一致するかチェック
                        if (libraryStatuses.hasOwnProperty(selectedLibrary.libkey)) {
                            const availability = libraryStatuses[selectedLibrary.libkey] === '貸出可' ? 'o' : 'x';
                            libraryDiv.innerHTML += `<p>${isbn} - 貸し出し状況: ${availability}</p>`;

                            // 予約リンクがあれば表示
                            if (statusInfo.reserveurl && libraryStatuses[selectedLibrary.libkey] === '貸出可') {
                                const reserveLink = document.createElement('a');
                                reserveLink.href = statusInfo.reserveurl;
                                reserveLink.textContent = '予約';
                                reserveLink.target = '_blank';
                                libraryDiv.appendChild(reserveLink);
                            }

                            foundMatchingLibrary = true;
                        }
                    }
                }
            }
        }

        if (!foundMatchingLibrary) {
            libraryDiv.innerHTML += '<p>該当する蔵書が見つかりませんでした。</p>';
        }
    } else {
        libraryDiv.innerHTML += '<p>該当する蔵書が見つかりませんでした。</p>';
    }

    resultsDiv.appendChild(libraryDiv); // 各図書館の結果を追加
}
